<?php

declare(strict_types=1);

/**
 * File: LawyerProfileController.php
 * Description: HTTP Controller for managing Lawyer Profiles.
 * Reads the request, delegates all business logic to LawyerProfileService,
 * then writes the JSON response.
 *
 * Route responsibilities:
 *   GET    /api/lawyer-profile/{id}                  → show
 *   PUT    /api/lawyer-profile/{id}                  → update
 *   GET    /api/lawyer-profile/{id}/categories       → listCategories
 *   POST   /api/lawyer-profile/{id}/categories       → addCategory
 *   DELETE /api/lawyer-profile/{id}/categories/{cid} → removeCategory
 *   GET    /api/lawyer-profile/{id}/public            → publicProfile
 */
class LawyerProfileController
{
    public function __construct(private LawyerProfileService $service)
    {
    }

    // ─── Profile ──────────────────────────────────────────────────────────────

    /**
     * GET /api/lawyer-profile/{id}
     * Returns the full editable profile for the given lawyer.
     */
    public function show(int $lawyerId): void
    {
        try {
            Response::success($this->service->getProfile($lawyerId), 'Lawyer profile loaded.');
        } catch (RuntimeException $exception) {
            Response::error($exception->getMessage(), $exception->getCode() ?: 404);
        }
    }

    /**
     * PUT /api/lawyer-profile/{id}
     * Updates editable profile fields (personal info + professional info).
     * Verification status and rating are intentionally not modifiable here.
     */
    public function update(int $lawyerId): void
    {
        try {
            $record = $this->service->updateProfile($lawyerId, Request::body());
            Response::success($record, 'Profile updated successfully.');
        } catch (ValidationException $exception) {
            Response::error($exception->getMessage(), 400, $exception->getErrors());
        } catch (RuntimeException $exception) {
            Response::error($exception->getMessage(), $exception->getCode() ?: 404);
        }
    }

    // ─── Legal categories ─────────────────────────────────────────────────────

    /**
     * GET /api/lawyer-profile/{id}/categories
     * Returns the list of legal categories assigned to this lawyer.
     */
    public function listCategories(int $lawyerId): void
    {
        try {
            Response::success(
                $this->service->getCategories($lawyerId),
                'Lawyer categories loaded.'
            );
        } catch (RuntimeException $exception) {
            Response::error($exception->getMessage(), $exception->getCode() ?: 404);
        }
    }

    /**
     * POST /api/lawyer-profile/{id}/categories
     * Assigns a new legal category to this lawyer.
     * Body: { "category_id": 3 }
     */
    public function addCategory(int $lawyerId): void
    {
        try {
            $categories = $this->service->addCategory($lawyerId, Request::body());
            Response::success($categories, 'Legal category added to profile.', 201);
        } catch (ValidationException $exception) {
            Response::error($exception->getMessage(), 400, $exception->getErrors());
        } catch (RuntimeException $exception) {
            Response::error($exception->getMessage(), $exception->getCode() ?: 404);
        }
    }

    /**
     * DELETE /api/lawyer-profile/{id}/categories/{categoryId}
     * Removes a legal category from this lawyer's profile.
     */
    public function removeCategory(int $lawyerId, int $categoryId): void
    {
        try {
            $categories = $this->service->removeCategory($lawyerId, $categoryId);
            Response::success($categories, 'Legal category removed from profile.');
        } catch (RuntimeException $exception) {
            Response::error($exception->getMessage(), $exception->getCode() ?: 404);
        }
    }

    // ─── Public / client-facing profile ──────────────────────────────────────

    /**
     * GET /api/lawyer-profile/{id}/public
     * Returns the read-only client-facing profile for a lawyer.
     * Sensitive fields (email, verification_remarks) are stripped by the service.
     */
    public function publicProfile(int $lawyerId): void
    {
        try {
            Response::success(
                $this->service->getPublicProfile($lawyerId),
                'Public lawyer profile loaded.'
            );
        } catch (RuntimeException $exception) {
            Response::error($exception->getMessage(), $exception->getCode() ?: 404);
        }
    }
}
