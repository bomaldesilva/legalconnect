<?php

declare(strict_types=1);

/**
 * LegalCategoryController
 *
 * Thin HTTP adapter for the Legal Category module.
 * Reads the request, delegates all business logic to LegalCategoryService,
 * then writes the JSON response.
 */
class LegalCategoryController
{
    public function __construct(private LegalCategoryService $service)
    {
    }

    public function index(): void
    {
        Response::success($this->service->getAll(), 'Legal categories loaded.');
    }

    public function show(int $id): void
    {
        try {
            Response::success($this->service->getById($id), 'Legal category loaded.');
        } catch (RuntimeException $exception) {
            Response::error($exception->getMessage(), $exception->getCode() ?: 404);
        }
    }

    public function store(): void
    {
        try {
            $record = $this->service->create(Request::body());
            Response::success($record, 'Legal category created.', 201);
        } catch (ValidationException $exception) {
            Response::error($exception->getMessage(), 400, $exception->getErrors());
        }
    }

    public function update(int $id): void
    {
        try {
            $record = $this->service->update($id, Request::body());
            Response::success($record, 'Legal category updated.');
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
            Response::success($record, 'Legal category deactivated.');
        } catch (RuntimeException $exception) {
            Response::error($exception->getMessage(), $exception->getCode() ?: 404);
        }
    }
}
