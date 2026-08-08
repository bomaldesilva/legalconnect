<?php

declare(strict_types=1);

/**
 * File: ClientRecordController.php
 * Description: API Controller for Lawyer's Client Records.
 */
class ClientRecordController
{
    public function __construct(private ClientRecordService $service)
    {
    }

    /**
     * Section: Index
     * GET /api/lawyer-clients?lawyer_id=...
     */
    public function index(): void
    {
        try {
            $lawyerId = (int) ($_GET['lawyer_id'] ?? 0);
            if ($lawyerId <= 0) {
                Response::error('lawyer_id is required', 400);
            }
            
            $clients = $this->service->getClientsForLawyer($lawyerId);
            Response::json($clients);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * Section: Show
     * GET /api/lawyer-clients/{clientId}?lawyer_id=...
     */
    public function show(int $clientId): void
    {
        try {
            $lawyerId = (int) ($_GET['lawyer_id'] ?? 0);
            if ($lawyerId <= 0) {
                Response::error('lawyer_id is required', 400);
            }
            
            $client = $this->service->getClientDetails($lawyerId, $clientId);
            Response::json($client);
        } catch (RuntimeException $e) {
            Response::error($e->getMessage(), $e->getCode() ?: 400);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }
    
    // Additional methods like store, update, destroy can be added later if lawyers can add clients manually.
}
