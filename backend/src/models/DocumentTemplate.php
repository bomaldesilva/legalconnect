<?php

declare(strict_types=1);

/**
 * File: DocumentTemplate.php
 * Description: Data access model for Document Templates.
 */
class DocumentTemplate
{
    public function __construct(private PDO $db)
    {
    }

    /**
     * Section: Fetch All Templates
     * Retrieves all templates, joined with their legal category.
     */
    public function getAllTemplates(): array
    {
        $statement = $this->db->query(
            "SELECT 
                dt.template_id AS id,
                dt.template_name AS name,
                lc.category_name AS category,
                dt.description,
                DATE(dt.updated_at) AS lastUpdated,
                dt.status,
                dt.template_path
             FROM document_templates dt
             LEFT JOIN legal_categories lc ON lc.category_id = dt.category_id
             ORDER BY dt.template_name ASC"
        );
        
        return $statement->fetchAll();
    }
}
