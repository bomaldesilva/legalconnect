/**
 * LegalConnect — Lawyer: Availability Slots Page
 *
 * Handles full CRUD for lawyer availability slots.
 * Features: search, status filters, KPI cards, loading skeletons,
 * collapsible form panel, row entrance animations, modal confirmation.
 *
 * Utility helpers (escapeHtml, badge, formatDateTime, formatTime, showToast,
 * openConfirmModal) come from utils.js via the window.LC namespace.
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
  const current = parseInt(el.textContent, 10) || 0;
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
    // Status filter
    if (activeFilter !== 'all' && slot.status !== activeFilter) return false;

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const dateMatch   = (slot.available_date || '').toLowerCase().includes(q);
      const lawyerMatch = (slot.lawyer_name || '').toLowerCase().includes(q);
      const timeMatch   = `${slot.start_time} - ${slot.end_time}`.toLowerCase().includes(q);
      if (!dateMatch && !lawyerMatch && !timeMatch) return false;
    }

    return true;
  });
}

function updateResultsCount(filtered) {
  if (!resultsCountEl) return;
  if (searchQuery || activeFilter !== 'all') {
    resultsCountEl.textContent = `${filtered.length} of ${slots.length} shown`;
  } else {
    resultsCountEl.textContent = `${filtered.length} slots`;
  }
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
            ? 'Try adjusting your search or date criteria.'
            : 'Add a new time slot to make lawyer available for booking.'}</p>
          ${!isFiltered ? '<div class="empty-state__action"><button class="btn primary" type="button" onclick="document.getElementById(\'addNewBtn\').click()">+ Add Time Slot</button></div>' : ''}
        </div>
      </td></tr>`;
    return;
  }

  rows.innerHTML = filtered.map((slot, idx) => `
    <tr style="animation-delay:${idx * 40}ms">
      <td class="cell-num">${idx + 1}</td>
      <td class="cell-primary">${LC.escapeHtml(slot.lawyer_name || `Lawyer #${slot.lawyer_id}`)}</td>
      <td style="font-weight:600; color:var(--navy);">${LC.escapeHtml(slot.available_date)}</td>
      <td class="cell-muted">${LC.formatTime(slot.start_time)} – ${LC.formatTime(slot.end_time)}</td>
      <td>${LC.badge(slot.status)}</td>
      <td class="cell-muted" style="font-size:13px;">${LC.formatDateTime(slot.updated_at)}</td>
      <td>
        <div class="table-actions">
          <button class="btn secondary icon-btn" type="button" title="Edit"
            data-action="edit" data-id="${slot.slot_id}">✎</button>
          <button class="btn danger icon-btn" type="button" title="Cancel Slot"
            data-action="cancel" data-id="${slot.slot_id}"
            ${slot.status === 'Cancelled' ? 'disabled title="Already cancelled"' : ''}>✕</button>
        </div>
      </td>
    </tr>`).join('');
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
    slots = await window.availabilitySlots.list();
    renderRows();
  } catch (error) {
    rows.innerHTML = `
      <tr><td colspan="7">
        <div class="empty-state">
          <div class="empty-state__icon">⚠</div>
          <p class="empty-state__title">Connection Error</p>
          <p>Unable to load availability slots.</p>
          <div class="empty-state__action">
            <button class="btn secondary" type="button" onclick="loadSlots()">Retry</button>
          </div>
        </div>
      </td></tr>`;
    LC.showToast(error.message || 'Unable to load availability slots.', 'error');
  }
}

// ── Form panel toggle ─────────────────────────────────────────────────────────
function expandFormPanel() {
  formBody.classList.remove('collapsed');
  formToggleIcon.classList.add('rotated');
}

function collapseFormPanel() {
  formBody.classList.add('collapsed');
  formToggleIcon.classList.remove('rotated');
}

function toggleFormPanel() {
  if (formBody.classList.contains('collapsed')) {
    expandFormPanel();
  } else {
    collapseFormPanel();
  }
}

formPanelToggle.addEventListener('click', toggleFormPanel);

// ── "Add Time Slot" button ────────────────────────────────────────────────────
addNewBtn.addEventListener('click', () => {
  resetForm();
  expandFormPanel();
  formPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => availableDate.focus(), 280);
});

// ── Form helpers ──────────────────────────────────────────────────────────────
function resetForm() {
  form.reset();
  slotId.value        = '';
  lawyerId.value      = '2'; // Default demo lawyer
  slotStatus.value    = 'Available';
  formTitle.textContent = 'Add New Time Slot';
  saveButton.textContent = 'Save Time Slot';
  form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

function fillForm(slot) {
  slotId.value        = slot.slot_id;
  lawyerId.value      = slot.lawyer_id;
  availableDate.value = slot.available_date;
  startTime.value     = LC.formatTime(slot.start_time);
  endTime.value       = LC.formatTime(slot.end_time);
  slotStatus.value    = slot.status;
  formTitle.textContent  = `Edit Slot #${slot.slot_id} (${slot.available_date})`;
  saveButton.textContent = 'Update Time Slot';

  expandFormPanel();
  formPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => availableDate.focus(), 280);
}

function payloadFromForm() {
  return {
    lawyer_id:      Number(lawyerId.value),
    available_date: availableDate.value,
    start_time:     startTime.value,
    end_time:       endTime.value,
    status:         slotStatus.value,
  };
}

// ── Form submit — create or update ───────────────────────────────────────────
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = payloadFromForm();

  // Basic client validation
  if (!payload.available_date) {
    LC.showToast('Available date is required.', 'error');
    availableDate.classList.add('is-invalid');
    availableDate.focus();
    return;
  }
  if (!payload.start_time) {
    LC.showToast('Start time is required.', 'error');
    startTime.classList.add('is-invalid');
    startTime.focus();
    return;
  }
  if (!payload.end_time) {
    LC.showToast('End time is required.', 'error');
    endTime.classList.add('is-invalid');
    endTime.focus();
    return;
  }

  saveButton.disabled    = true;
  saveButton.textContent = slotId.value ? 'Updating…' : 'Saving…';

  try {
    if (slotId.value) {
      await window.availabilitySlots.update(slotId.value, payload);
      LC.showToast('Availability slot updated successfully.');
    } else {
      await window.availabilitySlots.create(payload);
      LC.showToast('Availability slot created successfully.');
    }

    resetForm();
    collapseFormPanel();
    await loadSlots();
  } catch (error) {
    const details = Object.values(error.errors || {}).join(' ');
    LC.showToast(details || error.message || 'Unable to save slot.', 'error');
  } finally {
    saveButton.disabled    = false;
    saveButton.textContent = slotId.value ? 'Update Time Slot' : 'Save Time Slot';
  }
});

resetButton.addEventListener('click', () => {
  resetForm();
  collapseFormPanel();
});

// ── Table row actions ─────────────────────────────────────────────────────────
rows.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button || button.disabled) return;

  const id   = Number(button.dataset.id);
  const slot = slots.find((s) => Number(s.slot_id) === id);

  if (button.dataset.action === 'edit' && slot) {
    fillForm(slot);
    return;
  }

  if (button.dataset.action === 'cancel') {
    const confirmed = await LC.openConfirmModal(
      `Cancel slot on ${slot?.available_date || ''} (${LC.formatTime(slot?.start_time)}–${LC.formatTime(slot?.end_time)})? Status will change to Cancelled.`,
      'Cancel Slot',
      'danger'
    );

    if (!confirmed) return;

    button.disabled = true;

    try {
      await window.availabilitySlots.delete(id);
      LC.showToast('Availability slot cancelled.');
      await loadSlots();
    } catch (error) {
      LC.showToast(error.message || 'Unable to cancel slot.', 'error');
      button.disabled = false;
    }
  }
});

// ── Search & Filter ───────────────────────────────────────────────────────────
let searchTimeout = null;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchQuery = searchInput.value.trim();
    renderRows();
  }, 200);
});

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
