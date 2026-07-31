<?php

declare(strict_types=1);

use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

final class AvailabilitySlotServiceTest extends TestCase
{
    private AvailabilitySlot&MockObject $model;
    private AvailabilitySlotService $service;

    protected function setUp(): void
    {
        $this->model = $this->createMock(AvailabilitySlot::class);
        $this->service = new AvailabilitySlotService($this->model);
    }

    private function validData(array $overrides = []): array
    {
        return array_merge([
            'lawyer_id' => 1,
            'available_date' => '2026-08-15',
            'start_time' => '09:00',
            'end_time' => '10:00',
        ], $overrides);
    }

    public function testGetAllReturnsAllSlots(): void
    {
        $rows = [['slot_id' => 1]];
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
        $row = ['slot_id' => 11];

        $this->model->method('lawyerExists')->with(1)->willReturn(true);
        $this->model->method('duplicateExists')->with($data)->willReturn(false);
        $this->model->expects($this->once())->method('create')->with($data)->willReturn(11);
        $this->model->method('find')->with(11)->willReturn($row);

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
            $this->assertArrayHasKey('available_date', $errors);
            $this->assertArrayHasKey('start_time', $errors);
            $this->assertArrayHasKey('end_time', $errors);
        }
    }

    public function testCreateThrowsWhenLawyerDoesNotExist(): void
    {
        $this->model->method('lawyerExists')->willReturn(false);

        try {
            $this->service->create($this->validData());
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $this->assertSame(
                'A valid active lawyer is required.',
                $exception->getErrors()['lawyer_id']
            );
        }
    }

    public function testCreateThrowsWhenDateInvalid(): void
    {
        $this->model->method('lawyerExists')->willReturn(true);

        try {
            $this->service->create($this->validData(['available_date' => '2026-02-30']));
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('available_date', $exception->getErrors());
        }
    }

    public function testCreateThrowsWhenTimesInvalid(): void
    {
        $this->model->method('lawyerExists')->willReturn(true);

        try {
            $this->service->create($this->validData([
                'start_time' => 'not-a-time',
                'end_time' => 'soon',
            ]));
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $errors = $exception->getErrors();
            $this->assertArrayHasKey('start_time', $errors);
            $this->assertArrayHasKey('end_time', $errors);
        }
    }

    public function testCreateThrowsWhenEndTimeNotAfterStartTime(): void
    {
        $this->model->method('lawyerExists')->willReturn(true);

        try {
            $this->service->create($this->validData([
                'start_time' => '10:00',
                'end_time' => '09:00',
            ]));
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $this->assertSame(
                'End time must be after start time.',
                $exception->getErrors()['end_time']
            );
        }
    }

    public function testCreateThrowsWhenStatusInvalid(): void
    {
        $this->model->method('lawyerExists')->willReturn(true);

        try {
            $this->service->create($this->validData(['status' => 'Open']));
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('status', $exception->getErrors());
        }
    }

    public function testCreateThrowsWhenDuplicateExists(): void
    {
        $this->model->method('lawyerExists')->willReturn(true);
        $this->model->method('duplicateExists')->willReturn(true);

        try {
            $this->service->create($this->validData());
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('slot', $exception->getErrors());
        }
    }

    public function testUpdateReturnsUpdatedRecord(): void
    {
        $data = $this->validData();
        $row = ['slot_id' => 4];

        $this->model->method('find')->with(4)->willReturn($row);
        $this->model->method('lawyerExists')->willReturn(true);
        $this->model->method('duplicateExists')->with($data, 4)->willReturn(false);
        $this->model->expects($this->once())->method('update')->with(4, $data)->willReturn(true);

        $this->assertSame($row, $this->service->update(4, $data));
    }

    public function testUpdateThrowsWhenRecordMissing(): void
    {
        $this->model->method('find')->willReturn(null);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionCode(404);
        $this->service->update(42, $this->validData());
    }

    public function testCancelReturnsUpdatedRecord(): void
    {
        $row = ['slot_id' => 4, 'status' => 'Cancelled'];
        $this->model->method('find')->with(4)->willReturn($row);
        $this->model->expects($this->once())->method('cancel')->with(4)->willReturn(true);

        $this->assertSame($row, $this->service->cancel(4));
    }
}
