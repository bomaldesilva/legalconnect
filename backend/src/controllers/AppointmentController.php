<?php

declare(strict_types=1);

class AppointmentController
{
    public function __construct(private AppointmentService $service)
    {
    }

    public function index(): void
    {
        Response::success($this->service->getAll(), 'Appointments loaded.');
    }

    public function show(int $id): void
    {
        try {
            Response::success($this->service->getById($id), 'Appointment loaded.');
        } catch (RuntimeException $exception) {
            Response::error($exception->getMessage(), $exception->getCode() ?: 404);
        }
    }

    public function store(): void
    {
        try {
            $record = $this->service->create(Request::body());
            Response::success($record, 'Appointment created.', 201);
        } catch (ValidationException $exception) {
            Response::error($exception->getMessage(), 400, $exception->getErrors());
        }
    }

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
