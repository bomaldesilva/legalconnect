<?php

declare(strict_types=1);

/**
 * File: ConsultationPackageController.php
 * Description: HTTP Controller for managing Consultation Packages.
 * Reads requests, delegates to ConsultationPackageService, and writes JSON responses.
 */
class ConsultationPackageController
{
    public function __construct(private ConsultationPackageService $service)
    {
    }

    /**
     * Section: Fetch All Packages
     * Retrieves all consultation packages and returns a success response.
     */
    public function index(): void
    {
        Response::success($this->service->getAll(), 'Consultation packages loaded.');
    }

    /**
     * Section: Fetch Single Package
     * Retrieves a consultation package by ID. Returns 404 if not found.
     */
    public function show(int $id): void
    {
        try {
            Response::success($this->service->getById($id), 'Consultation package loaded.');
        } catch (RuntimeException $exception) {
            Response::error($exception->getMessage(), $exception->getCode() ?: 404);
        }
    }

    /**
     * Section: Create Package
     * Parses the request body and creates a new consultation package.
     */
    public function store(): void
    {
        try {
            $record = $this->service->create(Request::body());
            Response::success($record, 'Consultation package created.', 201);
        } catch (ValidationException $exception) {
            Response::error($exception->getMessage(), 400, $exception->getErrors());
        }
    }

    /**
     * Section: Update Package
     * Parses the request body and updates an existing consultation package.
     */
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

    /**
     * Section: Deactivate Package
     * Deactivates a consultation package instead of hard deleting it.
     */
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
