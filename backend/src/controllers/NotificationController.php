<?php

declare(strict_types=1);

/**
 * File: NotificationController.php
 * Description: HTTP Controller for managing Notifications.
 */
class NotificationController
{
    public function __construct(private NotificationService $service)
    {
    }

    /**
     * GET /api/notifications?user_id=X
     */
    public function index(): void
    {
        $userId = (int) ($_GET['user_id'] ?? 0);
        if ($userId <= 0) {
            Response::error('User ID is required.', 400);
            return;
        }

        Response::success($this->service->getForUser($userId), 'Notifications loaded.');
    }

    /**
     * GET /api/notifications/unread-count?user_id=X
     */
    public function unreadCount(): void
    {
        $userId = (int) ($_GET['user_id'] ?? 0);
        if ($userId <= 0) {
            Response::error('User ID is required.', 400);
            return;
        }

        Response::success(['unread_count' => $this->service->getUnreadCount($userId)], 'Unread count loaded.');
    }

    /**
     * PUT /api/notifications/{id}/read
     */
    public function markRead(int $id): void
    {
        $body = Request::body();
        $userId = (int) ($body['user_id'] ?? ($_GET['user_id'] ?? 0));

        if ($userId <= 0) {
            Response::error('User ID is required.', 400);
            return;
        }

        $this->service->markRead($id, $userId);
        Response::success(null, 'Notification marked as read.');
    }

    /**
     * PUT /api/notifications/mark-all-read
     */
    public function markAllRead(): void
    {
        $body = Request::body();
        $userId = (int) ($body['user_id'] ?? ($_GET['user_id'] ?? 0));

        if ($userId <= 0) {
            Response::error('User ID is required.', 400);
            return;
        }

        $this->service->markAllRead($userId);
        Response::success(null, 'All notifications marked as read.');
    }
}
