<?php

declare(strict_types=1);

/**
 * File: CaseController.php
 * Description: API Controller for Lawyer's Cases.
 */
class CaseController
{
    public function __construct(private CaseService $service)
    {
    }

    /**
     * Section: Index
     * GET /api/lawyer-cases?lawyer_id=...
     */
    public function index(): void
    {
        try {
            $lawyerId = (int) ($_GET['lawyer_id'] ?? 0);
            if ($lawyerId <= 0) {
                Response::error('lawyer_id is required', 400);
            }
            
            $cases = $this->service->getCasesForLawyer($lawyerId);
            Response::json($cases);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * Section: Update
     * PUT /api/lawyer-cases/{caseId}
     * Used for closing a case currently.
     */
    public function update(int $caseId): void
    {
        try {
            $data = Request::json();
            
            // For now, we just support closing cases
            if (isset($data['action']) && $data['action'] === 'close') {
                $case = $this->service->closeCase($caseId);
                Response::json($case);
                return;
            }

            Response::error('Invalid action', 400);
        } catch (RuntimeException $e) {
            Response::error($e->getMessage(), $e->getCode() ?: 400);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
