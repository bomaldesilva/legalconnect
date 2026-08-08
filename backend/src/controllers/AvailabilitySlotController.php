<?php

declare(strict_types=1);

/**
 * File: AvailabilitySlotController.php
 * Description: HTTP Controller for managing Lawyer Availability Slots. 
 * Reads the request, delegates business logic to AvailabilitySlotService, 
 * and returns JSON responses.
 */
class AvailabilitySlotController
{
    public function __construct(private AvailabilitySlotService $service)
    {
    }

    /**
     * Section: Fetch All Slots
     * Retrieves all availability slots and returns a success response.
     */
    public function index(): void
    {
        Response::success($this->service->getAll(), 'Availability slots loaded.');
    }

    /**
     * Section: Fetch Single Slot
     * Retrieves a slot by ID. Returns 404 if not found.
     */
    public function show(int $id): void
    {
        try {
            Response::success($this->service->getById($id), 'Availability slot loaded.');
        } catch (RuntimeException $exception) {
            Response::error($exception->getMessage(), $exception->getCode() ?: 404);
        }
    }

    /**
     * Section: Create Slot
     * Parses the request body and creates a new availability slot.
     */
    public function store(): void
    {
        try {
            $record = $this->service->create(Request::body());
            Response::success($record, 'Availability slot created.', 201);
        } catch (ValidationException $exception) {
            Response::error($exception->getMessage(), 400, $exception->getErrors());
        }
    }

    /**
     * Section: Update Slot
     * Parses the request body and updates an existing slot.
     */
    public function update(int $id): void
    {
        try {
            $record = $this->service->update($id, Request::body());
            Response::success($record, 'Availability slot updated.');
        } catch (ValidationException $exception) {
            Response::error($exception->getMessage(), 400, $exception->getErrors());
        } catch (RuntimeException $exception) {
            Response::error($exception->getMessage(), $exception->getCode() ?: 404);
        }
    }

    /**
     * Section: Cancel Slot
     * Marks an availability slot as cancelled.
     */
    public function destroy(int $id): void
    {
        try {
            $record = $this->service->cancel($id);
            Response::success($record, 'Availability slot cancelled.');
        } catch (RuntimeException $exception) {
            Response::error($exception->getMessage(), $exception->getCode() ?: 404);
        }
    }
}
