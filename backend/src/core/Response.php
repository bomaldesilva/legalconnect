<?php

declare(strict_types=1);

/**
 * File: Response.php
 * Description: Core Response Handling. This file provides a utility class to format 
 * and output standard JSON responses across the API.
 */
class Response
{
    /**
     * Section: Base JSON Output
     * Outputs a raw JSON payload with the appropriate headers.
     */
    public static function json(array $payload, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    }

    /**
     * Section: Success Responses
     * Formats and outputs a standard success response with optional data payload.
     */
    public static function success(mixed $data = null, string $message = 'Success', int $statusCode = 200): void
    {
        $payload = [
            'success' => true,
            'message' => $message,
        ];

        if ($data !== null) {
            $payload['data'] = $data;
        }

        self::json($payload, $statusCode);
    }

    /**
     * Section: Error Responses
     * Formats and outputs a standard error response with optional validation errors.
     */
    public static function error(string $message, int $statusCode = 400, array $errors = []): void
    {
        $payload = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== []) {
            $payload['errors'] = $errors;
        }

        self::json($payload, $statusCode);
    }
}
