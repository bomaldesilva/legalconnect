/**
 * LegalConnect — Shared Lawyer Notification Handler
 * Manages notification bell badge, dropdown toggle, notification list rendering,
 * and mark-as-read functionality across lawyer portal pages.
 */
'use strict';

(function () {
  let DEFAULT_LAWYER_USER_ID = 2;
  let currentUserId = DEFAULT_LAWYER_USER_ID;
  let isOpen = false;
  let notificationsList = [];

  document.addEventListener('DOMContentLoaded', async () => {
    // Attempt to resolve user ID from Auth API if logged in
    if (window.authApi) {
      try {
        const user = await window.authApi.me();
        if (user && user.user_id) {
          currentUserId = user.user_id;
        }
      } catch (err) {
        // Fallback to default lawyer user ID (2)
      }
    }

    initNotificationBell();
    fetchUnreadCount();
  });

  function initNotificationBell() {
    const notifBtn = document.querySelector('.topbar-right .notif-btn');
    if (!notifBtn) return;

    // Wrap notifBtn in a relative container so dropdown positions accurately beneath it
    let wrapper = notifBtn.closest('.notif-btn-wrapper');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'notif-btn-wrapper';
      wrapper.style.position = 'relative';
      wrapper.style.display = 'inline-flex';
      wrapper.style.alignItems = 'center';
      notifBtn.parentNode.insertBefore(wrapper, notifBtn);
      wrapper.appendChild(notifBtn);
    }

    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown();
    });

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('notifDropdown');
      if (dropdown && !dropdown.contains(e.target) && !notifBtn.contains(e.target)) {
        closeDropdown();
      }
    });
  }

  async function fetchUnreadCount() {
    const notifBtn = document.querySelector('.topbar-right .notif-btn');
    if (!notifBtn || !window.notificationsApi) return;

    try {
      const data = await window.notificationsApi.unreadCount(currentUserId);
      const count = data.unread_count || 0;
      let badge = notifBtn.querySelector('.notif-btn__badge');

      if (count > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'notif-btn__badge';
          notifBtn.appendChild(badge);
        }
        badge.textContent = count > 99 ? '99+' : count;
      } else if (badge) {
        badge.remove();
      }
    } catch (err) {
      console.warn('[Notifications] Failed to fetch unread count:', err);
    }
  }

  async function toggleDropdown() {
    if (isOpen) {
      closeDropdown();
    } else {
      await openDropdown();
    }
  }

  function closeDropdown() {
    const dropdown = document.getElementById('notifDropdown');
    if (dropdown) {
      dropdown.remove();
    }
    isOpen = false;
  }

  async function openDropdown() {
    closeDropdown(); // Ensure clean slate
    const notifBtn = document.querySelector('.topbar-right .notif-btn');
    if (!notifBtn) return;

    let wrapper = notifBtn.closest('.notif-btn-wrapper');
    if (!wrapper) {
      wrapper = notifBtn.parentNode;
    }

    const dropdown = document.createElement('div');
    dropdown.id = 'notifDropdown';
    dropdown.className = 'notif-dropdown';
    dropdown.style.position = 'absolute';
    dropdown.style.top = 'calc(100% + 10px)';
    dropdown.style.left = '0';
    dropdown.style.width = '350px';
    dropdown.style.background = '#ffffff';
    dropdown.style.border = '1px solid var(--line, #e2e8f0)';
    dropdown.style.borderRadius = '12px';
    dropdown.style.boxShadow = '0 10px 30px -5px rgba(15, 23, 42, 0.18), 0 4px 12px rgba(0, 0, 0, 0.08)';
    dropdown.style.zIndex = '9999';
    dropdown.style.display = 'flex';
    dropdown.style.flexDirection = 'column';
    dropdown.style.overflow = 'hidden';

    dropdown.innerHTML = `
      <div class="notif-dropdown__header" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--line, #e2e8f0);background:#ffffff;">
        <h4 class="notif-dropdown__title" style="font-size:14px;font-weight:700;color:var(--navy, #0f172a);margin:0;">Notifications</h4>
        <button class="notif-dropdown__action" id="markAllReadBtn" style="font-size:12px;color:var(--teal-dark, #0d9488);cursor:pointer;font-weight:600;background:none;border:none;padding:2px 6px;outline:none;">Mark all as read</button>
      </div>
      <div class="notif-dropdown__list" id="notifList" style="overflow-y:auto;flex:1;max-height:340px;background:#ffffff;">
        <div class="notif-dropdown__empty" style="padding:28px 16px;text-align:center;color:var(--muted, #64748b);font-size:13px;">Loading notifications...</div>
      </div>
    `;

    wrapper.appendChild(dropdown);
    isOpen = true;

    document.getElementById('markAllReadBtn')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      await markAllRead();
    });

    await loadNotifications();
  }

  async function loadNotifications() {
    const listEl = document.getElementById('notifList');
    if (!listEl || !window.notificationsApi) return;

    try {
      notificationsList = await window.notificationsApi.list(currentUserId);

      if (!notificationsList || notificationsList.length === 0) {
        listEl.innerHTML = '<div class="notif-dropdown__empty" style="padding:28px 16px;text-align:center;color:var(--muted, #64748b);font-size:13px;">No notifications yet.</div>';
        return;
      }

      listEl.innerHTML = notificationsList.map(n => {
        const isRead = Number(n.is_read) === 1;
        const formattedDate = window.LC && window.LC.formatDateTime ? window.LC.formatDateTime(n.created_at) : n.created_at;
        const titleEscaped = window.LC && window.LC.escapeHtml ? window.LC.escapeHtml(n.title) : n.title;
        const msgEscaped = window.LC && window.LC.escapeHtml ? window.LC.escapeHtml(n.message) : n.message;
        const bgStyle = isRead ? 'background:#ffffff;' : 'background:#f0faf9;';
        const fontWeight = isRead ? 'font-weight:600;' : 'font-weight:700;';
        const dotBg = isRead ? 'transparent' : 'var(--teal, #0ea5e9)';

        return `
          <div class="notif-item ${isRead ? 'read' : 'unread'}" data-id="${n.notification_id}" style="display:flex;gap:12px;align-items:flex-start;padding:12px 16px;border-bottom:1px solid var(--line, #e2e8f0);cursor:pointer;${bgStyle}">
            <span class="notif-item__dot" style="width:8px;height:8px;border-radius:50%;background:${dotBg};flex-shrink:0;margin-top:6px;"></span>
            <div class="notif-item__body" style="flex:1;min-width:0;">
              <div class="notif-item__title" style="font-size:13.5px;color:var(--navy, #0f172a);${fontWeight}line-height:1.4;">${titleEscaped}</div>
              <div style="font-size:12.5px;color:var(--text, #334155);margin:3px 0 4px;line-height:1.4;">${msgEscaped}</div>
              <div class="notif-item__meta" style="font-size:11px;color:var(--muted, #64748b);">${formattedDate}</div>
            </div>
          </div>
        `;
      }).join('');

      // Add click handlers for unread items
      listEl.querySelectorAll('.notif-item.unread').forEach(item => {
        item.addEventListener('click', async () => {
          const id = item.dataset.id;
          if (id) {
            await markRead(Number(id), item);
          }
        });
      });
    } catch (err) {
      listEl.innerHTML = '<div class="notif-dropdown__empty" style="padding:28px 16px;text-align:center;color:var(--danger, #ef4444);font-size:13px;">Failed to load notifications.</div>';
    }
  }

  async function markRead(id, itemEl) {
    if (!window.notificationsApi) return;
    try {
      await window.notificationsApi.markRead(id, currentUserId);
      if (itemEl) {
        itemEl.classList.remove('unread');
        itemEl.classList.add('read');
        itemEl.style.background = '#ffffff';
        const dot = itemEl.querySelector('.notif-item__dot');
        if (dot) dot.style.background = 'transparent';
      }
      await fetchUnreadCount();
    } catch (err) {
      console.warn('[Notifications] Failed to mark read:', err);
    }
  }

  async function markAllRead() {
    if (!window.notificationsApi) return;
    try {
      await window.notificationsApi.markAllRead(currentUserId);
      const items = document.querySelectorAll('#notifList .notif-item');
      items.forEach(item => {
        item.classList.remove('unread');
        item.classList.add('read');
        item.style.background = '#ffffff';
        const dot = item.querySelector('.notif-item__dot');
        if (dot) dot.style.background = 'transparent';
      });
      await fetchUnreadCount();
      if (window.LC && window.LC.showToast) {
        window.LC.showToast('All notifications marked as read.');
      }
    } catch (err) {
      console.warn('[Notifications] Failed to mark all read:', err);
    }
  }
})();
