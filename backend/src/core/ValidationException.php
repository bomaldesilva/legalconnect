<?php

declare(strict_types=1);

/**
 * ValidationException
 *
 * Thrown by Service classes when input data fails business-rule validation.
 * Carries a map of field => error message so the controller can return
 * a structured 400 response without knowing the validation details.
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
