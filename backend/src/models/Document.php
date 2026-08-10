<?php

declare(strict_types=1);

/**
 * File: Document.php
 * Description: Data access model for Documents.
 */
class Document
{
    public function __construct(private PDO $db)
    {
    }

    /**
     * Section: Fetch Lawyer Documents
     * Retrieves all documents uploaded by or for cases managed by the lawyer.
     */
    public function getLawyerDocuments(int $lawyerId): array
    {
        $statement = $this->db->prepare(
            "SELECT 
                d.document_id AS id,
                d.file_name AS name,
                c.case_title AS case_name,
                DATE(d.uploaded_at) AS uploaded,
                d.file_type AS type,
                '1.0 MB' AS size, -- Mocked size as no column exists
                d.file_path
             FROM documents d
             LEFT JOIN cases c ON c.case_id = d.case_id
             LEFT JOIN client_records cr ON cr.record_id = c.record_id
             WHERE d.uploaded_by_user_id = :lawyer_id OR cr.lawyer_id = :lawyer_id
             ORDER BY d.uploaded_at DESC"
        );
        $statement->execute(['lawyer_id' => $lawyerId]);
        
        return $statement->fetchAll();
    }

    /**
     * Section: Fetch Client Documents
     */
    public function getClientDocuments(int $clientId): array
    {
        $statement = $this->db->prepare(
            "SELECT 
                document_id AS doc_id,
                file_name,
                category,
                file_size,
                DATE(uploaded_at) AS upload_date,
                document_status AS status,
                file_type,
                notes,
                file_path
             FROM documents
             WHERE uploaded_by_user_id = :client_id
             ORDER BY uploaded_at DESC"
        );
        $statement->execute(['client_id' => $clientId]);
        
        return $statement->fetchAll();
    }

    /**
     * Section: Create Document
     */
    public function create(array $data): int
    {
        $statement = $this->db->prepare(
            "INSERT INTO documents (case_id, uploaded_by_user_id, file_name, file_path, file_type, category, file_size, notes, document_status)
             VALUES (:case_id, :user_id, :file_name, :file_path, :file_type, :category, :file_size, :notes, 'Uploaded')"
        );
        $statement->execute([
            'case_id' => !empty($data['case_id']) ? (int) $data['case_id'] : null,
            'user_id' => (int) $data['uploaded_by_user_id'],
            'file_name' => $data['file_name'],
            'file_path' => $data['file_path'],
            'file_type' => $data['file_type'] ?? null,
            'category'  => $data['category'] ?? null,
            'file_size' => $data['file_size'] ?? null,
            'notes'     => $data['notes'] ?? null
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Section: Update Document
     */
    public function update(int $docId, array $data): bool
    {
        $statement = $this->db->prepare(
            "UPDATE documents 
             SET category = :category, notes = :notes 
             WHERE document_id = :doc_id AND uploaded_by_user_id = :client_id"
        );
        return $statement->execute([
            'category' => $data['category'] ?? null,
            'notes'    => $data['notes'] ?? null,
            'doc_id'   => $docId,
            'client_id'=> (int) $data['client_id']
        ]);
    }

    /**
     * Section: Delete Document
     */
    public function delete(int $docId, int $clientId): bool
    {
        // Delete the database record
        $statement = $this->db->prepare(
            "DELETE FROM documents WHERE document_id = :doc_id AND uploaded_by_user_id = :client_id"
        );
        return $statement->execute([
            'doc_id' => $docId,
            'client_id' => $clientId
        ]);
    }
}
