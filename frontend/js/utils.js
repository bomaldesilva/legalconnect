/**
 * LegalConnect — Shared Frontend Utilities
 *
 * Loaded before every page script. Provides common helpers so that
 * page-level scripts stay focused on their own logic.
 *
 * Exposed as window.LC (namespace) to avoid global name collisions.
 */

(function () {
  'use strict';

  // ── HTML escaping ────────────────────────────────────────────────────────
  /**
   * Encodes characters that could be interpreted as HTML.
   * Always call this before inserting user-supplied strings with innerHTML.
   * @param {*} value
   * @returns {string}
   */
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }[ch]));
  }

  // ── Status badges ────────────────────────────────────────────────────────
  /**
   * Returns an HTML <span> badge styled by status string.
   * CSS classes: active | inactive | available | booked | cancelled
   * @param {string} status
   * @returns {string}
   */
  function badge(status) {
    const cls = String(status).toLowerCase();
    return `<span class="badge ${cls}">${escapeHtml(status)}</span>`;
  }

  // ── Date / time formatting ───────────────────────────────────────────────
  /**
   * Formats a MySQL DATETIME string for display.
   * "2025-07-30 14:30:00" → "2025-07-30 at 14:30:00"
   * @param {string|null} value
   * @returns {string}
   */
  function formatDateTime(value) {
    if (!value) return '—';
    return String(value).replace(' ', ' at ');
  }

  /**
   * Trims seconds from a TIME string returned by MySQL.
   * "09:00:00" → "09:00"
   * @param {string|null} value
   * @returns {string}
   */
  function formatTime(value) {
    return String(value || '').slice(0, 5);
  }

  // ── Toast notifications ──────────────────────────────────────────────────
  let _toastTimer = null;

  /**
   * Shows a floating toast notification that auto-dismisses after 4 s.
   * Creates a #lc-toast element on first call; reuses it subsequently.
   * @param {string} message
   * @param {'success'|'error'} type
   */
  function showToast(message, type = 'success') {
    let toast = document.getElementById('lc-toast');

    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'lc-toast';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = `lc-toast lc-toast--${type} lc-toast--show`;

    if (_toastTimer) clearTimeout(_toastTimer);

    _toastTimer = setTimeout(() => {
      toast.classList.remove('lc-toast--show');
    }, 4000);
  }

  // ── Confirmation modal ───────────────────────────────────────────────────
  /**
   * Opens a lightweight confirmation modal.
   * Resolves with true if the user confirms, false if they cancel.
   * Creates modal elements once; reuses on subsequent calls.
   *
   * @param {string} message   The body text to show.
   * @param {string} [confirmLabel='Confirm']  Label for the confirm button.
   * @param {'danger'|'primary'} [confirmStyle='danger']  Button variant.
   * @returns {Promise<boolean>}
   */
  function openConfirmModal(message, confirmLabel = 'Confirm', confirmStyle = 'danger') {
    return new Promise((resolve) => {
      let overlay = document.getElementById('lc-modal-overlay');

      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'lc-modal-overlay';
        overlay.innerHTML = `
          <div class="lc-modal" role="dialog" aria-modal="true" aria-labelledby="lc-modal-msg">
            <p id="lc-modal-msg" class="lc-modal__message"></p>
            <div class="lc-modal__actions">
              <button id="lc-modal-cancel" class="btn secondary">Cancel</button>
              <button id="lc-modal-confirm" class="btn danger">Confirm</button>
            </div>
          </div>`;
        document.body.appendChild(overlay);
      }

      const msgEl     = document.getElementById('lc-modal-msg');
      const confirmEl = document.getElementById('lc-modal-confirm');
      const cancelEl  = document.getElementById('lc-modal-cancel');

      msgEl.textContent    = message;
      confirmEl.textContent = confirmLabel;
      confirmEl.className   = `btn ${confirmStyle}`;

      overlay.classList.add('lc-modal-overlay--show');
      confirmEl.focus();

      function close(result) {
        overlay.classList.remove('lc-modal-overlay--show');
        confirmEl.removeEventListener('click', onConfirm);
        cancelEl.removeEventListener('click', onCancel);
        overlay.removeEventListener('click', onBackdrop);
        resolve(result);
      }

      function onConfirm() { close(true); }
      function onCancel()  { close(false); }
      function onBackdrop(e) {
        if (e.target === overlay) close(false);
      }

      confirmEl.addEventListener('click', onConfirm);
      cancelEl.addEventListener('click', onCancel);
      overlay.addEventListener('click', onBackdrop);
    });
  }

  // ── Public API ───────────────────────────────────────────────────────────
  window.LC = {
    escapeHtml,
    badge,
    formatDateTime,
    formatTime,
    showToast,
    openConfirmModal,
  };
  // ── Auth Guard ───────────────────────────────────────────────────────────
  window.addEventListener('load', async () => {
    // Determine if page requires auth based on its path
    const path = window.location.pathname;
    const isProtected = (path.includes('admin_') || path.includes('lawyer_') || path.includes('client_')) && !path.includes('login');
    
    if (isProtected && window.authApi) {
      try {
        const user = await window.authApi.me();
        
        // Simple role check based on filename prefix
        if (path.includes('admin_') && user.role !== 'Admin') window.location.href = 'login.html';
        if (path.includes('lawyer_') && user.role !== 'Lawyer') window.location.href = 'login.html';
        if (path.includes('client_') && user.role !== 'Client') window.location.href = 'login.html';
        
        // Populate user name in the topbar if the element exists
        const userNameEl = document.querySelector('.header__user-name');
        if (userNameEl) {
          userNameEl.textContent = `${user.first_name} ${user.last_name}`;
        }
        
        // Wire up all logout buttons dynamically
        const logoutBtns = Array.from(document.querySelectorAll('a')).filter(a => a.textContent.trim() === 'Logout');
        logoutBtns.forEach(btn => {
            btn.onclick = null; // remove inline onclick
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                if (confirm('Are you sure you want to log out?')) {
                    try { await window.authApi.logout(); } catch(e) {}
                    window.location.href = 'login.html';
                }
            });
        });

      } catch (err) {
        // Not logged in -> redirect to login
        window.location.href = 'login.html';
      }
    }
  });

})();
