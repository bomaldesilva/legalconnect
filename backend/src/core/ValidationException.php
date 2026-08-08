<?php

declare(strict_types=1);

/**
 * File: ValidationException.php
 * Description: Thrown by Service classes when input data fails business-rule validation.
 * Carries a map of field => error message for standard 400 responses.
 */
class ValidationException extends RuntimeException
{
    /**
     * @param string  $message Human-readable summary.
     * @param array   $errors  Field-keyed error map e.g. ['name' => 'Name is required.']
     */
    public function __construct(string $message, private array $errors = [])
    {
        parent::__construct($message, 400);
    }

    public function getErrors(): array
    {
        return $this->errors;
    }
}
