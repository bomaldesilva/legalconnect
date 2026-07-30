<?php

declare(strict_types=1);

class LegalCategory
{
    public function __construct(private PDO $db)
    {
    }

    public function all(): array
    {
        $statement = $this->db->query(
            'SELECT category_id, category_name, description, status, created_at, updated_at
             FROM legal_categories
             ORDER BY category_id DESC'
        );

        return $statement->fetchAll();
    }

    public function find(int $id): ?array
    {
        $statement = $this->db->prepare(
            'SELECT category_id, category_name, description, status, created_at, updated_at
             FROM legal_categories
             WHERE category_id = :id'
        );
        $statement->execute(['id' => $id]);
        $category = $statement->fetch();

        return $category ?: null;
    }

    public function create(array $data): int
    {
        $statement = $this->db->prepare(
            'INSERT INTO legal_categories (category_name, description, status)
             VALUES (:category_name, :description, :status)'
        );
        $statement->execute([
            'category_name' => trim((string) $data['category_name']),
            'description' => $this->nullableText($data['description'] ?? null),
            'status' => $data['status'] ?? 'Active',
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $statement = $this->db->prepare(
            'UPDATE legal_categories
             SET category_name = :category_name, description = :description, status = :status
             WHERE category_id = :id'
        );

        return $statement->execute([
            'id' => $id,
            'category_name' => trim((string) $data['category_name']),
            'description' => $this->nullableText($data['description'] ?? null),
            'status' => $data['status'],
        ]);
    }

    public function deactivate(int $id): bool
    {
        $statement = $this->db->prepare(
            "UPDATE legal_categories SET status = 'Inactive' WHERE category_id = :id"
        );

        return $statement->execute(['id' => $id]);
    }

    public function nameExists(string $categoryName, ?int $excludeId = null): bool
    {
        $sql = 'SELECT COUNT(*) FROM legal_categories WHERE category_name = :category_name';
        $params = ['category_name' => trim($categoryName)];

        if ($excludeId !== null) {
            $sql .= ' AND category_id != :exclude_id';
            $params['exclude_id'] = $excludeId;
        }

        $statement = $this->db->prepare($sql);
        $statement->execute($params);

        return (int) $statement->fetchColumn() > 0;
    }

    public function activeCount(): int
    {
        $statement = $this->db->query("SELECT COUNT(*) FROM legal_categories WHERE status = 'Active'");

        return (int) $statement->fetchColumn();
    }

    private function nullableText(mixed $value): ?string
    {
        $text = trim((string) ($value ?? ''));

        return $text === '' ? null : $text;
    }
}
