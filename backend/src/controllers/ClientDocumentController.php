<?php

declare(strict_types=1);

/**
 * File: ClientDocumentController.php
 * Description: API Controller for Client's Documents (CRUD).
 */
class ClientDocumentController
{
    public function __construct(private DocumentService $service)
    {
    }

    /**
     * Section: Index (Read)
     * GET /api/client-documents?client_id=...
     */
    public function index(): void
    {
        try {
            $clientId = (int) ($_GET['client_id'] ?? 0);
            if ($clientId <= 0) {
                Response::error('client_id is required', 400);
            }
            
            $documents = $this->service->getClientDocuments($clientId);
            Response::json($documents);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * Section: Store (Create)
     * POST /api/client-documents
     */
    public function store(): void
    {
        try {
            $clientId = (int) ($_POST['client_id'] ?? 0);
            if ($clientId <= 0) {
                Response::error('client_id is required', 400);
            }
            
            if (!isset($_FILES['document'])) {
                Response::error('No file uploaded', 400);
            }

            $result = $this->service->uploadClientDocument($_POST, $_FILES['document']);
            Response::json($result, 201);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * Section: Update (Update)
     * PUT or POST /api/client-documents/{id}
     */
    public function update(int $docId): void
    {
        try {
            // For PUT/PATCH we usually parse php://input. However, if they use FormData with POST to support files,
            // we will check POST. Let's support both.
            $data = $_POST;
            if (empty($data)) {
                $raw = file_get_contents('php://input');
                $data = json_decode($raw, true) ?? [];
            }

            $clientId = (int) ($data['client_id'] ?? 0);
            if ($clientId <= 0) {
                Response::error('client_id is required for update', 400);
            }

            $result = $this->service->updateDocument($docId, $data);
            Response::json($result);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * Section: Destroy (Delete)
     * DELETE /api/client-documents/{id}?client_id=...
     */
    public function destroy(int $docId): void
    {
        try {
            // Can be passed via query string or body depending on request
            $clientId = (int) ($_GET['client_id'] ?? 0);
            if ($clientId <= 0) {
                $raw = file_get_contents('php://input');
                $data = json_decode($raw, true) ?? [];
                $clientId = (int) ($data['client_id'] ?? 0);
            }

            if ($clientId <= 0) {
                Response::error('client_id is required for deletion', 400);
            }

            $result = $this->service->deleteDocument($docId, $clientId);
            Response::json($result);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
