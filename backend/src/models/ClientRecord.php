<?php

declare(strict_types=1);

/**
 * File: ClientRecord.php
 * Description: Data access model for Client Records.
 * Connects lawyers to their clients and fetches client statistics.
 */
class ClientRecord
{
    public function __construct(private PDO $db)
    {
    }

    /**
     * Section: Fetch Lawyer Clients
     * Retrieves all clients associated with a specific lawyer, including case counts.
     */
    public function getLawyerClients(int $lawyerId): array
    {
        $statement = $this->db->prepare(
            "SELECT 
                c.client_id AS id,
                CONCAT(u.first_name, ' ', u.last_name) AS name,
                u.email,
                cr.status,
                DATE(cr.created_at) AS since,
                (SELECT COUNT(*) FROM cases WHERE record_id = cr.record_id) AS cases
             FROM client_records cr
             INNER JOIN clients c ON c.client_id = cr.client_id
             INNER JOIN users u ON u.user_id = c.client_id
             WHERE cr.lawyer_id = :lawyer_id
             ORDER BY cr.created_at DESC"
        );
        $statement->execute(['lawyer_id' => $lawyerId]);
        
        return $statement->fetchAll();
    }

    /**
     * Section: Fetch Single Client
     * Retrieves detailed information about a single client for a lawyer.
     */
    public function getLawyerClientDetails(int $lawyerId, int $clientId): ?array
    {
        $statement = $this->db->prepare(
            "SELECT 
                c.client_id AS id,
                CONCAT(u.first_name, ' ', u.last_name) AS name,
                u.email,
                cr.status,
                DATE(cr.created_at) AS since,
                (SELECT COUNT(*) FROM cases WHERE record_id = cr.record_id) AS cases
             FROM client_records cr
             INNER JOIN clients c ON c.client_id = cr.client_id
             INNER JOIN users u ON u.user_id = c.client_id
             WHERE cr.lawyer_id = :lawyer_id AND cr.client_id = :client_id"
        );
        $statement->execute(['lawyer_id' => $lawyerId, 'client_id' => $clientId]);
        $row = $statement->fetch();
        
        return $row ?: null;
    }
}
