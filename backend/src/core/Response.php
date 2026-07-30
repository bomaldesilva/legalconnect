<?php

declare(strict_types=1);

class Response
{
    public static function json(array $payload, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    }

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
