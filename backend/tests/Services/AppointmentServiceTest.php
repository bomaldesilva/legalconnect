<?php

declare(strict_types=1);

use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

final class AppointmentServiceTest extends TestCase
{
    private Appointment&MockObject $model;
    private AppointmentService $service;

    protected function setUp(): void
    {
        $this->model = $this->createMock(Appointment::class);
        $this->service = new AppointmentService($this->model);
    }

    private function validData(array $overrides = []): array
    {
        return array_merge([
            'client_id' => 2,
            'lawyer_id' => 1,
            'appointment_date' => '2026-08-20',
            'start_time' => '09:00',
            'end_time' => '10:00',
        ], $overrides);
    }

    private function allowValidReferences(): void
    {
        $this->model->method('clientExists')->willReturn(true);
        $this->model->method('lawyerExists')->willReturn(true);
        $this->model->method('packageExists')->willReturn(true);
    }

    public function testGetAllReturnsAllAppointments(): void
    {
        $rows = [['appointment_id' => 1]];
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

    public function testCreateWithoutSlotCreatesRecordAndNotifications(): void
    {
        $data = $this->validData();
        $row = ['appointment_id' => 10];

        $this->allowValidReferences();
        $this->model->expects($this->once())->method('create')->with($data)->willReturn(10);
        $this->model->expects($this->never())->method('markSlotBooked');
        $this->model->expects($this->exactly(2))->method('createNotification');
        $this->model->method('find')->with(10)->willReturn($row);

        $this->assertSame($row, $this->service->create($data));
    }

    public function testCreateWithSlotFillsMissingFieldsAndBooksSlot(): void
    {
        $slot = [
            'slot_id' => 5,
            'lawyer_id' => 1,
            'available_date' => '2026-08-21',
            'start_time' => '11:00:00',
            'end_time' => '12:00:00',
            'status' => 'Available',
        ];
        $row = ['appointment_id' => 10];

        $this->allowValidReferences();
        $this->model->method('findSlot')->with(5)->willReturn($slot);
        $this->model->expects($this->once())
            ->method('create')
            ->with($this->callback(
                static fn (array $prepared): bool => $prepared['appointment_date'] === '2026-08-21'
                    && $prepared['start_time'] === '11:00'
                    && $prepared['end_time'] === '12:00'
            ))
            ->willReturn(10);
        $this->model->expects($this->once())->method('markSlotBooked')->with(5)->willReturn(true);
        $this->model->method('find')->with(10)->willReturn($row);

        $this->assertSame($row, $this->service->create([
            'client_id' => 2,
            'lawyer_id' => 1,
            'slot_id' => 5,
        ]));
    }

    public function testCreateThrowsWhenRequiredFieldsMissing(): void
    {
        try {
            $this->service->create([]);
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $errors = $exception->getErrors();
            $this->assertArrayHasKey('client_id', $errors);
            $this->assertArrayHasKey('lawyer_id', $errors);
            $this->assertArrayHasKey('appointment_date', $errors);
        }
    }

    public function testCreateThrowsWhenClientMissing(): void
    {
        $this->model->method('clientExists')->willReturn(false);
        $this->model->method('lawyerExists')->willReturn(true);
        $this->model->method('packageExists')->willReturn(true);

        try {
            $this->service->create($this->validData());
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('client_id', $exception->getErrors());
        }
    }

    public function testCreateThrowsWhenEndTimeNotAfterStartTime(): void
    {
        $this->allowValidReferences();

        try {
            $this->service->create($this->validData([
                'start_time' => '10:00',
                'end_time' => '10:00',
            ]));
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $this->assertSame(
                'End time must be after start time.',
                $exception->getErrors()['end_time']
            );
        }
    }

    public function testCreateThrowsWhenModeInvalid(): void
    {
        $this->allowValidReferences();

        try {
            $this->service->create($this->validData(['mode' => 'Hybrid']));
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('mode', $exception->getErrors());
        }
    }

    public function testCreateThrowsWhenPackageInvalid(): void
    {
        $this->model->method('clientExists')->willReturn(true);
        $this->model->method('lawyerExists')->willReturn(true);
        $this->model->method('packageExists')->with(7)->willReturn(false);

        try {
            $this->service->create($this->validData(['package_id' => 7]));
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('package_id', $exception->getErrors());
        }
    }

    public function testCreateThrowsWhenSlotBelongsToAnotherLawyer(): void
    {
        $this->allowValidReferences();
        $this->model->method('findSlot')->willReturn([
            'slot_id' => 5,
            'lawyer_id' => 99,
            'available_date' => '2026-08-20',
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'status' => 'Available',
        ]);

        try {
            $this->service->create($this->validData(['slot_id' => 5]));
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $this->assertSame(
                'Selected availability slot does not belong to this lawyer.',
                $exception->getErrors()['slot_id']
            );
        }
    }

    public function testCreateThrowsWhenSlotNotAvailable(): void
    {
        $this->allowValidReferences();
        $this->model->method('findSlot')->willReturn([
            'slot_id' => 5,
            'lawyer_id' => 1,
            'available_date' => '2026-08-20',
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'status' => 'Booked',
        ]);

        try {
            $this->service->create($this->validData(['slot_id' => 5]));
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $this->assertSame(
                'Selected availability slot is not available.',
                $exception->getErrors()['slot_id']
            );
        }
    }

    public function testUpdateSwapsSlotBookings(): void
    {
        $existing = ['appointment_id' => 10, 'slot_id' => 5, 'client_id' => 2];
        $newSlot = [
            'slot_id' => 6,
            'lawyer_id' => 1,
            'available_date' => '2026-08-22',
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'status' => 'Available',
        ];

        $this->allowValidReferences();
        $this->model->method('find')->with(10)->willReturn($existing);
        $this->model->method('findSlot')->with(6)->willReturn($newSlot);
        $this->model->expects($this->once())->method('update')->willReturn(true);
        $this->model->expects($this->once())->method('markSlotAvailable')->with(5)->willReturn(true);
        $this->model->expects($this->once())->method('markSlotBooked')->with(6)->willReturn(true);

        $this->service->update(10, $this->validData([
            'slot_id' => 6,
            'status' => 'Confirmed',
        ]));
    }

    public function testUpdateThrowsWhenRecordMissing(): void
    {
        $this->model->method('find')->willReturn(null);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionCode(404);
        $this->service->update(42, $this->validData());
    }

    public function testCancelReleasesSlotAndNotifiesClient(): void
    {
        $existing = ['appointment_id' => 10, 'slot_id' => 5, 'client_id' => 2];

        $this->model->method('find')->with(10)->willReturn($existing);
        $this->model->expects($this->once())
            ->method('updateStatus')->with(10, 'Cancelled')->willReturn(true);
        $this->model->expects($this->once())
            ->method('markSlotAvailable')->with(5)->willReturn(true);
        $this->model->expects($this->once())->method('createNotification');

        $this->service->cancel(10);
    }

    public function testCancelWithoutSlotSkipsSlotRelease(): void
    {
        $existing = ['appointment_id' => 10, 'slot_id' => null, 'client_id' => 2];

        $this->model->method('find')->with(10)->willReturn($existing);
        $this->model->method('updateStatus')->willReturn(true);
        $this->model->expects($this->never())->method('markSlotAvailable');

        $this->service->cancel(10);
    }
}
