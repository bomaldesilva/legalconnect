<?php

declare(strict_types=1);

/**
 * File: Request.php
 * Description: Core Request Handling. This file provides a utility class to parse 
 * incoming HTTP requests and extract the request body uniformly.
 */
class Request
{
    /**
     * Parses the HTTP request body and returns it as an associative array.
     * 
     * Handles JSON payloads and standard URL-encoded form payloads for POST, PUT, etc.
     *
     * @return array The parsed request body data.
     */
    public static function body(): array
    {
        // Get the Content-Type header to determine how to parse the payload
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

        // Section: Handle JSON Payloads
        if (str_contains($contentType, 'application/json')) {
            $rawBody = file_get_contents('php://input');
            $decodedBody = json_decode($rawBody ?: '', true);

            return is_array($decodedBody) ? $decodedBody : [];
        }

        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

        // Section: Handle standard POST Form Data
        if ($method === 'POST') {
            return $_POST;
        }

        // Section: Handle other methods (PUT, PATCH) with Form Data
        parse_str(file_get_contents('php://input') ?: '', $parsedBody);

        return is_array($parsedBody) ? $parsedBody : [];
    }
}
