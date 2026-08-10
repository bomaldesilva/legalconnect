<?php

declare(strict_types=1);

/**
 * File: DocumentService.php
 * Description: Business logic layer for Documents.
 */
class DocumentService
{
    public function __construct(private Document $model)
    {
    }

    /**
     * Section: Fetch Lawyer Documents
     */
    public function getDocumentsForLawyer(int $lawyerId): array
    {
        return $this->model->getLawyerDocuments($lawyerId);
    }
    
    /**
     * Section: Upload Document
     */
    public function uploadDocument(array $data, array $file): array
    {
        // Simple mock of file upload path
        $uploadDir = __DIR__ . '/../../../storage/uploads/';
        if (!is_dir($uploadDir)) {
            @mkdir($uploadDir, 0777, true);
        }
        
        $fileName = basename($file['name']);
        $filePath = '/uploads/' . uniqid() . '_' . $fileName;
        
        // Skip actual move_uploaded_file for local dev if file isn't real
        // if (move_uploaded_file($file['tmp_name'], $uploadDir . basename($filePath))) { ... }
        
        $docData = [
            'case_id' => $data['case_id'] ?? null,
            'uploaded_by_user_id' => $data['lawyer_id'],
            'file_name' => $fileName,
            'file_path' => $filePath,
            'file_type' => $file['type'] ?? 'application/octet-stream'
        ];
        
        $id = $this->model->create($docData);
        return ['id' => $id, 'status' => 'success'];
    }
    /**
     * Section: Fetch Client Documents
     */
    public function getClientDocuments(int $clientId): array
    {
        return $this->model->getClientDocuments($clientId);
    }

    /**
     * Section: Upload Client Document
     */
    public function uploadClientDocument(array $data, array $file): array
    {
        $uploadDir = __DIR__ . '/../../../storage/uploads/';
        if (!is_dir($uploadDir)) {
            @mkdir($uploadDir, 0777, true);
        }
        
        $fileName = basename($file['name']);
        $filePath = '/uploads/' . uniqid() . '_' . $fileName;
        
        // In a real app we'd move_uploaded_file here, mocked for dev
        
        // Calculate size nicely
        $bytes = $file['size'] ?? 0;
        $size = ($bytes >= 1048576) ? round($bytes / 1048576, 2) . ' MB' : round($bytes / 1024, 2) . ' KB';
        
        $docData = [
            'case_id' => $data['case_id'] ?? null,
            'uploaded_by_user_id' => $data['client_id'],
            'file_name' => $fileName,
            'file_path' => $filePath,
            'file_type' => $file['type'] ?? 'application/pdf',
            'category'  => $data['category'] ?? 'General',
            'file_size' => $size,
            'notes'     => $data['notes'] ?? null
        ];
        
        $id = $this->model->create($docData);
        return ['id' => $id, 'status' => 'success', 'message' => 'Document uploaded successfully'];
    }

    /**
     * Section: Update Document
     */
    public function updateDocument(int $docId, array $data): array
    {
        $success = $this->model->update($docId, $data);
        if (!$success) {
            throw new Exception("Failed to update document or document not found.");
        }
        return ['status' => 'success', 'message' => 'Document updated successfully'];
    }

    /**
     * Section: Delete Document
     */
    public function deleteDocument(int $docId, int $clientId): array
    {
        $success = $this->model->delete($docId, $clientId);
        if (!$success) {
            throw new Exception("Failed to delete document or document not found.");
        }
        return ['status' => 'success', 'message' => 'Document deleted successfully'];
    }
}
