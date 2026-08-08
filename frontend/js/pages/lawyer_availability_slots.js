/**
 * LegalConnect — Lawyer: Availability Slots Page
 *
 * Handles full CRUD for lawyer availability slots.
 * Features: search, status filters, KPI cards, loading skeletons,
 * collapsible form panel, row entrance animations, inline confirm dialog.
 */

'use strict';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const form           = document.getElementById('slotForm');
const rows           = document.getElementById('slotRows');
const formTitle      = document.getElementById('formTitle');
const slotId         = document.getElementById('slotId');
const lawyerId       = document.getElementById('lawyerId');
const availableDate  = document.getElementById('availableDate');
const startTime      = document.getElementById('startTime');
const endTime        = document.getElementById('endTime');
const slotStatus     = document.getElementById('slotStatus');
const saveButton     = document.getElementById('saveButton');
const resetButton    = document.getElementById('resetButton');
const slotCountBadge = document.getElementById('slotCount');
const searchInput    = document.getElementById('searchInput');
const resultsCountEl = document.getElementById('resultsCount');
const addNewBtn      = document.getElementById('addNewBtn');

// KPI elements
const kpiTotal       = document.getElementById('kpiTotal');
const kpiAvailable   = document.getElementById('kpiAvailable');
const kpiUnavailable = document.getElementById('kpiUnavailable');

// Form panel collapse
const formPanel       = document.getElementById('formPanel');
const formPanelToggle = document.getElementById('formPanelToggle');
const formBody        = document.getElementById('formBody');
const formToggleIcon  = document.getElementById('formToggleIcon');

// Sidebar toggle (mobile)
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar       = document.getElementById('sidebar');

// Filter chips
const filterChips = document.querySelectorAll('.filter-chip[data-filter]');

// ── State ─────────────────────────────────────────────────────────────────────
let slots        = [];
let searchQuery  = '';
let activeFilter = 'all';

