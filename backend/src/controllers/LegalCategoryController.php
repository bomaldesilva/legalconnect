<?php

declare(strict_types=1);

/**
 * File: LegalCategoryController.php
 * Description: HTTP Controller for managing Legal Categories. 
 * Reads the request, delegates all business logic to LegalCategoryService,
 * and writes the JSON responses.
 */
class LegalCategoryController
{
    public function __construct(private LegalCategoryService $service)
    {
    }

    /**
     * Section: Fetch All Categories
     * Retrieves all legal categories and returns a success response.
     */
    public function index(): void
    {
        Response::success($this->service->getAll(), 'Legal categories loaded.');
    }

    /**
     * Section: Fetch Single Category
     * Retrieves a single legal category by ID. Returns 404 if not found.
     */
    public function show(int $id): void
    {
        try {
            Response::success($this->service->getById($id), 'Legal category loaded.');
        } catch (RuntimeException $exception) {
            Response::error($exception->getMessage(), $exception->getCode() ?: 404);
        }
    }

    /**
     * Section: Create Category
     * Parses the request body and creates a new legal category.
     */
    public function store(): void
    {
        try {
            $record = $this->service->create(Request::body());
            Response::success($record, 'Legal category created.', 201);
        } catch (ValidationException $exception) {
            Response::error($exception->getMessage(), 400, $exception->getErrors());
        }
    }

    /**
     * Section: Update Category
     * Parses the request body and updates an existing legal category.
     */
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

    /**
     * Section: Deactivate Category
     * Marks a legal category as deactivated.
     */
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
