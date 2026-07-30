<?php

declare(strict_types=1);

/**
 * AvailabilitySlotController
 *
 * Thin HTTP adapter for the Availability Slot module.
 * Reads the request, delegates all business logic to AvailabilitySlotService,
 * then writes the JSON response.
 */
class AvailabilitySlotController
{
    public function __construct(private AvailabilitySlotService $service)
    {
    }

    public function index(): void
    {
        Response::success($this->service->getAll(), 'Availability slots loaded.');
    }

    public function show(int $id): void
    {
        try {
            Response::success($this->service->getById($id), 'Availability slot loaded.');
        } catch (RuntimeException $exception) {
            Response::error($exception->getMessage(), $exception->getCode() ?: 404);
        }
    }

    public function store(): void
    {
        try {
            $record = $this->service->create(Request::body());
            Response::success($record, 'Availability slot created.', 201);
        } catch (ValidationException $exception) {
            Response::error($exception->getMessage(), 400, $exception->getErrors());
        }
    }

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
