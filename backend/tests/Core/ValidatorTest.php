<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class ValidatorTest extends TestCase
{
    public function testRequiredReturnsEmptyArrayWhenAllFieldsPresent(): void
    {
        $errors = Validator::required(['name' => 'Family Law'], ['name']);

        $this->assertSame([], $errors);
    }

    public function testRequiredFlagsMissingField(): void
    {
        $errors = Validator::required([], ['category_name']);

        $this->assertSame(['category_name' => 'Category name is required.'], $errors);
    }

    public function testRequiredFlagsEmptyAndWhitespaceValues(): void
    {
        $errors = Validator::required(
            ['a' => '', 'b' => '   ', 'c' => 'ok'],
            ['a', 'b', 'c']
        );

        $this->assertArrayHasKey('a', $errors);
        $this->assertArrayHasKey('b', $errors);
        $this->assertArrayNotHasKey('c', $errors);
    }

    public function testRequiredAcceptsZeroAsPresent(): void
    {
        $errors = Validator::required(['count' => 0], ['count']);

        $this->assertSame([], $errors);
    }

    public function testInReturnsNullForAllowedValue(): void
    {
        $this->assertNull(Validator::in('status', 'Active', ['Active', 'Inactive']));
    }

    public function testInReturnsErrorForDisallowedValue(): void
    {
        $error = Validator::in('status', 'Archived', ['Active', 'Inactive']);

        $this->assertSame('Status must be one of: Active, Inactive.', $error);
    }

    public function testInUsesStrictComparison(): void
    {
        $this->assertNotNull(Validator::in('id', '1', [1, 2, 3]));
    }
}
