<?php

declare(strict_types=1);

class Appointment
{
    public function __construct(private PDO $db)
    {
    }

    public function all(): array
    {
        $statement = $this->db->query(
            "SELECT a.appointment_id, a.client_id, a.lawyer_id, a.slot_id, a.package_id,
                    CONCAT(cu.first_name, ' ', cu.last_name) AS client_name,
                    CONCAT(lu.first_name, ' ', lu.last_name) AS lawyer_name,
                    p.package_name, p.fee AS package_fee,
                    a.appointment_date, a.start_time, a.end_time, a.mode, a.status, a.created_at
             FROM appointments a
             INNER JOIN clients c ON c.client_id = a.client_id
             INNER JOIN users cu ON cu.user_id = c.client_id
             INNER JOIN lawyers l ON l.lawyer_id = a.lawyer_id
             INNER JOIN users lu ON lu.user_id = l.lawyer_id
             LEFT JOIN consultation_packages p ON p.package_id = a.package_id
             ORDER BY a.appointment_date DESC, a.start_time DESC, a.appointment_id DESC"
        );

        return $statement->fetchAll();
    }

    public function find(int $id): ?array
    {
        $statement = $this->db->prepare(
            "SELECT a.appointment_id, a.client_id, a.lawyer_id, a.slot_id, a.package_id,
                    CONCAT(cu.first_name, ' ', cu.last_name) AS client_name,
                    CONCAT(lu.first_name, ' ', lu.last_name) AS lawyer_name,
                    p.package_name, p.fee AS package_fee,
                    a.appointment_date, a.start_time, a.end_time, a.mode, a.status, a.created_at
             FROM appointments a
             INNER JOIN clients c ON c.client_id = a.client_id
             INNER JOIN users cu ON cu.user_id = c.client_id
             INNER JOIN lawyers l ON l.lawyer_id = a.lawyer_id
             INNER JOIN users lu ON lu.user_id = l.lawyer_id
             LEFT JOIN consultation_packages p ON p.package_id = a.package_id
             WHERE a.appointment_id = :id"
        );
        $statement->execute(['id' => $id]);
        $row = $statement->fetch();

        return $row ?: null;
    }

    public function create(array $data): int
    {
        $statement = $this->db->prepare(
            'INSERT INTO appointments
                (client_id, lawyer_id, slot_id, package_id, appointment_date, start_time, end_time, mode, status)
             VALUES
                (:client_id, :lawyer_id, :slot_id, :package_id, :appointment_date, :start_time, :end_time, :mode, :status)'
        );
        $statement->execute([
            'client_id' => (int) $data['client_id'],
            'lawyer_id' => (int) $data['lawyer_id'],
            'slot_id' => $this->nullableInt($data['slot_id'] ?? null),
            'package_id' => $this->nullableInt($data['package_id'] ?? null),
            'appointment_date' => $data['appointment_date'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'mode' => $data['mode'] ?? 'Online',
            'status' => $data['status'] ?? 'Pending',
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $statement = $this->db->prepare(
            'UPDATE appointments
             SET client_id = :client_id,
                 lawyer_id = :lawyer_id,
                 slot_id = :slot_id,
                 package_id = :package_id,
                 appointment_date = :appointment_date,
                 start_time = :start_time,
                 end_time = :end_time,
                 mode = :mode,
                 status = :status
             WHERE appointment_id = :id'
        );

        return $statement->execute([
            'id' => $id,
            'client_id' => (int) $data['client_id'],
            'lawyer_id' => (int) $data['lawyer_id'],
            'slot_id' => $this->nullableInt($data['slot_id'] ?? null),
            'package_id' => $this->nullableInt($data['package_id'] ?? null),
            'appointment_date' => $data['appointment_date'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'mode' => $data['mode'],
            'status' => $data['status'],
        ]);
    }

    public function updateStatus(int $id, string $status): bool
    {
        $statement = $this->db->prepare(
            'UPDATE appointments SET status = :status WHERE appointment_id = :id'
        );

        return $statement->execute([
            'id' => $id,
            'status' => $status,
        ]);
    }

    public function clientExists(int $clientId): bool
    {
        $statement = $this->db->prepare(
            'SELECT COUNT(*) FROM clients WHERE client_id = :id'
        );
        $statement->execute(['id' => $clientId]);

        return (int) $statement->fetchColumn() > 0;
    }

    public function lawyerExists(int $lawyerId): bool
    {
        $statement = $this->db->prepare(
            "SELECT COUNT(*) FROM lawyers WHERE lawyer_id = :id AND status = 'Active'"
        );
        $statement->execute(['id' => $lawyerId]);

        return (int) $statement->fetchColumn() > 0;
    }

    public function findSlot(int $slotId): ?array
    {
        $statement = $this->db->prepare(
            'SELECT slot_id, lawyer_id, available_date, start_time, end_time, status
             FROM availability_slots
             WHERE slot_id = :slot_id'
        );
        $statement->execute(['slot_id' => $slotId]);
        $row = $statement->fetch();

        return $row ?: null;
    }

    public function markSlotBooked(int $slotId): bool
    {
        $statement = $this->db->prepare(
            "UPDATE availability_slots SET status = 'Booked' WHERE slot_id = :id"
        );

        return $statement->execute(['id' => $slotId]);
    }

    public function markSlotAvailable(int $slotId): bool
    {
        $statement = $this->db->prepare(
            "UPDATE availability_slots SET status = 'Available' WHERE slot_id = :id AND status = 'Booked'"
        );

        return $statement->execute(['id' => $slotId]);
    }

    public function packageExists(?int $packageId): bool
    {
        if ($packageId === null) {
            return true;
        }

        $statement = $this->db->prepare(
            "SELECT COUNT(*) FROM consultation_packages WHERE package_id = :id AND status = 'Active'"
        );
        $statement->execute(['id' => $packageId]);

        return (int) $statement->fetchColumn() > 0;
    }

    public function createNotification(int $userId, string $message, string $type): void
    {
        $statement = $this->db->prepare(
            'INSERT INTO notifications (user_id, message, type, read_status)
             VALUES (:user_id, :message, :type, 0)'
        );
        $statement->execute([
            'user_id' => $userId,
            'message' => $message,
            'type' => $type,
        ]);
    }

    public function pendingCount(): int
    {
        $statement = $this->db->query(
            "SELECT COUNT(*) FROM appointments WHERE status IN ('Pending','Confirmed')"
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
}
