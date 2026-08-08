<?php

declare(strict_types=1);

/**
 * File: LegalCategoryService.php
 * Description: Business rules for the Legal Category module.
 * The controller delegates to this service and only handles HTTP concerns.
 */
class LegalCategoryService
{
    public function __construct(private LegalCategory $model)
    {
    }

    // -------------------------------------------------------------------------
    // Read operations
    // -------------------------------------------------------------------------

    public function getAll(): array
    {
        return $this->model->all();
    }

    /**
     * @throws RuntimeException with HTTP code 404 when not found.
     */
    public function getById(int $id): array
    {
        $category = $this->model->find($id);

        if ($category === null) {
            throw new RuntimeException('Legal category not found.', 404);
        }

        return $category;
    }

    // -------------------------------------------------------------------------
    // Write operations
    // -------------------------------------------------------------------------

    /**
     * Validates, enforces uniqueness, then creates.
     *
     * @param  array $data  Raw input from Request::body().
     * @return array        The newly created record.
     * @throws RuntimeException with HTTP code 400 on validation failure.
     */
    public function create(array $data): array
    {
        $errors = $this->validate($data);

        if ($errors !== []) {
            throw new ValidationException('Validation failed.', $errors);
        }

        if ($this->model->nameExists(trim((string) $data['category_name']))) {
            throw new ValidationException('Validation failed.', [
                'category_name' => 'Category name must be unique.',
            ]);
        }

        $id = $this->model->create($data);

        return $this->model->find($id);
    }

    /**
     * Validates, enforces uniqueness (excluding self), then updates.
     *
     * @param  int   $id    The category to update.
     * @param  array $data  Raw input from Request::body().
     * @return array        The updated record.
     * @throws RuntimeException on not-found or validation failure.
     */
    public function update(int $id, array $data): array
    {
        // Confirm record exists first.
        $this->getById($id);

        $errors = $this->validate($data);

        if ($errors !== []) {
            throw new ValidationException('Validation failed.', $errors);
        }

        if ($this->model->nameExists(trim((string) $data['category_name']), $id)) {
            throw new ValidationException('Validation failed.', [
                'category_name' => 'Category name must be unique.',
            ]);
        }

        $this->model->update($id, $data);

        return $this->model->find($id);
    }

    /**
     * Soft-deletes by setting status to Inactive.
     *
     * @param  int   $id
     * @return array The updated record.
     * @throws RuntimeException on not-found.
     */
    public function deactivate(int $id): array
    {
        // Confirm record exists first.
        $this->getById($id);

        $this->model->deactivate($id);

        return $this->model->find($id);
    }

    // -------------------------------------------------------------------------
    // Validation
    // -------------------------------------------------------------------------

    /**
     * Returns an associative array of field => error message.
     * An empty array means all rules passed.
     */
    private function validate(array $data): array
    {
        $errors = Validator::required($data, ['category_name']);

        if (!isset($errors['category_name'])) {
            $name = trim((string) $data['category_name']);

            if (strlen($name) > 100) {
                $errors['category_name'] = 'Category name must not exceed 100 characters.';
            }
        }

        $status      = $data['status'] ?? 'Active';
        $statusError = Validator::in('status', $status, ['Active', 'Inactive']);

        if ($statusError !== null) {
            $errors['status'] = $statusError;
        }

        return $errors;
    }
}
