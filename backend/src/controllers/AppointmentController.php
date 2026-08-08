<?php

declare(strict_types=1);

/**
 * File: AppointmentController.php
 * Description: HTTP Controller for managing Appointments. It handles incoming requests,
 * delegates business logic to the AppointmentService, and formats the JSON responses.
 */
class AppointmentController
{
    public function __construct(private AppointmentService $service)
    {
    }

    /**
     * Section: Fetch All Appointments
     * Retrieves all appointments and returns a success response.
     */
    public function index(): void
    {
        Response::success($this->service->getAll(), 'Appointments loaded.');
    }

    /**
     * Section: Fetch Single Appointment
     * Retrieves an appointment by ID. Returns 404 if not found.
     */
    public function show(int $id): void
    {
        try {
            Response::success($this->service->getById($id), 'Appointment loaded.');
        } catch (RuntimeException $exception) {
            Response::error($exception->getMessage(), $exception->getCode() ?: 404);
        }
    }

    /**
     * Section: Create Appointment
     * Parses the request body and attempts to create a new appointment.
     * Returns 400 with field errors if validation fails.
     */
    public function store(): void
    {
        try {
            $record = $this->service->create(Request::body());
            Response::success($record, 'Appointment created.', 201);
        } catch (ValidationException $exception) {
            Response::error($exception->getMessage(), 400, $exception->getErrors());
        }
    }

    /**
     * Section: Update Appointment
     * Parses the request body and updates an existing appointment.
     */
    public function update(int $id): void
    {
        try {
            $record = $this->service->update($id, Request::body());
            Response::success($record, 'Appointment updated.');
        } catch (ValidationException $exception) {
            Response::error($exception->getMessage(), 400, $exception->getErrors());
        } catch (RuntimeException $exception) {
            Response::error($exception->getMessage(), $exception->getCode() ?: 404);
        }
    }

    /**
     * Section: Cancel Appointment
     * Soft-deletes or marks an appointment as cancelled.
     */
    public function destroy(int $id): void
    {
        try {
            $record = $this->service->cancel($id);
            Response::success($record, 'Appointment cancelled.');
        } catch (RuntimeException $exception) {
            Response::error($exception->getMessage(), $exception->getCode() ?: 404);
        }
    }
}
