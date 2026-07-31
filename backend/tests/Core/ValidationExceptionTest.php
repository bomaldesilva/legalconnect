<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class ValidationExceptionTest extends TestCase
{
    public function testCarriesMessageAndErrors(): void
    {
        $errors = ['name' => 'Name is required.'];
        $exception = new ValidationException('Validation failed.', $errors);

        $this->assertSame('Validation failed.', $exception->getMessage());
        $this->assertSame($errors, $exception->getErrors());
        $this->assertSame(400, $exception->getCode());
    }

    public function testDefaultsToEmptyErrors(): void
    {
        $exception = new ValidationException('Validation failed.');

        $this->assertSame([], $exception->getErrors());
    }

    public function testIsRuntimeException(): void
    {
        $this->assertInstanceOf(RuntimeException::class, new ValidationException('x'));
    }
}
