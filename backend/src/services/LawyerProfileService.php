<?php

declare(strict_types=1);

/**
 * File: LawyerProfileService.php
 * Description: Business rules for the Lawyer Profile module.
 * Controllers delegate every decision here; they only handle HTTP.
 */
class LawyerProfileService
{
    public function __construct(private LawyerProfile $model)
    {
    }

    // ─── Read operations ──────────────────────────────────────────────────────

    /**
     * Returns the full profile for a given lawyer.
     *
     * @throws RuntimeException 404 if the lawyer does not exist.
     */
    public function getProfile(int $lawyerId): array
    {
        $profile = $this->model->findWithUser($lawyerId);

        if ($profile === null) {
            throw new RuntimeException('Lawyer profile not found.', 404);
        }

        // Attach module summaries so the frontend gets everything in one call
        $profile['categories']           = $this->model->getCategories($lawyerId);
        $profile['package_summary']      = $this->model->getPackageSummary($lawyerId);
        $profile['availability_summary'] = $this->model->getAvailabilitySummary($lawyerId);

        return $profile;
    }

    /**
     * Returns the public, client-facing profile for a given lawyer.
     * Restricts to lawyers that exist (regardless of status — client may see
     * a suspended lawyer's profile to understand why they cannot book).
     *
     * @throws RuntimeException 404 if the lawyer does not exist.
     */
    public function getPublicProfile(int $lawyerId): array
    {
        $profile = $this->model->getPublicProfile($lawyerId);

        if ($profile === null) {
            throw new RuntimeException('Lawyer profile not found.', 404);
        }

        // Exclude sensitive fields before returning the public view
        unset(
            $profile['email'],
            $profile['password_hash'],
            $profile['verification_remarks']
        );

        return $profile;
    }

    // ─── Write operations ─────────────────────────────────────────────────────

    /**
     * Validates and updates the editable profile fields.
     *
     * @param  int   $lawyerId  The lawyer whose profile is being updated.
     * @param  array $data      Raw input from Request::body().
     * @return array            The refreshed profile.
     * @throws RuntimeException 404 if lawyer does not exist.
     * @throws ValidationException on invalid input.
     */
    public function updateProfile(int $lawyerId, array $data): array
    {
        // Ensure lawyer exists before attempting anything
        if (!$this->model->lawyerExists($lawyerId)) {
            throw new RuntimeException('Lawyer profile not found.', 404);
        }

        $errors = $this->validateProfile($data);

        if ($errors !== []) {
            throw new ValidationException('Validation failed.', $errors);
        }

        $this->model->updateProfile($lawyerId, $data);

        return $this->getProfile($lawyerId);
    }

    // ─── Legal categories ─────────────────────────────────────────────────────

    /**
     * Returns all legal categories assigned to this lawyer.
     *
     * @throws RuntimeException 404 if lawyer does not exist.
     */
    public function getCategories(int $lawyerId): array
    {
        if (!$this->model->lawyerExists($lawyerId)) {
            throw new RuntimeException('Lawyer profile not found.', 404);
        }

        return $this->model->getCategories($lawyerId);
    }

    /**
     * Assigns a new legal category to the lawyer.
     *
     * @param  int   $lawyerId
     * @param  array $data      Must contain 'category_id'.
     * @return array            Updated category list.
     * @throws RuntimeException 404 if lawyer does not exist.
     * @throws ValidationException on invalid/duplicate category.
     */
    public function addCategory(int $lawyerId, array $data): array
    {
        if (!$this->model->lawyerExists($lawyerId)) {
            throw new RuntimeException('Lawyer profile not found.', 404);
        }

        $errors = Validator::required($data, ['category_id']);

        if ($errors !== []) {
            throw new ValidationException('Validation failed.', $errors);
        }

        $categoryId = (int) $data['category_id'];

        if ($categoryId < 1 || !$this->model->categoryExists($categoryId)) {
            throw new ValidationException('Validation failed.', [
                'category_id' => 'Selected legal category is invalid or inactive.',
            ]);
        }

        if ($this->model->hasCategory($lawyerId, $categoryId)) {
            throw new ValidationException('Validation failed.', [
                'category_id' => 'This category is already assigned to your profile.',
            ]);
        }

        $this->model->addCategory($lawyerId, $categoryId);

        return $this->model->getCategories($lawyerId);
    }

    /**
     * Removes a legal category from the lawyer.
     *
     * @param  int $lawyerId
     * @param  int $categoryId
     * @return array           Updated category list.
     * @throws RuntimeException 404 if lawyer does not exist.
     */
    public function removeCategory(int $lawyerId, int $categoryId): array
    {
        if (!$this->model->lawyerExists($lawyerId)) {
            throw new RuntimeException('Lawyer profile not found.', 404);
        }

        $this->model->removeCategory($lawyerId, $categoryId);

        return $this->model->getCategories($lawyerId);
    }

    // ─── Validation ───────────────────────────────────────────────────────────

    /**
     * Validates editable profile fields.
     * Returns an associative array of field => error message.
     * An empty array means all rules passed.
     */
    private function validateProfile(array $data): array
    {
        $errors = Validator::required($data, ['first_name', 'last_name']);

        if (!isset($errors['first_name'])) {
            $firstName = trim((string) $data['first_name']);
            if (strlen($firstName) > 100) {
                $errors['first_name'] = 'First name must not exceed 100 characters.';
            }
        }

        if (!isset($errors['last_name'])) {
            $lastName = trim((string) $data['last_name']);
            if (strlen($lastName) > 100) {
                $errors['last_name'] = 'Last name must not exceed 100 characters.';
            }
        }

        // Optional fields — only validate length when provided
        if (!empty($data['bio'])) {
            if (strlen(trim((string) $data['bio'])) > 2000) {
                $errors['bio'] = 'Biography must not exceed 2000 characters.';
            }
        }

        if (!empty($data['education'])) {
            if (strlen(trim((string) $data['education'])) > 2000) {
                $errors['education'] = 'Education details must not exceed 2000 characters.';
            }
        }

        if (!empty($data['court'])) {
            if (strlen(trim((string) $data['court'])) > 150) {
                $errors['court'] = 'Court/Jurisdiction must not exceed 150 characters.';
            }
        }

        if (!empty($data['bar_registration_no'])) {
            if (strlen(trim((string) $data['bar_registration_no'])) > 50) {
                $errors['bar_registration_no'] = 'Bar registration number must not exceed 50 characters.';
            }
        }

        if (!empty($data['supreme_court_no'])) {
            if (strlen(trim((string) $data['supreme_court_no'])) > 50) {
                $errors['supreme_court_no'] = 'Supreme Court number must not exceed 50 characters.';
            }
        }

        if (isset($data['experience_years']) && $data['experience_years'] !== '' && $data['experience_years'] !== null) {
            $years = (int) $data['experience_years'];
            if ($years < 0 || $years > 60) {
                $errors['experience_years'] = 'Experience years must be between 0 and 60.';
            }
        }

        return $errors;
    }
}
