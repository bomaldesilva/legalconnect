<?php

declare(strict_types=1);

/**
 * File: ClientRecordService.php
 * Description: Business logic layer for Client Records.
 */
class ClientRecordService
{
    public function __construct(private ClientRecord $model)
    {
    }

    /**
     * Section: Fetch Lawyer Clients
     */
    public function getClientsForLawyer(int $lawyerId): array
    {
        return $this->model->getLawyerClients($lawyerId);
    }

    /**
     * Section: Fetch Single Client
     */
    public function getClientDetails(int $lawyerId, int $clientId): array
    {
        $client = $this->model->getLawyerClientDetails($lawyerId, $clientId);

        if ($client === null) {
            throw new RuntimeException('Client record not found for this lawyer.', 404);
        }

        return $client;
    }
}
