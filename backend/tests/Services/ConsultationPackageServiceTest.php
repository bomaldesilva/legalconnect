<?php

declare(strict_types=1);

use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

final class ConsultationPackageServiceTest extends TestCase
{
    private ConsultationPackage&MockObject $model;
    private ConsultationPackageService $service;

    protected function setUp(): void
    {
        $this->model = $this->createMock(ConsultationPackage::class);
        $this->service = new ConsultationPackageService($this->model);
    }

    private function validData(array $overrides = []): array
    {
        return array_merge([
            'lawyer_id' => 1,
            'package_name' => 'Initial Consultation',
            'fee' => '5000.00',
            'duration_minutes' => 30,
        ], $overrides);
    }

    public function testGetAllReturnsAllPackages(): void
    {
        $rows = [['package_id' => 1]];
        $this->model->method('all')->willReturn($rows);

        $this->assertSame($rows, $this->service->getAll());
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
        $data = $this->validData();
        $row = ['package_id' => 8];

        $this->model->method('lawyerExists')->with(1)->willReturn(true);
        $this->model->method('categoryExists')->with(null)->willReturn(true);
        $this->model->expects($this->once())->method('create')->with($data)->willReturn(8);
        $this->model->method('find')->with(8)->willReturn($row);

        $this->assertSame($row, $this->service->create($data));
    }

    public function testCreateThrowsWhenRequiredFieldsMissing(): void
    {
        try {
            $this->service->create([]);
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $errors = $exception->getErrors();
            $this->assertArrayHasKey('lawyer_id', $errors);
            $this->assertArrayHasKey('package_name', $errors);
            $this->assertArrayHasKey('fee', $errors);
            $this->assertArrayHasKey('duration_minutes', $errors);
        }
    }

    public function testCreateThrowsWhenLawyerInvalid(): void
    {
        $this->model->method('lawyerExists')->willReturn(false);
        $this->model->method('categoryExists')->willReturn(true);

        try {
            $this->service->create($this->validData());
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('lawyer_id', $exception->getErrors());
        }
    }

    public function testCreateThrowsWhenPackageNameTooLong(): void
    {
        $this->model->method('lawyerExists')->willReturn(true);
        $this->model->method('categoryExists')->willReturn(true);

        try {
            $this->service->create($this->validData(['package_name' => str_repeat('a', 151)]));
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('package_name', $exception->getErrors());
        }
    }

    public function testCreateThrowsWhenFeeNegative(): void
    {
        $this->model->method('lawyerExists')->willReturn(true);
        $this->model->method('categoryExists')->willReturn(true);

        try {
            $this->service->create($this->validData(['fee' => '-10']));
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $this->assertSame(
                'Fee must be a non-negative number.',
                $exception->getErrors()['fee']
            );
        }
    }

    public function testCreateThrowsWhenFeeNotNumeric(): void
    {
        $this->model->method('lawyerExists')->willReturn(true);
        $this->model->method('categoryExists')->willReturn(true);

        try {
            $this->service->create($this->validData(['fee' => 'free']));
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('fee', $exception->getErrors());
        }
    }

    public function testCreateThrowsWhenDurationBelowOne(): void
    {
        $this->model->method('lawyerExists')->willReturn(true);
        $this->model->method('categoryExists')->willReturn(true);

        try {
            $this->service->create($this->validData(['duration_minutes' => '0.5']));
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $this->assertSame(
                'Duration must be at least 1 minute.',
                $exception->getErrors()['duration_minutes']
            );
        }
    }

    public function testCreateThrowsWhenCategoryInvalid(): void
    {
        $this->model->method('lawyerExists')->willReturn(true);
        $this->model->method('categoryExists')->with(9)->willReturn(false);

        try {
            $this->service->create($this->validData(['category_id' => 9]));
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('category_id', $exception->getErrors());
        }
    }

    public function testUpdateReturnsUpdatedRecord(): void
    {
        $data = $this->validData();
        $row = ['package_id' => 2];

        $this->model->method('find')->with(2)->willReturn($row);
        $this->model->method('lawyerExists')->willReturn(true);
        $this->model->method('categoryExists')->willReturn(true);
        $this->model->expects($this->once())->method('update')->with(2, $data)->willReturn(true);

        $this->assertSame($row, $this->service->update(2, $data));
    }

    public function testUpdateThrowsWhenRecordMissing(): void
    {
        $this->model->method('find')->willReturn(null);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionCode(404);
        $this->service->update(42, $this->validData());
    }

    public function testDeactivateReturnsUpdatedRecord(): void
    {
        $row = ['package_id' => 2, 'status' => 'Inactive'];
        $this->model->method('find')->with(2)->willReturn($row);
        $this->model->expects($this->once())->method('deactivate')->with(2)->willReturn(true);

        $this->assertSame($row, $this->service->deactivate(2));
    }
}
