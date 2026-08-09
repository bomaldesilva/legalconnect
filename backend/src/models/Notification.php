<?php

declare(strict_types=1);

/**
 * File: Notification.php
 * Description: Data access model for Notifications.
 */
class Notification
{
    public function __construct(private PDO $db)
    {
        $this->ensureTableExists();
    }

    private function ensureTableExists(): void
    {
        try {
            $this->db->exec(
                "CREATE TABLE IF NOT EXISTS notifications (
                  notification_id INT AUTO_INCREMENT PRIMARY KEY,
                  user_id         INT NOT NULL,
                  type            VARCHAR(50) NOT NULL,
                  title           VARCHAR(255) NOT NULL,
                  message         TEXT NOT NULL,
                  reference_id    INT DEFAULT NULL,
                  is_read         TINYINT(1) DEFAULT 0,
                  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                  INDEX idx_notif_user (user_id),
                  INDEX idx_notif_read (is_read)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"
            );
        } catch (Throwable $e) {
            // Ignore if table creation fails due to permissions or foreign key constraint
        }
    }

    /**
     * Fetch all notifications for a specific user, ordered newest first.
     */
    public function allForUser(int $userId): array
    {
        try {
            $statement = $this->db->prepare(
                "SELECT notification_id, user_id, type, title, message, reference_id, is_read, created_at
                 FROM notifications
                 WHERE user_id = :user_id
                 ORDER BY created_at DESC"
            );
            $statement->execute(['user_id' => $userId]);

            return $statement->fetchAll() ?: [];
        } catch (Throwable $e) {
            return [];
        }
    }

    /**
     * Count unread notifications for a user.
     */
    public function countUnread(int $userId): int
    {
        try {
            $statement = $this->db->prepare(
                "SELECT COUNT(*) FROM notifications WHERE user_id = :user_id AND is_read = 0"
            );
            $statement->execute(['user_id' => $userId]);

            return (int) $statement->fetchColumn();
        } catch (Throwable $e) {
            return 0;
        }
    }

    /**
     * Create a new notification.
     */
    public function create(array $data): int
    {
        $statement = $this->db->prepare(
            "INSERT INTO notifications (user_id, type, title, message, reference_id)
             VALUES (:user_id, :type, :title, :message, :reference_id)"
        );
        $statement->execute([
            'user_id'      => (int) $data['user_id'],
            'type'         => trim((string) $data['type']),
            'title'        => trim((string) $data['title']),
            'message'      => trim((string) $data['message']),
            'reference_id' => isset($data['reference_id']) ? (int) $data['reference_id'] : null,
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Mark a single notification as read.
     */
    public function markRead(int $notificationId, int $userId): bool
    {
        try {
            $statement = $this->db->prepare(
                "UPDATE notifications SET is_read = 1 WHERE notification_id = :id AND user_id = :user_id"
            );

            return $statement->execute([
                'id'      => $notificationId,
                'user_id' => $userId,
            ]);
        } catch (Throwable $e) {
            return false;
        }
    }

    /**
     * Mark all notifications as read for a user.
     */
    public function markAllRead(int $userId): bool
    {
        try {
            $statement = $this->db->prepare(
                "UPDATE notifications SET is_read = 1 WHERE user_id = :user_id AND is_read = 0"
            );

            return $statement->execute(['user_id' => $userId]);
        } catch (Throwable $e) {
            return false;
        }
    }
}
