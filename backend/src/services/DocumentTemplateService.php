<?php

declare(strict_types=1);

/**
 * File: DocumentTemplateService.php
 * Description: Business logic layer for Document Templates.
 */
class DocumentTemplateService
{
    public function __construct(private DocumentTemplate $model)
    {
    }

    /**
     * Section: Fetch All Templates
     */
    public function getAllTemplates(): array
    {
        return $this->model->getAllTemplates();
    }
}
