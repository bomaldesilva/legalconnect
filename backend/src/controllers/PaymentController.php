<?php

declare(strict_types=1);

class PaymentController
{
    public function __construct(private PaymentService $service)
    {
    }

    public function index(): void
    {
        Response::success($this->service->getAll(), 'Payment records loaded.');
    }

    public function show(int $id): void
    {
        try {
            Response::success($this->service->getById($id), 'Payment record loaded.');
        } catch (RuntimeException $exception) {
            Response::error($exception->getMessage(), $exception->getCode() ?: 404);
        }
    }

    public function store(): void
    {
        try {
            $record = $this->service->create(Request::body());
            Response::success($record, 'Payment record created.', 201);
        } catch (ValidationException $exception) {
            Response::error($exception->getMessage(), 400, $exception->getErrors());
        }
    }

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
