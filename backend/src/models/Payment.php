<?php

declare(strict_types=1);

class Payment
{
    public function __construct(private PDO $db)
    {
    }

    public function all(): array
    {
        $statement = $this->db->query(
            "SELECT pay.payment_id, pay.appointment_id, pay.amount, pay.payment_method,
                    pay.payment_status, pay.payment_reference, pay.paid_at, pay.created_at,
                    a.appointment_date, a.start_time, a.end_time,
                    CONCAT(cu.first_name, ' ', cu.last_name) AS client_name,
                    CONCAT(lu.first_name, ' ', lu.last_name) AS lawyer_name
             FROM payments pay
             INNER JOIN appointments a ON a.appointment_id = pay.appointment_id
             INNER JOIN clients c ON c.client_id = a.client_id
             INNER JOIN users cu ON cu.user_id = c.client_id
             INNER JOIN lawyers l ON l.lawyer_id = a.lawyer_id
             INNER JOIN users lu ON lu.user_id = l.lawyer_id
             ORDER BY pay.payment_id DESC"
        );

        return $statement->fetchAll();
    }

    public function find(int $id): ?array
    {
        $statement = $this->db->prepare(
            "SELECT pay.payment_id, pay.appointment_id, pay.amount, pay.payment_method,
                    pay.payment_status, pay.payment_reference, pay.paid_at, pay.created_at,
                    a.appointment_date, a.start_time, a.end_time,
                    CONCAT(cu.first_name, ' ', cu.last_name) AS client_name,
                    CONCAT(lu.first_name, ' ', lu.last_name) AS lawyer_name
             FROM payments pay
             INNER JOIN appointments a ON a.appointment_id = pay.appointment_id
             INNER JOIN clients c ON c.client_id = a.client_id
             INNER JOIN users cu ON cu.user_id = c.client_id
             INNER JOIN lawyers l ON l.lawyer_id = a.lawyer_id
             INNER JOIN users lu ON lu.user_id = l.lawyer_id
             WHERE pay.payment_id = :id"
        );
        $statement->execute(['id' => $id]);
        $row = $statement->fetch();

        return $row ?: null;
    }

    public function create(array $data): int
    {
        $statement = $this->db->prepare(
            'INSERT INTO payments
                (appointment_id, amount, payment_method, payment_status, payment_reference, paid_at)
             VALUES
                (:appointment_id, :amount, :payment_method, :payment_status, :payment_reference, :paid_at)'
        );
        $statement->execute([
            'appointment_id' => (int) $data['appointment_id'],
            'amount' => $data['amount'],
            'payment_method' => $this->nullableText($data['payment_method'] ?? null),
            'payment_status' => $data['payment_status'] ?? 'Pending',
            'payment_reference' => $this->nullableText($data['payment_reference'] ?? null),
            'paid_at' => $data['paid_at'] ?? null,
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $statement = $this->db->prepare(
            'UPDATE payments
             SET appointment_id = :appointment_id,
                 amount = :amount,
                 payment_method = :payment_method,
                 payment_status = :payment_status,
                 payment_reference = :payment_reference,
                 paid_at = :paid_at
             WHERE payment_id = :id'
        );

        return $statement->execute([
            'id' => $id,
            'appointment_id' => (int) $data['appointment_id'],
            'amount' => $data['amount'],
            'payment_method' => $this->nullableText($data['payment_method'] ?? null),
            'payment_status' => $data['payment_status'],
            'payment_reference' => $this->nullableText($data['payment_reference'] ?? null),
            'paid_at' => $data['paid_at'] ?? null,
        ]);
    }

    public function markFailed(int $id): bool
    {
        $statement = $this->db->prepare(
            "UPDATE payments SET payment_status = 'Failed' WHERE payment_id = :id"
        );

        return $statement->execute(['id' => $id]);
    }

    public function appointmentExists(int $appointmentId): bool
    {
        $statement = $this->db->prepare(
            'SELECT COUNT(*) FROM appointments WHERE appointment_id = :id'
        );
        $statement->execute(['id' => $appointmentId]);

        return (int) $statement->fetchColumn() > 0;
    }

    public function referenceExists(string $reference, ?int $excludeId = null): bool
    {
        $sql = 'SELECT COUNT(*) FROM payments WHERE payment_reference = :ref';
        $params = ['ref' => $reference];

        if ($excludeId !== null) {
            $sql .= ' AND payment_id != :exclude_id';
            $params['exclude_id'] = $excludeId;
        }

        $statement = $this->db->prepare($sql);
        $statement->execute($params);

        return (int) $statement->fetchColumn() > 0;
    }

    public function paidCount(): int
    {
        $statement = $this->db->query(
            "SELECT COUNT(*) FROM payments WHERE payment_status = 'Paid'"
        );

        return (int) $statement->fetchColumn();
    }

    private function nullableText(mixed $value): ?string
    {
        $text = trim((string) ($value ?? ''));

        return $text === '' ? null : $text;
    }
}