// ── Self-contained Toast ───────────────────────────────────────────────────────
let _toastTimer = null;
function showToast(message, type = 'success') {
  // Try LC first, fallback to own implementation
  if (window.LC && window.LC.showToast) {
    window.LC.showToast(message, type);
    return;
  }
  let toast = document.getElementById('slot-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'slot-toast';
    toast.style.cssText = `
      position:fixed; bottom:24px; right:24px; z-index:99999;
      padding:12px 20px; border-radius:8px; font-size:14px; font-weight:600;
      box-shadow:0 4px 20px rgba(0,0,0,.15); transition:opacity .3s;
      max-width:360px; line-height:1.4;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.background = type === 'error' ? '#fee2e2' : '#d1fae5';
  toast.style.color      = type === 'error' ? '#dc2626' : '#065f46';
  toast.style.opacity    = '1';
  toast.style.display    = 'block';
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 4000);
}

// ── Self-contained Confirm Dialog ─────────────────────────────────────────────
function confirmDialog(message, confirmLabel, cancelLabel, btnStyle) {
  return new Promise((resolve) => {
    // Remove any existing dialog
    const existing = document.getElementById('slot-confirm-overlay');
    if (existing) existing.remove();

    const confirmColor = btnStyle === 'danger' ? '#dc2626'
                       : btnStyle === 'success' ? '#0d9488'
                       : '#0e9f6e';
    const confirmHover = btnStyle === 'danger' ? '#b91c1c'
                       : btnStyle === 'success' ? '#0f766e'
                       : '#057a55';

    // ── Overlay (full-screen dim) ──────────────────────────────────────────
    const overlay = document.createElement('div');
    overlay.id = 'slot-confirm-overlay';
    Object.assign(overlay.style, {
      position:        'fixed',
      top:             '0',
      left:            '0',
      right:           '0',
      bottom:          '0',
      zIndex:          '999999',
      background:      'rgba(13,31,60,0.55)',
      backdropFilter:  'blur(3px)',
      WebkitBackdropFilter: 'blur(3px)',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      padding:         '16px',
    });

    // ── Dialog box ────────────────────────────────────────────────────────
    const box = document.createElement('div');
    Object.assign(box.style, {
      background:   '#ffffff',
      borderRadius: '16px',
      padding:      '32px 28px 28px',
      width:        '100%',
      maxWidth:     '440px',
      boxShadow:    '0 24px 64px rgba(0,0,0,0.3)',
      position:     'relative',
      zIndex:       '1000000',
    });

    // ── Message ───────────────────────────────────────────────────────────
    const msg = document.createElement('p');
    msg.textContent = message;
    Object.assign(msg.style, {
      fontSize:     '15px',
      fontWeight:   '600',
      color:        '#0d1f3c',
      lineHeight:   '1.6',
      margin:       '0 0 24px',
      fontFamily:   'inherit',
    });

    // ── Button row ────────────────────────────────────────────────────────
    const btnRow = document.createElement('div');
    Object.assign(btnRow.style, {
      display:        'flex',
      justifyContent: 'flex-end',
      gap:            '10px',
    });

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.id          = 'slot-confirm-cancel';
    cancelBtn.type        = 'button';
    cancelBtn.textContent = cancelLabel || 'Cancel';
    Object.assign(cancelBtn.style, {
      padding:      '10px 20px',
      borderRadius: '8px',
      border:       '1.5px solid #e2e8f0',
      background:   '#f8fafc',
      color:        '#475569',
      fontSize:     '14px',
      fontWeight:   '600',
      cursor:       'pointer',
      fontFamily:   'inherit',
    });
    cancelBtn.onmouseenter = () => { cancelBtn.style.background = '#e2e8f0'; };
    cancelBtn.onmouseleave = () => { cancelBtn.style.background = '#f8fafc'; };

    // Confirm button
    const okBtn = document.createElement('button');
    okBtn.id          = 'slot-confirm-ok';
    okBtn.type        = 'button';
    okBtn.textContent = confirmLabel || 'Confirm';
    Object.assign(okBtn.style, {
      padding:      '10px 20px',
      borderRadius: '8px',
      border:       'none',
      background:   confirmColor,
      color:        '#ffffff',
      fontSize:     '14px',
      fontWeight:   '600',
      cursor:       'pointer',
      fontFamily:   'inherit',
    });
    okBtn.onmouseenter = () => { okBtn.style.background = confirmHover; };
    okBtn.onmouseleave = () => { okBtn.style.background = confirmColor; };

    // Assemble
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(okBtn);
    box.appendChild(msg);
    box.appendChild(btnRow);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // Focus confirm button
    setTimeout(() => okBtn.focus(), 50);

    function close(result) {
      overlay.style.opacity  = '0';
      overlay.style.transition = 'opacity .15s';
      setTimeout(() => overlay.remove(), 160);
      resolve(result);
    }

    okBtn.addEventListener('click',     () => close(true));
    cancelBtn.addEventListener('click', () => close(false));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { document.removeEventListener('keydown', onKey); close(false); }
    });
  });
}

// ── Escape HTML ───────────────────────────────────────────────────────────────
function escapeHtml(v) {
  return String(v ?? '').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function formatTime(v) {
  return String(v || '').slice(0, 5);
}

function formatDateTime(v) {
  if (!v) return '—';
  return String(v).replace(' ', ' at ');
}

function badge(status) {
  const cls = String(status).toLowerCase();
  return `<span class="badge ${cls}">${escapeHtml(status)}</span>`;
}

// ── KPI card update ───────────────────────────────────────────────────────────
function updateKPIs() {
  const total       = slots.length;
  const available   = slots.filter(s => s.status === 'Available').length;
  const unavailable = total - available;
  animateCounter(kpiTotal, total);
  animateCounter(kpiAvailable, available);
  animateCounter(kpiUnavailable, unavailable);
}

function animateCounter(el, target) {
  if (!el) return;
  const current  = parseInt(el.textContent, 10) || 0;
  if (current === target) { el.textContent = target; return; }
  const duration = 400;
  const start    = performance.now();
  function step(now) {
    const p    = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(current + (target - current) * ease);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── Filtering & searching ─────────────────────────────────────────────────────
function getFilteredSlots() {
  return slots.filter(slot => {
    if (activeFilter !== 'all' && slot.status !== activeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const dateMatch   = (slot.available_date || '').toLowerCase().includes(q);
      const lawyerMatch = (slot.lawyer_name || '').toLowerCase().includes(q);
      const timeMatch   = `${slot.start_time} ${slot.end_time}`.toLowerCase().includes(q);
      if (!dateMatch && !lawyerMatch && !timeMatch) return false;
    }
    return true;
  });
}

function updateResultsCount(filtered) {
  if (!resultsCountEl) return;
  resultsCountEl.textContent = (searchQuery || activeFilter !== 'all')
    ? `${filtered.length} of ${slots.length} shown`
    : `${filtered.length} slots`;
}

// ── Table rendering ───────────────────────────────────────────────────────────
function renderRows() {
  if (slotCountBadge) {
    const avail = slots.filter(s => s.status === 'Available').length;
    slotCountBadge.textContent = `${avail} available`;
  }
  updateKPIs();

  const filtered = getFilteredSlots();
  updateResultsCount(filtered);

  if (filtered.length === 0) {
    const isFiltered = searchQuery || activeFilter !== 'all';
    rows.innerHTML = `
      <tr><td colspan="7">
        <div class="empty-state">
          <div class="empty-state__icon">${isFiltered ? '⌕' : '◷'}</div>
          <p class="empty-state__title">${isFiltered ? 'No matching slots' : 'No availability slots yet'}</p>
          <p>${isFiltered
            ? 'Try adjusting your search or filter.'
            : 'Add a new time slot using the button above.'}</p>
          ${!isFiltered ? '<div class="empty-state__action"><button class="btn primary" type="button" onclick="document.getElementById(\'addNewBtn\').click()">+ Add Time Slot</button></div>' : ''}
        </div>
      </td></tr>`;
    return;
  }

  rows.innerHTML = filtered.map((slot, idx) => {
    const isCancelled = slot.status === 'Cancelled';
    const actionBtn = isCancelled
      ? `<button class="btn secondary icon-btn" type="button" title="Restore to Available"
           data-action="restore" data-id="${slot.slot_id}"
           style="color:var(--success, #0d9488); min-width:32px;">&#8635;</button>`
      : `<button class="btn danger icon-btn" type="button" title="Cancel this slot"
           data-action="cancel" data-id="${slot.slot_id}"
           style="min-width:32px;">&#10005;</button>`;

    return `
      <tr style="animation-delay:${idx * 40}ms">
        <td class="cell-num">${idx + 1}</td>
        <td class="cell-primary">${escapeHtml(slot.lawyer_name || 'Lawyer #' + slot.lawyer_id)}</td>
        <td style="font-weight:600;color:var(--navy,#0d1f3c);">${escapeHtml(slot.available_date)}</td>
        <td class="cell-muted">${formatTime(slot.start_time)} &ndash; ${formatTime(slot.end_time)}</td>
        <td>${badge(slot.status)}</td>
        <td class="cell-muted" style="font-size:13px;">${formatDateTime(slot.updated_at)}</td>
        <td>
          <div class="table-actions">
            <button class="btn secondary icon-btn" type="button" title="Edit slot"
              data-action="edit" data-id="${slot.slot_id}" style="min-width:32px;">&#9998;</button>
            ${actionBtn}
          </div>
        </td>
      </tr>`;
  }).join('');
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function showLoadingSkeleton() {
  rows.innerHTML = Array.from({ length: 4 }, () => `
    <tr class="skeleton-row">
      <td><div class="skeleton-bar w-20"></div></td>
      <td><div class="skeleton-bar w-60"></div></td>
      <td><div class="skeleton-bar w-40"></div></td>
      <td><div class="skeleton-bar w-60"></div></td>
      <td><div class="skeleton-bar badge-size"></div></td>
      <td><div class="skeleton-bar w-40"></div></td>
      <td><div class="skeleton-bar btn-size"></div></td>
    </tr>`).join('');
}

