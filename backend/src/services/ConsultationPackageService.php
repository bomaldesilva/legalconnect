<?php

declare(strict_types=1);

class ConsultationPackageService
{
    public function __construct(private ConsultationPackage $model)
    {
    }

    public function getAll(): array
    {
        return $this->model->all();
    }

    public function getById(int $id): array
    {
        $package = $this->model->find($id);

        if ($package === null) {
            throw new RuntimeException('Consultation package not found.', 404);
        }

        return $package;
    }

    public function create(array $data): array
    {
        $errors = $this->validate($data);

        if ($errors !== []) {
            throw new ValidationException('Validation failed.', $errors);
        }

        $id = $this->model->create($data);

        return $this->model->find($id);
    }

    public function update(int $id, array $data): array
    {
        $this->getById($id);

        $errors = $this->validate($data);

        if ($errors !== []) {
            throw new ValidationException('Validation failed.', $errors);
        }

        $this->model->update($id, $data);

        return $this->model->find($id);
    }

    public function deactivate(int $id): array
    {
        $this->getById($id);
        $this->model->deactivate($id);

        return $this->model->find($id);
    }

    private function validate(array $data): array
    {
        $errors = Validator::required($data, [
            'lawyer_id',
            'package_name',
            'fee',
            'duration_minutes',
        ]);

        if ($errors !== []) {
            return $errors;
        }

        $lawyerId = (int) $data['lawyer_id'];

        if ($lawyerId < 1 || !$this->model->lawyerExists($lawyerId)) {
            $errors['lawyer_id'] = 'A valid active lawyer is required.';
        }

        $name = trim((string) $data['package_name']);

        if ($name === '' || strlen($name) > 150) {
            $errors['package_name'] = 'Package name is required and must not exceed 150 characters.';
        }

        if (!is_numeric($data['fee']) || (float) $data['fee'] < 0) {
            $errors['fee'] = 'Fee must be a non-negative number.';
        }

        $duration = (int) $data['duration_minutes'];

        if ($duration < 1) {
            $errors['duration_minutes'] = 'Duration must be at least 1 minute.';
        }

        $categoryId = isset($data['category_id']) && $data['category_id'] !== ''
            ? (int) $data['category_id']
            : null;

        if (!$this->model->categoryExists($categoryId)) {
            $errors['category_id'] = 'Selected legal category is invalid or inactive.';
        }

        $status = $data['status'] ?? 'Active';
        $statusError = Validator::in('status', $status, ['Active', 'Inactive']);

        if ($statusError !== null) {
            $errors['status'] = $statusError;
        }

        return $errors;
    }
}
