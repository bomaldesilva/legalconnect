<?php

declare(strict_types=1);

/**
 * File: AvailabilitySlot.php
 * Description: Data access model for Availability Slots.
 * Interacts directly with the database via raw SQL statements.
 */
class AvailabilitySlot
{
    public function __construct(private PDO $db)
    {
    }

    /**
     * Section: Fetch All Slots
     * Retrieves all availability slots, joining lawyer details.
     */
    public function all(): array
    {
        $statement = $this->db->query(
            "SELECT slots.slot_id, slots.lawyer_id,
                    CONCAT(users.first_name, ' ', users.last_name) AS lawyer_name,
                    slots.available_date, slots.start_time, slots.end_time, slots.status,
                    slots.created_at, slots.updated_at
             FROM availability_slots slots
             INNER JOIN lawyers ON lawyers.lawyer_id = slots.lawyer_id
             INNER JOIN users ON users.user_id = lawyers.lawyer_id
             ORDER BY slots.available_date DESC, slots.start_time DESC, slots.slot_id DESC"
        );

        return $statement->fetchAll();
    }

    /**
     * Section: Fetch Single Slot
     * Retrieves an availability slot by ID with lawyer details.
     */
    public function find(int $id): ?array
    {
        $statement = $this->db->prepare(
            "SELECT slots.slot_id, slots.lawyer_id,
                    CONCAT(users.first_name, ' ', users.last_name) AS lawyer_name,
                    slots.available_date, slots.start_time, slots.end_time, slots.status,
                    slots.created_at, slots.updated_at
             FROM availability_slots slots
             INNER JOIN lawyers ON lawyers.lawyer_id = slots.lawyer_id
             INNER JOIN users ON users.user_id = lawyers.lawyer_id
             WHERE slots.slot_id = :id"
        );
        $statement->execute(['id' => $id]);
        $slot = $statement->fetch();

        return $slot ?: null;
    }

    /**
     * Section: Create Slot
     * Inserts a new availability slot into the database.
     */
    public function create(array $data): int
    {
        $statement = $this->db->prepare(
            'INSERT INTO availability_slots (lawyer_id, available_date, start_time, end_time, status)
             VALUES (:lawyer_id, :available_date, :start_time, :end_time, :status)'
        );
        $statement->execute([
            'lawyer_id' => (int) $data['lawyer_id'],
            'available_date' => $data['available_date'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'status' => $data['status'] ?? 'Available',
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Section: Update Slot
     * Updates an existing slot in the database by ID.
     */
    public function update(int $id, array $data): bool
    {
        $statement = $this->db->prepare(
            'UPDATE availability_slots
             SET lawyer_id = :lawyer_id,
                 available_date = :available_date,
                 start_time = :start_time,
                 end_time = :end_time,
                 status = :status
             WHERE slot_id = :id'
        );

        return $statement->execute([
            'id' => $id,
            'lawyer_id' => (int) $data['lawyer_id'],
            'available_date' => $data['available_date'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'status' => $data['status'],
        ]);
    }

    public function cancel(int $id): bool
    {
        $statement = $this->db->prepare(
            "UPDATE availability_slots SET status = 'Cancelled' WHERE slot_id = :id"
        );

        return $statement->execute(['id' => $id]);
    }

    public function duplicateExists(array $data, ?int $excludeId = null): bool
    {
        $sql = 'SELECT COUNT(*)
                FROM availability_slots
                WHERE lawyer_id = :lawyer_id
                  AND available_date = :available_date
                  AND start_time = :start_time
                  AND end_time = :end_time';

        $params = [
            'lawyer_id' => (int) $data['lawyer_id'],
            'available_date' => $data['available_date'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
        ];

        if ($excludeId !== null) {
            $sql .= ' AND slot_id != :exclude_id';
            $params['exclude_id'] = $excludeId;
        }

        $statement = $this->db->prepare($sql);
        $statement->execute($params);

        return (int) $statement->fetchColumn() > 0;
    }

    public function lawyerExists(int $lawyerId): bool
    {
        $statement = $this->db->prepare(
            "SELECT COUNT(*) FROM lawyers
             WHERE lawyer_id = :lawyer_id AND status = 'Active'"
        );
        $statement->execute(['lawyer_id' => $lawyerId]);

        return (int) $statement->fetchColumn() > 0;
    }

    public function availableCount(): int
    {
        $statement = $this->db->query("SELECT COUNT(*) FROM availability_slots WHERE status = 'Available'");

        return (int) $statement->fetchColumn();
    }
}
