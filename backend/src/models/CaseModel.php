<?php

declare(strict_types=1);

/**
 * File: CaseModel.php
 * Description: Data access model for Cases.
 * Fetches cases associated with a lawyer's clients.
 */
class CaseModel
{
    public function __construct(private PDO $db)
    {
    }

    /**
     * Section: Fetch Lawyer Cases
     * Retrieves all cases connected to a specific lawyer via client_records.
     */
    public function getLawyerCases(int $lawyerId): array
    {
        $statement = $this->db->prepare(
            "SELECT 
                c.case_id,
                c.case_title,
                cat.category_name AS category,
                CONCAT(u.first_name, ' ', u.last_name) AS client,
                c.status,
                c.open_date,
                c.description,
                'Pending' AS outcome -- Placeholder as outcome isn't in DB schema
             FROM cases c
             INNER JOIN client_records cr ON cr.record_id = c.record_id
             INNER JOIN clients cl ON cl.client_id = cr.client_id
             INNER JOIN users u ON u.user_id = cl.client_id
             LEFT JOIN legal_categories cat ON cat.category_id = c.category_id
             WHERE cr.lawyer_id = :lawyer_id
             ORDER BY c.created_at DESC"
        );
        $statement->execute(['lawyer_id' => $lawyerId]);
        
        return $statement->fetchAll();
    }

    /**
     * Section: Update Status
     * Updates the status of a specific case.
     */
    public function updateStatus(int $caseId, string $status): bool
    {
        $statement = $this->db->prepare(
            "UPDATE cases SET status = :status WHERE case_id = :id"
        );
        return $statement->execute([
            'status' => $status,
            'id' => $caseId
        ]);
    }

    /**
     * Section: Find
     * Finds a single case by ID.
     */
    public function find(int $id): ?array
    {
        $statement = $this->db->prepare(
            "SELECT * FROM cases WHERE case_id = :id"
        );
        $statement->execute(['id' => $id]);
        $row = $statement->fetch();
        return $row ?: null;
    }
}