// ── Data loading ──────────────────────────────────────────────────────────────
async function loadSlots() {
  showLoadingSkeleton();
  try {
    const response = await fetch(getApiBase() + '/availability-slots', {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    const payload = await response.json().catch(() => ({ success: false, message: 'Invalid response.' }));
    if (!payload.success) throw new Error(payload.message || 'Failed to load slots.');
    slots = payload.data || [];
    renderRows();
  } catch (error) {
    rows.innerHTML = `
      <tr><td colspan="7">
        <div class="empty-state">
          <div class="empty-state__icon">&#9888;</div>
          <p class="empty-state__title">Connection Error</p>
          <p>Unable to load availability slots. Check your server.</p>
          <div class="empty-state__action">
            <button class="btn secondary" type="button" onclick="loadSlots()">Retry</button>
          </div>
        </div>
      </td></tr>`;
    showToast(error.message || 'Unable to load availability slots.', 'error');
  }
}

function getApiBase() {
  return window.LEGALCONNECT_API_BASE_URL
    || (window.location.origin + '/legalConnect/backend/public/api');
}

async function apiRequest(path, options = {}) {
  const response = await fetch(getApiBase() + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const payload = await response.json().catch(() => ({ success: false, message: 'Invalid server response.' }));
  if (!payload.success) {
    const err = new Error(payload.message || 'Request failed.');
    err.errors = payload.errors || {};
    throw err;
  }
  return payload.data;
}

// ── Form panel toggle ─────────────────────────────────────────────────────────
function expandFormPanel() {
  formBody.classList.remove('collapsed');
  if (formToggleIcon) formToggleIcon.classList.add('rotated');
}
function collapseFormPanel() {
  formBody.classList.add('collapsed');
  if (formToggleIcon) formToggleIcon.classList.remove('rotated');
}
function toggleFormPanel() {
  formBody.classList.contains('collapsed') ? expandFormPanel() : collapseFormPanel();
}

if (formPanelToggle) formPanelToggle.addEventListener('click', toggleFormPanel);

// ── "Add Time Slot" button ────────────────────────────────────────────────────
if (addNewBtn) {
  addNewBtn.addEventListener('click', () => {
    resetForm();
    expandFormPanel();
    formPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => availableDate && availableDate.focus(), 280);
  });
}

// ── Form helpers ──────────────────────────────────────────────────────────────
function resetForm() {
  if (form) form.reset();
  if (slotId)     slotId.value     = '';
  if (lawyerId)   lawyerId.value   = '2';
  if (slotStatus) slotStatus.value = 'Available';
  if (formTitle)  formTitle.textContent  = 'Add New Time Slot';
  if (saveButton) saveButton.textContent = 'Save Time Slot';
  if (form) form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

function fillForm(slot) {
  if (slotId)        slotId.value        = slot.slot_id;
  if (lawyerId)      lawyerId.value      = slot.lawyer_id;
  if (availableDate) availableDate.value = slot.available_date;
  if (startTime)     startTime.value     = formatTime(slot.start_time);
  if (endTime)       endTime.value       = formatTime(slot.end_time);
  if (slotStatus)    slotStatus.value    = slot.status;
  if (formTitle)     formTitle.textContent  = `Edit Slot #${slot.slot_id} — ${slot.available_date}`;
  if (saveButton)    saveButton.textContent = 'Update Time Slot';
  expandFormPanel();
  formPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => availableDate && availableDate.focus(), 280);
}

function payloadFromForm() {
  return {
    lawyer_id:      Number(lawyerId ? lawyerId.value : 2),
    available_date: availableDate ? availableDate.value : '',
    start_time:     startTime ? startTime.value : '',
    end_time:       endTime ? endTime.value : '',
    status:         slotStatus ? slotStatus.value : 'Available',
  };
}

// ── Form submit — create or update ───────────────────────────────────────────
if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload    = payloadFromForm();
    const isEditing  = !!(slotId && slotId.value); // capture BEFORE resetForm clears it
    const currentId  = slotId ? slotId.value : null;

    // Clear previous errors
    if (form) form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

    // Client-side validation
    if (!payload.available_date) {
      showToast('Available date is required.', 'error');
      if (availableDate) { availableDate.classList.add('is-invalid'); availableDate.focus(); }
      return;
    }
    if (!payload.start_time) {
      showToast('Start time is required.', 'error');
      if (startTime) { startTime.classList.add('is-invalid'); startTime.focus(); }
      return;
    }
    if (!payload.end_time) {
      showToast('End time is required.', 'error');
      if (endTime) { endTime.classList.add('is-invalid'); endTime.focus(); }
      return;
    }
    if (payload.start_time >= payload.end_time) {
      showToast('End time must be after start time.', 'error');
      if (endTime) { endTime.classList.add('is-invalid'); endTime.focus(); }
      return;
    }

    if (saveButton) {
      saveButton.disabled    = true;
      saveButton.textContent = isEditing ? 'Updating…' : 'Saving…';
    }

    try {
      if (isEditing) {
        await apiRequest('/availability-slots/' + currentId, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        showToast('Availability slot updated successfully.');
      } else {
        await apiRequest('/availability-slots', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('Availability slot created successfully.');
      }
      resetForm();
      collapseFormPanel();
      await loadSlots();
    } catch (error) {
      const details = Object.values(error.errors || {}).join(' ');
      showToast(details || error.message || 'Unable to save slot.', 'error');
    } finally {
      if (saveButton) {
        saveButton.disabled    = false;
        // isEditing is captured before resetForm → always correct
        saveButton.textContent = isEditing ? 'Update Time Slot' : 'Save Time Slot';
      }
    }
  });
}

if (resetButton) {
  resetButton.addEventListener('click', () => {
    resetForm();
    collapseFormPanel();
  });
}

// ── Table row actions ─────────────────────────────────────────────────────────
rows.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button || button.disabled) return;

  const action = button.dataset.action;
  const id     = Number(button.dataset.id);
  const slot   = slots.find(s => Number(s.slot_id) === id);

  // ── Edit ──────────────────────────────────────────────────────────────────
  if (action === 'edit') {
    if (!slot) { showToast('Slot not found. Please refresh.', 'error'); return; }
    fillForm(slot);
    return;
  }

  if (!slot) {
    showToast('Slot not found. Please refresh the page.', 'error');
    return;
  }

  // ── Cancel (soft-delete → Cancelled status) ───────────────────────────────
  if (action === 'cancel') {
    const dateStr = slot.available_date || '';
    const timeStr = formatTime(slot.start_time) + ' – ' + formatTime(slot.end_time);

    const confirmed = await confirmDialog(
      'Cancel the slot on ' + dateStr + ' (' + timeStr + ')?\nThis will mark it as Cancelled.',
      'Yes, Cancel Slot',
      'No, Keep It',
      'danger'
    );
    if (!confirmed) return;

    const origHTML = button.innerHTML;
    button.disabled  = true;
    button.innerHTML = '&#8987;'; // ⏳

    try {
      await apiRequest('/availability-slots/' + id, { method: 'DELETE' });
      showToast('Slot on ' + dateStr + ' has been cancelled.');
      await loadSlots();
    } catch (error) {
      showToast(error.message || 'Unable to cancel slot. Please try again.', 'error');
      button.disabled  = false;
      button.innerHTML = origHTML;
    }
    return;
  }

  // ── Restore (Cancelled → Available) ──────────────────────────────────────
  if (action === 'restore') {
    const dateStr = slot.available_date || '';

    const confirmed = await confirmDialog(
      'Restore the slot on ' + dateStr + ' back to Available?',
      'Yes, Restore',
      'No, Keep Cancelled',
      'success'
    );
    if (!confirmed) return;

    const origHTML = button.innerHTML;
    button.disabled  = true;
    button.innerHTML = '&#8987;'; // ⏳

    try {
      await apiRequest('/availability-slots/' + id, {
        method: 'PUT',
        body: JSON.stringify({
          lawyer_id:      slot.lawyer_id,
          available_date: slot.available_date,
          start_time:     slot.start_time,
          end_time:       slot.end_time,
          status:         'Available',
        }),
      });
      showToast('Slot on ' + dateStr + ' restored to Available.');
      await loadSlots();
    } catch (error) {
      showToast(error.message || 'Unable to restore slot. Please try again.', 'error');
      button.disabled  = false;
      button.innerHTML = origHTML;
    }
    return;
  }
});

// ── Search & Filter ───────────────────────────────────────────────────────────
let searchTimeout = null;
if (searchInput) {
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = searchInput.value.trim();
      renderRows();
    }, 200);
  });
}

filterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    filterChips.forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    activeFilter = chip.dataset.filter;
    renderRows();
  });
});

// ── Sidebar toggle (mobile) ──────────────────────────────────────────────────
if (sidebarToggle && sidebar) {
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('sidebar--open');
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────
loadSlots();
