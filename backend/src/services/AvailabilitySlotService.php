<?php

declare(strict_types=1);

/**
 * File: AvailabilitySlotService.php
 * Description: Business rules for the Availability Slot module.
 * Handles date/time format validation, time-ordering rules,
 * duplicate detection, and lawyer existence checks.
 */
class AvailabilitySlotService
{
    public function __construct(private AvailabilitySlot $model)
    {
    }

    // -------------------------------------------------------------------------
    // Read operations
    // -------------------------------------------------------------------------

    public function getAll(): array
    {
        return $this->model->all();
    }

    /**
     * @throws RuntimeException with HTTP code 404 when not found.
     */
    public function getById(int $id): array
    {
        $slot = $this->model->find($id);

        if ($slot === null) {
            throw new RuntimeException('Availability slot not found.', 404);
        }

        return $slot;
    }

    // -------------------------------------------------------------------------
    // Write operations
    // -------------------------------------------------------------------------

    /**
     * Validates all rules, checks for duplicates, then creates.
     *
     * @param  array $data  Raw input from Request::body().
     * @return array        The newly created record.
     * @throws ValidationException on validation/duplicate failure.
     */
    public function create(array $data): array
    {
        $errors = $this->validate($data);

        if ($errors !== []) {
            throw new ValidationException('Validation failed.', $errors);
        }

        if ($this->model->duplicateExists($data)) {
            throw new ValidationException('Validation failed.', [
                'slot' => 'A slot with the same lawyer, date, start time, and end time already exists.',
            ]);
        }

        $id = $this->model->create($data);

        return $this->model->find($id);
    }

    /**
     * Checks existence, validates all rules, checks for duplicates (excluding
     * the current record), then updates.
     *
     * @param  int   $id
     * @param  array $data  Raw input from Request::body().
     * @return array        The updated record.
     * @throws RuntimeException on not-found.
     * @throws ValidationException on validation/duplicate failure.
     */
    public function update(int $id, array $data): array
    {
        // Confirm record exists first.
        $this->getById($id);

        $errors = $this->validate($data);

        if ($errors !== []) {
            throw new ValidationException('Validation failed.', $errors);
        }

        if ($this->model->duplicateExists($data, $id)) {
            throw new ValidationException('Validation failed.', [
                'slot' => 'A slot with the same lawyer, date, start time, and end time already exists.',
            ]);
        }

        $this->model->update($id, $data);

        return $this->model->find($id);
    }

    /**
     * Soft-cancels by setting status to Cancelled.
     *
     * @param  int   $id
     * @return array The updated record.
     * @throws RuntimeException on not-found.
     */
    public function cancel(int $id): array
    {
        // Confirm record exists first.
        $this->getById($id);

        $this->model->cancel($id);

        return $this->model->find($id);
    }

    // -------------------------------------------------------------------------
    // Validation
    // -------------------------------------------------------------------------

    /**
     * Returns an associative array of field => error message.
     * An empty array means all rules passed.
     */
    private function validate(array $data): array
    {
        // Required fields must be present and non-empty.
        $errors = Validator::required($data, [
            'lawyer_id',
            'available_date',
            'start_time',
            'end_time',
        ]);

        // Stop early if required fields are missing so later checks
        // do not run against null/empty values.
        if ($errors !== []) {
            return $errors;
        }

        // Lawyer must exist and be active.
        $lawyerId = (int) $data['lawyer_id'];

        if ($lawyerId < 1 || !$this->model->lawyerExists($lawyerId)) {
            $errors['lawyer_id'] = 'A valid active lawyer is required.';
        }

        // Date must be a valid calendar date in YYYY-MM-DD format.
        if (!$this->isValidDate((string) $data['available_date'])) {
            $errors['available_date'] = 'Available date must be a valid date (YYYY-MM-DD).';
        }

        // Start and end times must be valid HH:MM or HH:MM:SS values.
        $startOk = $this->isValidTime((string) $data['start_time']);
        $endOk   = $this->isValidTime((string) $data['end_time']);

        if (!$startOk) {
            $errors['start_time'] = 'Start time must be a valid time (HH:MM).';
        }

        if (!$endOk) {
            $errors['end_time'] = 'End time must be a valid time (HH:MM).';
        }

        // End time must be strictly after start time.
        if ($startOk && $endOk) {
            $start = strtotime((string) $data['start_time']);
            $end   = strtotime((string) $data['end_time']);

            if ($end <= $start) {
                $errors['end_time'] = 'End time must be after start time.';
            }
        }

        // Status must be one of the allowed enum values.
        $status      = $data['status'] ?? 'Available';
        $statusError = Validator::in('status', $status, ['Available', 'Booked', 'Cancelled']);

        if ($statusError !== null) {
            $errors['status'] = $statusError;
        }

        return $errors;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

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
