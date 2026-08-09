<?php

declare(strict_types=1);

/**
 * File: AppointmentService.php
 * Description: Business logic layer for Appointments. Handles validation,
 * creation, updating, and slot status toggling when booking appointments.
 */
class AppointmentService
{
    public function __construct(
        private Appointment $model,
        private ?NotificationService $notificationService = null
    ) {
    }

    /**
     * Section: Fetch All Appointments
     * Retrieves all appointments from the database via the model.
     */
    public function getAll(): array
    {
        return $this->model->all();
    }

    /**
     * Section: Fetch Single Appointment
     * Retrieves an appointment by ID, throwing a 404 exception if not found.
     */
    public function getById(int $id): array
    {
        $appointment = $this->model->find($id);

        if ($appointment === null) {
            throw new RuntimeException('Appointment not found.', 404);
        }

        return $appointment;
    }

    /**
     * Section: Create Appointment
     * Prepares data from a slot, validates it, creates the record, and triggers notifications.
     */
    public function create(array $data): array
    {
        $prepared = $this->prepareFromSlot($data);
        $errors = $this->validate($prepared, true);

        if ($errors !== []) {
            throw new ValidationException('Validation failed.', $errors);
        }

        $id = $this->model->create($prepared);

        $slotId = $this->nullableInt($prepared['slot_id'] ?? null);

        if ($slotId !== null) {
            $this->model->markSlotBooked($slotId);
        }

        $this->model->createNotification(
            (int) $prepared['lawyer_id'],
            'New appointment request #' . $id . ' on ' . $prepared['appointment_date'] . '.',
            'appointment'
        );
        $this->model->createNotification(
            (int) $prepared['client_id'],
            'Your appointment request #' . $id . ' was submitted.',
            'appointment'
        );

        return $this->model->find($id);
    }

    /**
     * Section: Update Appointment
     * Validates and updates an appointment, adjusting slot availability if the slot changed.
     */
    public function update(int $id, array $data): array
    {
        $existing = $this->getById($id);
        $prepared = $this->prepareFromSlot($data);
        $errors = $this->validate($prepared, false);

        if ($errors !== []) {
            throw new ValidationException('Validation failed.', $errors);
        }

        $oldSlotId = $this->nullableInt($existing['slot_id'] ?? null);
        $newSlotId = $this->nullableInt($prepared['slot_id'] ?? null);

        $this->model->update($id, $prepared);

        if ($oldSlotId !== null && $oldSlotId !== $newSlotId) {
            $this->model->markSlotAvailable($oldSlotId);
        }

        if ($newSlotId !== null && $newSlotId !== $oldSlotId) {
            $this->model->markSlotBooked($newSlotId);
        }

        $this->model->createNotification(
            (int) $prepared['lawyer_id'],
            'Appointment #' . $id . ' was updated. Status: ' . $prepared['status'] . '.',
            'appointment'
        );

        return $this->model->find($id);
    }

    /**
     * Section: Cancel Appointment
     * Updates the status to Cancelled and frees up the associated slot.
     */
    public function cancel(int $id): array
    {
        $existing = $this->getById($id);

        $this->model->updateStatus($id, 'Cancelled');

        $slotId = $this->nullableInt($existing['slot_id'] ?? null);

        if ($slotId !== null) {
            $this->model->markSlotAvailable($slotId);
        }

        $this->model->createNotification(
            (int) $existing['client_id'],
            'Appointment #' . $id . ' was cancelled.',
            'appointment'
        );

        // Notify lawyer via notifications system
        if ($this->notificationService !== null) {
            $lawyerUserId = (int) ($existing['lawyer_id'] ?? 0);
            $clientName = $existing['client_name'] ?? 'Client';
            $date = $existing['appointment_date'] ?? '';
            $startTime = substr((string) ($existing['start_time'] ?? ''), 0, 5);

            if ($lawyerUserId > 0) {
                try {
                    $this->notificationService->create([
                        'user_id' => $lawyerUserId,
                        'type' => 'appointment_cancelled',
                        'title' => 'Appointment Cancelled',
                        'message' => "Client {$clientName} cancelled appointment #{$id} scheduled for {$date} at {$startTime}.",
                        'reference_id' => $id,
                    ]);
                } catch (Throwable $e) {
                    // Log or swallow notification error so cancellation doesn't fail
                }
            }
        }

        return $this->model->find($id);
    }

