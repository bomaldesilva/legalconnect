<?php

declare(strict_types=1);

/**
 * File: DocumentTemplateController.php
 * Description: API Controller for Document Templates.
 */
class DocumentTemplateController
{
    public function __construct(private DocumentTemplateService $service)
    {
    }

    /**
     * Section: Index
     * GET /api/templates
     */
    public function index(): void
    {
        try {
            $templates = $this->service->getAllTemplates();
            Response::json($templates);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
