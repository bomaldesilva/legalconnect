<?php

declare(strict_types=1);

class Request
{
    public static function body(): array
    {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

        if (str_contains($contentType, 'application/json')) {
            $rawBody = file_get_contents('php://input');
            $decodedBody = json_decode($rawBody ?: '', true);

            return is_array($decodedBody) ? $decodedBody : [];
        }

        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

        if ($method === 'POST') {
            return $_POST;
        }

        parse_str(file_get_contents('php://input') ?: '', $parsedBody);

        return is_array($parsedBody) ? $parsedBody : [];
    }
}
