<?php

declare(strict_types=1);

/**
 * File: AuthController.php
 * Description: API Controller for handling authentication endpoints.
 */
class AuthController
{
    public function __construct(private AuthService $service)
    {
    }

    public function login(): void
    {
        $data = Request::body();
        $user = $this->service->login($data);

        Response::json([
            'success' => true,
            'message' => 'Login successful.',
            'data'    => $user,
        ]);
    }

    public function register(): void
    {
        $data = Request::body();
        $user = $this->service->register($data);

        Response::json([
            'success' => true,
            'message' => 'Registration successful.',
            'data'    => $user,
        ], 201);
    }

    public function logout(): void
    {
        $this->service->logout();

        Response::json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }

    public function me(): void
    {
        $user = $this->service->getMe();

        Response::json([
            'success' => true,
            'data'    => $user,
        ]);
    }
}
