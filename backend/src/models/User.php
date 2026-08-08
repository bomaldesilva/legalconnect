<?php

declare(strict_types=1);

class User
{
    public function __construct(private PDO $db)
    {
    }

    public function findByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        return $user ?: null;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT user_id, first_name, last_name, email, role, status, created_at FROM users WHERE user_id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        return $user ?: null;
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare('
            INSERT INTO users (first_name, last_name, email, password_hash, role, status)
            VALUES (:first_name, :last_name, :email, :password_hash, :role, :status)
        ');
        $stmt->execute([
            'first_name'    => $data['first_name'],
            'last_name'     => $data['last_name'],
            'email'         => $data['email'],
            'password_hash' => $data['password_hash'],
            'role'          => $data['role'],
            'status'        => $data['status'] ?? 'Active',
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function createClient(int $userId): void
    {
        $stmt = $this->db->prepare('INSERT INTO clients (client_id) VALUES (:id)');
        $stmt->execute(['id' => $userId]);
    }

    public function createLawyer(int $userId): void
    {
        $stmt = $this->db->prepare('INSERT INTO lawyers (lawyer_id) VALUES (:id)');
        $stmt->execute(['id' => $userId]);
    }
}
