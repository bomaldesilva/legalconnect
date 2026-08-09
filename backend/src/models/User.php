<?php

declare(strict_types=1);

class User
{
    public function __construct(private PDO $db)
    {
        $this->ensureDefaultUsersExist();
    }

    private function ensureDefaultUsersExist(): void
    {
        try {
            // 1. System Admin
            $admin = $this->findByEmail('admin@legalconnect.lk');
            if ($admin === null) {
                $hash = password_hash('admin123', PASSWORD_BCRYPT);
                $stmt = $this->db->prepare('
                    INSERT INTO users (first_name, last_name, email, password_hash, role, status)
                    VALUES (\'System\', \'Admin\', \'admin@legalconnect.lk\', :hash, \'Admin\', \'Active\')
                ');
                $stmt->execute(['hash' => $hash]);
                $userId = (int) $this->db->lastInsertId();
                $this->db->exec("INSERT INTO admins (admin_id, nic, dob) VALUES ($userId, 'ADMIN000', '1980-01-01') ON DUPLICATE KEY UPDATE nic=nic;");
            } elseif (str_contains((string)($admin['password_hash'] ?? ''), 'placeholder') || !password_verify('admin123', $admin['password_hash'])) {
                $hash = password_hash('admin123', PASSWORD_BCRYPT);
                $stmt = $this->db->prepare('UPDATE users SET password_hash = :hash WHERE email = \'admin@legalconnect.lk\'');
                $stmt->execute(['hash' => $hash]);
            }

            // 2. Demo Lawyer
            $lawyer = $this->findByEmail('lawyer@legalconnect.lk');
            if ($lawyer === null) {
                $hash = password_hash('lawyer123', PASSWORD_BCRYPT);
                $stmt = $this->db->prepare('
                    INSERT INTO users (first_name, last_name, email, password_hash, role, status)
                    VALUES (\'Demo\', \'Lawyer\', \'lawyer@legalconnect.lk\', :hash, \'Lawyer\', \'Active\')
                ');
                $stmt->execute(['hash' => $hash]);
                $userId = (int) $this->db->lastInsertId();
                $this->db->exec("INSERT INTO lawyers (lawyer_id, bar_registration_no, experience_years, rating, status) VALUES ($userId, 'BAR-DEMO-001', 5, 4.50, 'Active') ON DUPLICATE KEY UPDATE status='Active';");
            } elseif (str_contains((string)($lawyer['password_hash'] ?? ''), 'placeholder') || !password_verify('lawyer123', $lawyer['password_hash'])) {
                $hash = password_hash('lawyer123', PASSWORD_BCRYPT);
                $stmt = $this->db->prepare('UPDATE users SET password_hash = :hash WHERE email = \'lawyer@legalconnect.lk\'');
                $stmt->execute(['hash' => $hash]);
            }

            // 3. Demo Client
            $client = $this->findByEmail('client@legalconnect.lk');
            if ($client === null) {
                $hash = password_hash('client123', PASSWORD_BCRYPT);
                $stmt = $this->db->prepare('
                    INSERT INTO users (first_name, last_name, email, password_hash, role, status)
                    VALUES (\'Demo\', \'Client\', \'client@legalconnect.lk\', :hash, \'Client\', \'Active\')
                ');
                $stmt->execute(['hash' => $hash]);
                $userId = (int) $this->db->lastInsertId();
                $this->db->exec("INSERT INTO clients (client_id) VALUES ($userId) ON DUPLICATE KEY UPDATE client_id=client_id;");
            } elseif (str_contains((string)($client['password_hash'] ?? ''), 'placeholder') || !password_verify('client123', $client['password_hash'])) {
                $hash = password_hash('client123', PASSWORD_BCRYPT);
                $stmt = $this->db->prepare('UPDATE users SET password_hash = :hash WHERE email = \'client@legalconnect.lk\'');
                $stmt->execute(['hash' => $hash]);
            }
        } catch (Throwable $e) {
            // Ignore DB seed errors gracefully
        }
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
