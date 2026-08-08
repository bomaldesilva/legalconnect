<?php

declare(strict_types=1);

/**
 * File: PaymentController.php
 * Description: HTTP Controller for managing Payments.
 * Reads requests, delegates to PaymentService, and handles responses.
 */
class PaymentController
{
    public function __construct(private PaymentService $service)
    {
    }

    /**
     * Section: Fetch All Payments
     * Retrieves all payment records.
     */
    public function index(): void
    {
        Response::success($this->service->getAll(), 'Payment records loaded.');
    }

    /**
     * Section: Fetch Single Payment
     * Retrieves a payment record by ID.
     */
    public function show(int $id): void
    {
        try {
            Response::success($this->service->getById($id), 'Payment record loaded.');
        } catch (RuntimeException $exception) {
            Response::error($exception->getMessage(), $exception->getCode() ?: 404);
        }
    }

    /**
     * Section: Create Payment
     * Creates a new payment record (e.g. tracking an appointment payment).
     */
    public function store(): void
    {
        try {
            $record = $this->service->create(Request::body());
            Response::success($record, 'Payment record created.', 201);
        } catch (ValidationException $exception) {
            Response::error($exception->getMessage(), 400, $exception->getErrors());
        }
    }

    /**
     * Section: Update Payment
     * Updates an existing payment record.
     */
    public function update(int $id): void
    {
        try {
            $record = $this->service->update($id, Request::body());
            Response::success($record, 'Payment record updated.');
        } catch (ValidationException $exception) {
            Response::error($exception->getMessage(), 400, $exception->getErrors());
        } catch (RuntimeException $exception) {
            Response::error($exception->getMessage(), $exception->getCode() ?: 404);
        }
    }

    /**
     * Section: Mark Payment Failed
     * Marks a payment status as failed instead of deleting it entirely.
     */
    public function destroy(int $id): void
    {
        try {
            $record = $this->service->markFailed($id);
            Response::success($record, 'Payment record marked as failed.');
        } catch (RuntimeException $exception) {
            Response::error($exception->getMessage(), $exception->getCode() ?: 404);
        }
    }
}
