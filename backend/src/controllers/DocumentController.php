<?php

declare(strict_types=1);

/**
 * File: DocumentController.php
 * Description: API Controller for Lawyer's Documents.
 */
class DocumentController
{
    public function __construct(private DocumentService $service)
    {
    }

    /**
     * Section: Index
     * GET /api/lawyer-documents?lawyer_id=...
     */
    public function index(): void
    {
        try {
            $lawyerId = (int) ($_GET['lawyer_id'] ?? 0);
            if ($lawyerId <= 0) {
                Response::error('lawyer_id is required', 400);
            }
            
            $documents = $this->service->getDocumentsForLawyer($lawyerId);
            Response::json($documents);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * Section: Store
     * POST /api/lawyer-documents
     */
    public function store(): void
    {
        try {
            $lawyerId = (int) ($_POST['lawyer_id'] ?? 0);
            if ($lawyerId <= 0) {
                Response::error('lawyer_id is required', 400);
            }
            
            if (!isset($_FILES['document'])) {
                Response::error('No file uploaded', 400);
            }

            $result = $this->service->uploadDocument($_POST, $_FILES['document']);
            Response::json($result, 201);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
