<?php

declare(strict_types=1);

/**
 * File: Validator.php
 * Description: Core Data Validation. This file contains a utility class for validating 
 * incoming data payloads against predefined business rules.
 */
class Validator
{
    /**
     * Section: Required Fields Validation
     * Checks if a list of required fields is present and not empty in the data array.
     * 
     * @return array Associative array of field-specific error messages.
     */
    public static function required(array $data, array $fields): array
    {
        $errors = [];

        foreach ($fields as $field) {
            if (!isset($data[$field]) || trim((string) $data[$field]) === '') {
                $errors[$field] = ucfirst(str_replace('_', ' ', $field)) . ' is required.';
            }
        }

        return $errors;
    }

    /**
     * Section: Enum/Allowed Values Validation
     * Checks if a single field's value exists within a specific array of allowed values.
     * 
     * @return string|null Error message string if invalid, null if valid.
     */
    public static function in(string $field, mixed $value, array $allowedValues): ?string
    {
        if (!in_array($value, $allowedValues, true)) {
            return ucfirst(str_replace('_', ' ', $field)) . ' must be one of: ' . implode(', ', $allowedValues) . '.';
        }

        return null;
    }
}
