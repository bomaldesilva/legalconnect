<?php

declare(strict_types=1);

/**
 * File: CaseService.php
 * Description: Business logic layer for Cases.
 */
class CaseService
{
    public function __construct(private CaseModel $model)
    {
    }

    /**
     * Section: Fetch Lawyer Cases
     */
    public function getCasesForLawyer(int $lawyerId): array
    {
        return $this->model->getLawyerCases($lawyerId);
    }

    /**
     * Section: Close Case
     * Sets the status of a case to Closed.
     */
    public function closeCase(int $caseId): array
    {
        $case = $this->model->find($caseId);
        if (!$case) {
            throw new RuntimeException('Case not found', 404);
        }

        $this->model->updateStatus($caseId, 'Closed');
        
        $updated = $this->model->find($caseId);
        return $updated ?: [];
    }
}
