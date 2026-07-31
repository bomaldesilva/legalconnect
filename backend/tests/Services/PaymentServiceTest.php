<?php

declare(strict_types=1);

use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

final class PaymentServiceTest extends TestCase
{
    private Payment&MockObject $model;
    private PaymentService $service;

    protected function setUp(): void
    {
        $this->model = $this->createMock(Payment::class);
        $this->service = new PaymentService($this->model);
    }

    private function validData(array $overrides = []): array
    {
        return array_merge([
            'appointment_id' => 1,
            'amount' => '2500.00',
        ], $overrides);
    }

    public function testGetAllReturnsAllPayments(): void
    {
        $rows = [['payment_id' => 1]];
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
        $row = ['payment_id' => 6];

        $this->model->method('appointmentExists')->with(1)->willReturn(true);
        $this->model->expects($this->once())
            ->method('create')
            ->with($this->callback(
                static fn (array $payload): bool => $payload['appointment_id'] === 1
                    && $payload['amount'] === '2500.00'
                    && $payload['payment_status'] === 'Pending'
                    && $payload['paid_at'] === null
            ))
            ->willReturn(6);
        $this->model->method('find')->with(6)->willReturn($row);

        $this->assertSame($row, $this->service->create($this->validData()));
    }

    public function testCreateSetsPaidAtWhenStatusPaidAndPaidAtMissing(): void
    {
        $this->model->method('appointmentExists')->willReturn(true);
        $this->model->expects($this->once())
            ->method('create')
            ->with($this->callback(
                static fn (array $payload): bool => $payload['payment_status'] === 'Paid'
                    && is_string($payload['paid_at'])
                    && $payload['paid_at'] !== ''
            ))
            ->willReturn(6);
        $this->model->method('find')->willReturn(['payment_id' => 6]);

        $this->service->create($this->validData(['payment_status' => 'Paid']));
    }

    public function testCreateKeepsProvidedPaidAt(): void
    {
        $this->model->method('appointmentExists')->willReturn(true);
        $this->model->expects($this->once())
            ->method('create')
            ->with($this->callback(
                static fn (array $payload): bool => $payload['paid_at'] === '2026-07-01 10:00:00'
            ))
            ->willReturn(6);
        $this->model->method('find')->willReturn(['payment_id' => 6]);

        $this->service->create($this->validData([
            'payment_status' => 'Paid',
            'paid_at' => '2026-07-01 10:00:00',
        ]));
    }

    public function testCreateThrowsWhenRequiredFieldsMissing(): void
    {
        try {
            $this->service->create([]);
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $errors = $exception->getErrors();
            $this->assertArrayHasKey('appointment_id', $errors);
            $this->assertArrayHasKey('amount', $errors);
        }
    }

    public function testCreateThrowsWhenAppointmentMissing(): void
    {
        $this->model->method('appointmentExists')->willReturn(false);

        try {
            $this->service->create($this->validData());
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('appointment_id', $exception->getErrors());
        }
    }

    public function testCreateThrowsWhenAmountNegative(): void
    {
        $this->model->method('appointmentExists')->willReturn(true);

        try {
            $this->service->create($this->validData(['amount' => '-5']));
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('amount', $exception->getErrors());
        }
    }

    public function testCreateThrowsWhenStatusInvalid(): void
    {
        $this->model->method('appointmentExists')->willReturn(true);

        try {
            $this->service->create($this->validData(['payment_status' => 'Void']));
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('payment_status', $exception->getErrors());
        }
    }

    public function testCreateThrowsWhenReferenceNotUnique(): void
    {
        $this->model->method('appointmentExists')->willReturn(true);
        $this->model->method('referenceExists')->with('REF-1', null)->willReturn(true);

        try {
            $this->service->create($this->validData(['payment_reference' => 'REF-1']));
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $this->assertSame(
                'Payment reference must be unique.',
                $exception->getErrors()['payment_reference']
            );
        }
    }

    public function testUpdateExcludesSelfFromReferenceCheck(): void
    {
        $row = ['payment_id' => 3];

        $this->model->method('find')->with(3)->willReturn($row);
        $this->model->method('appointmentExists')->willReturn(true);
        $this->model->method('referenceExists')->with('REF-1', 3)->willReturn(false);
        $this->model->expects($this->once())->method('update')->willReturn(true);

        $this->assertSame(
            $row,
            $this->service->update(3, $this->validData(['payment_reference' => 'REF-1']))
        );
    }

    public function testUpdateThrowsWhenRecordMissing(): void
    {
        $this->model->method('find')->willReturn(null);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionCode(404);
        $this->service->update(42, $this->validData());
    }

    public function testMarkFailedReturnsUpdatedRecord(): void
    {
        $row = ['payment_id' => 3, 'payment_status' => 'Failed'];
        $this->model->method('find')->with(3)->willReturn($row);
        $this->model->expects($this->once())->method('markFailed')->with(3)->willReturn(true);

        $this->assertSame($row, $this->service->markFailed(3));
    }
}
