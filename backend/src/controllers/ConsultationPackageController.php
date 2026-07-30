<?php

declare(strict_types=1);

class ConsultationPackageController
{
    public function __construct(private ConsultationPackageService $service)
    {
    }

    public function index(): void
    {
        Response::success($this->service->getAll(), 'Consultation packages loaded.');
    }

    public function show(int $id): void
    {
        try {
            Response::success($this->service->getById($id), 'Consultation package loaded.');
        } catch (RuntimeException $exception) {
            Response::error($exception->getMessage(), $exception->getCode() ?: 404);
        }
    }

    public function store(): void
    {
        try {
            $record = $this->service->create(Request::body());
            Response::success($record, 'Consultation package created.', 201);
        } catch (ValidationException $exception) {
            Response::error($exception->getMessage(), 400, $exception->getErrors());
        }
    }

    public function update(int $id): void
    {
        try {
            $record = $this->service->update($id, Request::body());
            Response::success($record, 'Consultation package updated.');
        } catch (ValidationException $exception) {
            Response::error($exception->getMessage(), 400, $exception->getErrors());
        } catch (RuntimeException $exception) {
            Response::error($exception->getMessage(), $exception->getCode() ?: 404);
        }
    }

    public function destroy(int $id): void
    {
        try {
            $record = $this->service->deactivate($id);
            Response::success($record, 'Consultation package deactivated.');
        } catch (RuntimeException $exception) {
            Response::error($exception->getMessage(), $exception->getCode() ?: 404);
        }
    }
}
