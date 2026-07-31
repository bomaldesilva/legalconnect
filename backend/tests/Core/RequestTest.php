<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class RequestTest extends TestCase
{
    private array $serverBackup;
    private array $postBackup;

    protected function setUp(): void
    {
        $this->serverBackup = $_SERVER;
        $this->postBackup = $_POST;
    }

    protected function tearDown(): void
    {
        $_SERVER = $this->serverBackup;
        $_POST = $this->postBackup;
    }

    public function testReturnsPostArrayForFormPost(): void
    {
        $_SERVER['CONTENT_TYPE'] = 'application/x-www-form-urlencoded';
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $_POST = ['category_name' => 'Family Law'];

        $this->assertSame(['category_name' => 'Family Law'], Request::body());
    }

    public function testReturnsEmptyArrayForJsonRequestWithEmptyBody(): void
    {
        $_SERVER['CONTENT_TYPE'] = 'application/json';
        $_SERVER['REQUEST_METHOD'] = 'POST';

        $this->assertSame([], Request::body());
    }

    public function testReturnsEmptyArrayForGetRequestWithoutBody(): void
    {
        unset($_SERVER['CONTENT_TYPE']);
        $_SERVER['REQUEST_METHOD'] = 'GET';

        $this->assertSame([], Request::body());
    }
}
