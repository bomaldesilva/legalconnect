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
}
