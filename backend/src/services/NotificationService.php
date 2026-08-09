<?php

declare(strict_types=1);

/**
 * File: NotificationService.php
 * Description: Business logic layer for notifications.
 */
class NotificationService
{
    public function __construct(private Notification $model)
    {
    }

    public function getForUser(int $userId): array
    {
        return $this->model->allForUser($userId);
    }

    public function getUnreadCount(int $userId): int
    {
        return $this->model->countUnread($userId);
    }

    public function create(array $data): int
    {
        if (empty($data['user_id']) || empty($data['title']) || empty($data['message'])) {
            throw new ValidationException('Notification requires user_id, title, and message.');
        }

        return $this->model->create($data);
    }

    public function markRead(int $id, int $userId): bool
    {
        return $this->model->markRead($id, $userId);
    }

    public function markAllRead(int $userId): bool
    {
        return $this->model->markAllRead($userId);
    }
}
