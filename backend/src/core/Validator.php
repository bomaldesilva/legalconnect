<?php

declare(strict_types=1);

class Validator
{
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

    public static function in(string $field, mixed $value, array $allowedValues): ?string
    {
        if (!in_array($value, $allowedValues, true)) {
            return ucfirst(str_replace('_', ' ', $field)) . ' must be one of: ' . implode(', ', $allowedValues) . '.';
        }

        return null;
    }
}
