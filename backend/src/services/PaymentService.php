<?php

declare(strict_types=1);

/**
 * File: PaymentService.php
 * Description: Business logic layer for Payments.
 * Handles validation and interacts with the Payment model.
 */
class PaymentService
{
    public function __construct(private Payment $model)
    {
    }

    /**
     * Section: Fetch All Payments
     * Retrieves all payment records via the model.
     */
    public function getAll(): array
    {
        return $this->model->all();
    }

    /**
     * Section: Fetch Single Payment
     * Retrieves a payment by ID, throwing a 404 if not found.
     */
    public function getById(int $id): array
    {
        $payment = $this->model->find($id);

        if ($payment === null) {
            throw new RuntimeException('Payment record not found.', 404);
        }

        return $payment;
    }

    /**
     * Section: Create Payment
     * Validates input data, normalizes it, and creates a new payment record.
     */
    public function create(array $data): array
    {
        $errors = $this->validate($data);

        if ($errors !== []) {
            throw new ValidationException('Validation failed.', $errors);
        }

        $payload = $this->normalize($data);
        $id = $this->model->create($payload);

        return $this->model->find($id);
    }

    /**
     * Section: Update Payment
     * Ensures the payment exists, validates input data, and updates the record.
     */
    public function update(int $id, array $data): array
    {
        $this->getById($id);

        $errors = $this->validate($data, $id);

        if ($errors !== []) {
            throw new ValidationException('Validation failed.', $errors);
        }

        $payload = $this->normalize($data);
        $this->model->update($id, $payload);

        return $this->model->find($id);
    }

    /**
     * Section: Mark Payment Failed
     * Changes the status of the payment to Failed instead of deleting it entirely.
     */
    public function markFailed(int $id): array
    {
        $this->getById($id);
        $this->model->markFailed($id);

        return $this->model->find($id);
    }

    private function normalize(array $data): array
    {
        $status = $data['payment_status'] ?? 'Pending';
        $paidAt = $data['paid_at'] ?? null;

        if ($status === 'Paid' && ($paidAt === null || $paidAt === '')) {
            $paidAt = date('Y-m-d H:i:s');
        }

        if ($status !== 'Paid') {
            $paidAt = ($paidAt === '' || $paidAt === null) ? null : $paidAt;
        }

        return [
            'appointment_id' => (int) $data['appointment_id'],
            'amount' => $data['amount'],
            'payment_method' => $data['payment_method'] ?? null,
            'payment_status' => $status,
            'payment_reference' => $data['payment_reference'] ?? null,
            'paid_at' => $paidAt,
        ];
    }

    private function validate(array $data, ?int $excludeId = null): array
    {
        $errors = Validator::required($data, [
            'appointment_id',
            'amount',
        ]);

        if ($errors !== []) {
            return $errors;
        }

        $appointmentId = (int) $data['appointment_id'];

        if ($appointmentId < 1 || !$this->model->appointmentExists($appointmentId)) {
            $errors['appointment_id'] = 'A valid appointment is required.';
        }

        if (!is_numeric($data['amount']) || (float) $data['amount'] < 0) {
            $errors['amount'] = 'Amount must be a non-negative number.';
        }

        $status = $data['payment_status'] ?? 'Pending';
        $statusError = Validator::in(
            'payment_status',
            $status,
            ['Pending', 'Paid', 'Failed', 'Refunded']
        );

        if ($statusError !== null) {
            $errors['payment_status'] = $statusError;
        }

        $reference = trim((string) ($data['payment_reference'] ?? ''));

        if ($reference !== '' && $this->model->referenceExists($reference, $excludeId)) {
            $errors['payment_reference'] = 'Payment reference must be unique.';
        }

        return $errors;
    }
}
