<?php

declare(strict_types=1);

/**
 * File: AuthService.php
 * Description: Handles authentication logic, password hashing, and user creation.
 */
class AuthService
{
    public function __construct(private User $model)
    {
    }

    /**
     * Authenticates a user by email and password.
     * Starts a PHP session and stores user data on success.
     */
    public function login(array $credentials): array
    {
        $email    = trim($credentials['email'] ?? '');
        $password = $credentials['password'] ?? '';

        if ($email === '' || $password === '') {
            throw new ValidationException('Validation failed.', ['form' => 'Email and password are required.']);
        }

        $user = $this->model->findByEmail($email);

        if ($user === null || !password_verify($password, $user['password_hash'])) {
            throw new RuntimeException('Invalid credentials.', 401);
        }

        if ($user['status'] === 'Blocked') {
            throw new RuntimeException('Your account has been blocked.', 403);
        }

        // Start session and save user info
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $_SESSION['user'] = [
            'user_id'    => $user['user_id'],
            'first_name' => $user['first_name'],
            'last_name'  => $user['last_name'],
            'email'      => $user['email'],
            'role'       => $user['role'],
        ];

        return $_SESSION['user'];
    }

    /**
     * Registers a new user and creates their role-specific record.
     */
    public function register(array $data): array
    {
        $errors = $this->validateRegistration($data);
        if ($errors !== []) {
            throw new ValidationException('Validation failed.', $errors);
        }

        $existing = $this->model->findByEmail(trim($data['email']));
        if ($existing !== null) {
            throw new ValidationException('Validation failed.', ['email' => 'Email already registered.']);
        }

        $role = $data['role'];

        $userId = $this->model->create([
            'first_name'    => trim($data['first_name']),
            'last_name'     => trim($data['last_name']),
            'email'         => trim($data['email']),
            'password_hash' => password_hash($data['password'], PASSWORD_BCRYPT),
            'role'          => $role,
            'status'        => 'Active', // Defaulting to Active for MVP
        ]);

        if ($role === 'Client') {
            $this->model->createClient($userId);
        } elseif ($role === 'Lawyer') {
            $this->model->createLawyer($userId);
        }

        // Auto login after registration
        return $this->login([
            'email'    => $data['email'],
            'password' => $data['password'],
        ]);
    }

    public function logout(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        session_destroy();
    }

    public function getMe(): array
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (!isset($_SESSION['user'])) {
            throw new RuntimeException('Not authenticated.', 401);
        }

        return $_SESSION['user'];
    }

    private function validateRegistration(array $data): array
    {
        $errors = [];

        if (empty(trim($data['first_name'] ?? ''))) {
            $errors['first_name'] = 'First name is required.';
        }

        if (empty(trim($data['last_name'] ?? ''))) {
            $errors['last_name'] = 'Last name is required.';
        }

        if (empty(trim($data['email'] ?? '')) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Valid email is required.';
        }

        if (empty($data['password']) || strlen($data['password']) < 6) {
            $errors['password'] = 'Password must be at least 6 characters.';
        }

        if (empty($data['role']) || !in_array($data['role'], ['Client', 'Lawyer'])) {
            $errors['role'] = 'Valid role is required (Client or Lawyer).';
        }

        return $errors;
    }
}
