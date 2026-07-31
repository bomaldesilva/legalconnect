<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class ResponseTest extends TestCase
{
    private function capture(callable $callback): array
    {
        ob_start();
        $callback();
        $output = ob_get_clean();
        $statusCode = http_response_code();
        http_response_code(200);

        return [json_decode((string) $output, true), $statusCode];
    }

    public function testJsonEncodesPayloadAndSetsStatusCode(): void
    {
        [$payload, $status] = $this->capture(
            static fn () => Response::json(['key' => 'value'], 418)
        );

        $this->assertSame(['key' => 'value'], $payload);
        $this->assertSame(418, $status);
    }

    public function testSuccessIncludesDataWhenProvided(): void
    {
        [$payload, $status] = $this->capture(
            static fn () => Response::success(['id' => 1], 'Created.', 201)
        );

        $this->assertSame(
            ['success' => true, 'message' => 'Created.', 'data' => ['id' => 1]],
            $payload
        );
        $this->assertSame(201, $status);
    }

    public function testSuccessOmitsDataWhenNull(): void
    {
        [$payload, $status] = $this->capture(
            static fn () => Response::success()
        );

        $this->assertSame(['success' => true, 'message' => 'Success'], $payload);
        $this->assertSame(200, $status);
    }

    public function testErrorIncludesErrorsWhenProvided(): void
    {
        [$payload, $status] = $this->capture(
            static fn () => Response::error('Validation failed.', 400, ['name' => 'Required.'])
        );

        $this->assertSame(
            [
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => ['name' => 'Required.'],
            ],
            $payload
        );
        $this->assertSame(400, $status);
    }

    public function testErrorOmitsErrorsWhenEmpty(): void
    {
        [$payload, $status] = $this->capture(
            static fn () => Response::error('Not found.', 404)
        );

        $this->assertSame(['success' => false, 'message' => 'Not found.'], $payload);
        $this->assertSame(404, $status);
    }
}
