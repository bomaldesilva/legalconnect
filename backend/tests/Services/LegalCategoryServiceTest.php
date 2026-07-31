<?php

declare(strict_types=1);

use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

final class LegalCategoryServiceTest extends TestCase
{
    private LegalCategory&MockObject $model;
    private LegalCategoryService $service;

    protected function setUp(): void
    {
        $this->model = $this->createMock(LegalCategory::class);
        $this->service = new LegalCategoryService($this->model);
    }

    public function testGetAllReturnsAllCategories(): void
    {
        $rows = [['category_id' => 1, 'category_name' => 'Family Law']];
        $this->model->method('all')->willReturn($rows);

        $this->assertSame($rows, $this->service->getAll());
    }

    public function testGetByIdReturnsCategory(): void
    {
        $row = ['category_id' => 5, 'category_name' => 'Criminal Law'];
        $this->model->method('find')->with(5)->willReturn($row);

        $this->assertSame($row, $this->service->getById(5));
    }

    public function testGetByIdThrowsNotFound(): void
    {
        $this->model->method('find')->willReturn(null);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionCode(404);
        $this->service->getById(99);
    }

    public function testCreateReturnsNewRecord(): void
    {
        $data = ['category_name' => 'Tax Law'];
        $row = ['category_id' => 7, 'category_name' => 'Tax Law'];

        $this->model->method('nameExists')->with('Tax Law')->willReturn(false);
        $this->model->expects($this->once())->method('create')->with($data)->willReturn(7);
        $this->model->method('find')->with(7)->willReturn($row);

        $this->assertSame($row, $this->service->create($data));
    }

    public function testCreateThrowsWhenNameMissing(): void
    {
        try {
            $this->service->create([]);
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('category_name', $exception->getErrors());
        }
    }

    public function testCreateThrowsWhenNameTooLong(): void
    {
        try {
            $this->service->create(['category_name' => str_repeat('a', 101)]);
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $this->assertSame(
                'Category name must not exceed 100 characters.',
                $exception->getErrors()['category_name']
            );
        }
    }

    public function testCreateThrowsWhenStatusInvalid(): void
    {
        try {
            $this->service->create(['category_name' => 'Tax Law', 'status' => 'Archived']);
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('status', $exception->getErrors());
        }
    }

    public function testCreateThrowsWhenNameNotUnique(): void
    {
        $this->model->method('nameExists')->willReturn(true);

        try {
            $this->service->create(['category_name' => 'Family Law']);
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $this->assertSame(
                'Category name must be unique.',
                $exception->getErrors()['category_name']
            );
        }
    }

    public function testUpdateReturnsUpdatedRecord(): void
    {
        $data = ['category_name' => 'Land Law', 'status' => 'Active'];
        $row = ['category_id' => 3, 'category_name' => 'Land Law'];

        $this->model->method('find')->with(3)->willReturn($row);
        $this->model->method('nameExists')->with('Land Law', 3)->willReturn(false);
        $this->model->expects($this->once())->method('update')->with(3, $data)->willReturn(true);

        $this->assertSame($row, $this->service->update(3, $data));
    }

    public function testUpdateThrowsWhenRecordMissing(): void
    {
        $this->model->method('find')->willReturn(null);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionCode(404);
        $this->service->update(42, ['category_name' => 'Land Law']);
    }

    public function testUpdateThrowsWhenNameTakenByAnotherRecord(): void
    {
        $this->model->method('find')->willReturn(['category_id' => 3]);
        $this->model->method('nameExists')->willReturn(true);

        $this->expectException(ValidationException::class);
        $this->service->update(3, ['category_name' => 'Family Law']);
    }

    public function testDeactivateReturnsUpdatedRecord(): void
    {
        $row = ['category_id' => 3, 'status' => 'Inactive'];
        $this->model->method('find')->with(3)->willReturn($row);
        $this->model->expects($this->once())->method('deactivate')->with(3)->willReturn(true);

        $this->assertSame($row, $this->service->deactivate(3));
    }

    public function testDeactivateThrowsWhenRecordMissing(): void
    {
        $this->model->method('find')->willReturn(null);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionCode(404);
        $this->service->deactivate(42);
    }
}