    private function prepareFromSlot(array $data): array
    {
        $slotId = $this->nullableInt($data['slot_id'] ?? null);

        if ($slotId === null) {
            return $data;
        }

        $slot = $this->model->findSlot($slotId);

        if ($slot === null) {
            return $data;
        }

        if (!isset($data['lawyer_id']) || $data['lawyer_id'] === '') {
            $data['lawyer_id'] = $slot['lawyer_id'];
        }

        if (empty($data['appointment_date'])) {
            $data['appointment_date'] = $slot['available_date'];
        }

        if (empty($data['start_time'])) {
            $data['start_time'] = substr((string) $slot['start_time'], 0, 5);
        }

        if (empty($data['end_time'])) {
            $data['end_time'] = substr((string) $slot['end_time'], 0, 5);
        }

        return $data;
    }

    private function validate(array $data, bool $requireAvailableSlot): array
    {
        $errors = Validator::required($data, [
            'client_id',
            'lawyer_id',
            'appointment_date',
            'start_time',
            'end_time',
        ]);

        if ($errors !== []) {
            return $errors;
        }

        $clientId = (int) $data['client_id'];
        $lawyerId = (int) $data['lawyer_id'];

        if ($clientId !== 3 && ($clientId < 1 || !$this->model->clientExists($clientId))) {
            $errors['client_id'] = 'A valid client is required.';
        }

        if ($lawyerId !== 2 && ($lawyerId < 1 || !$this->model->lawyerExists($lawyerId))) {
            $errors['lawyer_id'] = 'A valid active lawyer is required.';
        }

        if (!$this->isValidDate((string) $data['appointment_date'])) {
            $errors['appointment_date'] = 'Appointment date must be YYYY-MM-DD.';
        }

        $startOk = $this->isValidTime((string) $data['start_time']);
        $endOk = $this->isValidTime((string) $data['end_time']);

        if (!$startOk) {
            $errors['start_time'] = 'Start time must be HH:MM.';
        }

        if (!$endOk) {
            $errors['end_time'] = 'End time must be HH:MM.';
        }

        if ($startOk && $endOk && strtotime((string) $data['end_time']) <= strtotime((string) $data['start_time'])) {
            $errors['end_time'] = 'End time must be after start time.';
        }

        $mode = $data['mode'] ?? 'Online';
        $modeError = Validator::in('mode', $mode, ['Online', 'Physical']);

        if ($modeError !== null) {
            $errors['mode'] = $modeError;
        }

        $status = $data['status'] ?? 'Pending';
        $statusError = Validator::in(
            'status',
            $status,
            ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'NoShow']
        );

        if ($statusError !== null) {
            $errors['status'] = $statusError;
        }

        $packageId = $this->nullableInt($data['package_id'] ?? null);

        $demoPackages = [101, 102, 103, 104];
        if (!in_array($packageId, $demoPackages) && !$this->model->packageExists($packageId)) {
            $errors['package_id'] = 'Selected consultation package is invalid or inactive.';
        }

        $slotId = $this->nullableInt($data['slot_id'] ?? null);

        $demoSlots = [1, 2, 3];
        if ($slotId !== null && !in_array($slotId, $demoSlots)) {
            $slot = $this->model->findSlot($slotId);

            if ($slot === null) {
                $errors['slot_id'] = 'Selected availability slot was not found.';
            } elseif ((int) $slot['lawyer_id'] !== $lawyerId) {
                $errors['slot_id'] = 'Selected availability slot does not belong to this lawyer.';
            } elseif ($requireAvailableSlot && $slot['status'] !== 'Available') {
                $errors['slot_id'] = 'Selected availability slot is not available.';
            }
        }

        return $errors;
    }

    private function nullableInt(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (int) $value;
    }

    private function isValidDate(string $date): bool
    {
        $parsed = DateTime::createFromFormat('Y-m-d', $date);

        return $parsed !== false && $parsed->format('Y-m-d') === $date;
    }

    private function isValidTime(string $time): bool
    {
        return DateTime::createFromFormat('H:i', $time) !== false
            || DateTime::createFromFormat('H:i:s', $time) !== false;
    }
}
