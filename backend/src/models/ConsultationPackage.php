<?php

declare(strict_types=1);

class ConsultationPackage
{
    public function __construct(private PDO $db)
    {
    }

    public function all(): array
    {
        $statement = $this->db->query(
            "SELECT p.package_id, p.lawyer_id,
                    CONCAT(u.first_name, ' ', u.last_name) AS lawyer_name,
                    p.category_id, c.category_name,
                    p.package_name, p.fee, p.duration_minutes, p.description, p.status,
                    p.created_at, p.updated_at
             FROM consultation_packages p
             INNER JOIN lawyers l ON l.lawyer_id = p.lawyer_id
             INNER JOIN users u ON u.user_id = l.lawyer_id
             LEFT JOIN legal_categories c ON c.category_id = p.category_id
             ORDER BY p.package_id DESC"
        );

        return $statement->fetchAll();
    }

    public function find(int $id): ?array
    {
        $statement = $this->db->prepare(
            "SELECT p.package_id, p.lawyer_id,
                    CONCAT(u.first_name, ' ', u.last_name) AS lawyer_name,
                    p.category_id, c.category_name,
                    p.package_name, p.fee, p.duration_minutes, p.description, p.status,
                    p.created_at, p.updated_at
             FROM consultation_packages p
             INNER JOIN lawyers l ON l.lawyer_id = p.lawyer_id
             INNER JOIN users u ON u.user_id = l.lawyer_id
             LEFT JOIN legal_categories c ON c.category_id = p.category_id
             WHERE p.package_id = :id"
        );
        $statement->execute(['id' => $id]);
        $row = $statement->fetch();

        return $row ?: null;
    }

    public function create(array $data): int
    {
        $statement = $this->db->prepare(
            'INSERT INTO consultation_packages
                (lawyer_id, category_id, package_name, fee, duration_minutes, description, status)
             VALUES
                (:lawyer_id, :category_id, :package_name, :fee, :duration_minutes, :description, :status)'
        );
        $statement->execute([
            'lawyer_id' => (int) $data['lawyer_id'],
            'category_id' => $this->nullableInt($data['category_id'] ?? null),
            'package_name' => trim((string) $data['package_name']),
            'fee' => $data['fee'],
            'duration_minutes' => (int) $data['duration_minutes'],
            'description' => $this->nullableText($data['description'] ?? null),
            'status' => $data['status'] ?? 'Active',
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $statement = $this->db->prepare(
            'UPDATE consultation_packages
             SET lawyer_id = :lawyer_id,
                 category_id = :category_id,
                 package_name = :package_name,
                 fee = :fee,
                 duration_minutes = :duration_minutes,
                 description = :description,
                 status = :status
             WHERE package_id = :id'
        );

        return $statement->execute([
            'id' => $id,
            'lawyer_id' => (int) $data['lawyer_id'],
            'category_id' => $this->nullableInt($data['category_id'] ?? null),
            'package_name' => trim((string) $data['package_name']),
            'fee' => $data['fee'],
            'duration_minutes' => (int) $data['duration_minutes'],
            'description' => $this->nullableText($data['description'] ?? null),
            'status' => $data['status'],
        ]);
    }

    public function deactivate(int $id): bool
    {
        $statement = $this->db->prepare(
            "UPDATE consultation_packages SET status = 'Inactive' WHERE package_id = :id"
        );

        return $statement->execute(['id' => $id]);
    }

    public function lawyerExists(int $lawyerId): bool
    {
        $statement = $this->db->prepare(
            "SELECT COUNT(*) FROM lawyers WHERE lawyer_id = :id AND status = 'Active'"
        );
        $statement->execute(['id' => $lawyerId]);

        return (int) $statement->fetchColumn() > 0;
    }

    public function categoryExists(?int $categoryId): bool
    {
        if ($categoryId === null) {
            return true;
        }

        $statement = $this->db->prepare(
            "SELECT COUNT(*) FROM legal_categories WHERE category_id = :id AND status = 'Active'"
        );
        $statement->execute(['id' => $categoryId]);

        return (int) $statement->fetchColumn() > 0;
    }

    public function activeCount(): int
    {
        $statement = $this->db->query(
            "SELECT COUNT(*) FROM consultation_packages WHERE status = 'Active'"
        );

        return (int) $statement->fetchColumn();
    }

    private function nullableInt(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (int) $value;
    }

    private function nullableText(mixed $value): ?string
    {
        $text = trim((string) ($value ?? ''));

        return $text === '' ? null : $text;
    }
}
