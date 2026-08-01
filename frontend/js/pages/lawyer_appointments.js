/**
 * LegalConnect — Lawyer Appointments Page
 * Connects to real /api/appointments endpoint.
 * Lawyer demo ID = 2. Filters all appointments by lawyer_id.
 */
'use strict';

// ── Constants ─────────────────────────────────────────────────────────────────
const LAWYER_ID = 2;

// ── State ─────────────────────────────────────────────────────────────────────
let allAppointments = [];
let activeFilter    = 'All';
let searchQuery     = '';
let isLoading       = true;

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('sidebar--open');
  });
  document.getElementById('closeViewModalBtn')?.addEventListener('click', closeModal);
  document.getElementById('viewApptModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  setupFilterChips();
  setupSearch();
  loadAppointments();

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  document.getElementById('todayDate').textContent = today;
});

// ── Data Loading ──────────────────────────────────────────────────────────────
async function loadAppointments() {
  try {
    const data = await window.appointmentsApi.list();
    // Filter to only this lawyer's appointments
    allAppointments = data.filter(a => String(a.lawyer_id) === String(LAWYER_ID));
    isLoading = false;
    renderAll();
  } catch (err) {
    isLoading = false;
    document.getElementById('appointmentsTableBody').innerHTML = `
      <tr><td colspan="7" style="padding:40px;text-align:center;color:var(--danger);">
        Failed to load appointments: ${LC.escapeHtml(err.message)}
      </td></tr>`;
    LC.showToast('Could not load appointments.', 'error');
  }
}

// ── Render All ────────────────────────────────────────────────────────────────
function renderAll() {
  updateKPIs();
  renderTable();
  renderTodaySchedule();
  renderModeCounts();
}

// ── KPIs ──────────────────────────────────────────────────────────────────────
function updateKPIs() {
  document.getElementById('kpiTotal').textContent     = allAppointments.length;
  document.getElementById('kpiPending').textContent   = allAppointments.filter(a => a.status === 'Pending').length;
  document.getElementById('kpiConfirmed').textContent = allAppointments.filter(a => a.status === 'Confirmed').length;
  document.getElementById('kpiCompleted').textContent = allAppointments.filter(a => a.status === 'Completed').length;
}

// ── Mode counts ───────────────────────────────────────────────────────────────
function renderModeCounts() {
  const active = allAppointments.filter(a => a.status !== 'Cancelled' && a.status !== 'NoShow');
  document.getElementById('modeOnlineCount').textContent   = active.filter(a => a.mode === 'Online').length;
  document.getElementById('modePhysicalCount').textContent = active.filter(a => a.mode === 'Physical').length;
}

// ── Today's schedule sidebar ──────────────────────────────────────────────────
function renderTodaySchedule() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todays   = allAppointments.filter(a => a.appointment_date === todayStr && a.status !== 'Cancelled');
  const container = document.getElementById('todaySchedule');

  if (todays.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:24px 0;">
        <div class="empty-state__icon">📅</div>
        <p style="font-size:13px;color:var(--muted);">No appointments today.</p>
      </div>`;
    return;
  }

  container.innerHTML = todays.map(a => `
    <div class="agenda-slot ${a.status === 'Confirmed' ? 'agenda-slot--booked' : ''}" style="margin-bottom:10px;">
      <div class="agenda-slot-time">${LC.formatTime(a.start_time)} – ${LC.formatTime(a.end_time)}</div>
      <h4 class="agenda-slot-title">${LC.escapeHtml(a.client_name)}</h4>
      <p class="agenda-slot-desc">${LC.escapeHtml(a.mode)} · ${statusBadge(a.status)}</p>
    </div>`).join('');
}

// ── Table ─────────────────────────────────────────────────────────────────────
function renderTable() {
  const tbody      = document.getElementById('appointmentsTableBody');
  const emptyState = document.getElementById('emptyState');
  const badge      = document.getElementById('resultsCount');

  const filtered = allAppointments.filter(a => {
    if (activeFilter !== 'All' && a.status !== activeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (a.client_name || '').toLowerCase().includes(q) ||
             (a.package_name || '').toLowerCase().includes(q);
    }
    return true;
  });

  badge.textContent = `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  tbody.innerHTML = filtered.map(a => {
    let actions = `<button class="btn secondary btn--sm" onclick="openViewModal(${a.appointment_id})">View</button>`;
    if (a.status === 'Pending') {
      actions += ` <button class="btn primary btn--sm" onclick="actionConfirm(${a.appointment_id})">Confirm</button>`;
      actions += ` <button class="btn danger btn--sm" onclick="actionCancel(${a.appointment_id})">Cancel</button>`;
    } else if (a.status === 'Confirmed') {
      actions += ` <button class="btn primary btn--sm" onclick="actionComplete(${a.appointment_id})">Complete</button>`;
      actions += ` <button class="btn danger btn--sm" onclick="actionCancel(${a.appointment_id})">Cancel</button>`;
    }

    return `
      <tr style="border-bottom:1px solid var(--line);">
        <td style="padding:12px 8px;font-weight:600;color:var(--navy);">#${a.appointment_id}</td>
        <td style="padding:12px 8px;">
          <div style="font-weight:600;">${LC.escapeHtml(a.client_name)}</div>
        </td>
        <td style="padding:12px 8px;">
          <div>${a.appointment_date}</div>
          <div style="font-size:11px;color:var(--muted);">${LC.formatTime(a.start_time)} – ${LC.formatTime(a.end_time)}</div>
        </td>
        <td style="padding:12px 8px;">${modeBadge(a.mode)}</td>
        <td style="padding:12px 8px;font-size:12px;">${LC.escapeHtml(a.package_name || '—')}</td>
        <td style="padding:12px 8px;">${statusBadge(a.status)}</td>
        <td style="padding:12px 8px;">
          <div style="display:flex;gap:6px;flex-wrap:wrap;">${actions}</div>
        </td>
      </tr>`;
  }).join('');
}

// ── Status/Mode badge helpers ─────────────────────────────────────────────────
function statusBadge(status) {
  const map = {
    Pending:   'badge--warning',
    Confirmed: 'badge--success',
    Completed: 'badge--active',
    Cancelled: 'badge--inactive',
    NoShow:    'badge--danger',
  };
  return `<span class="badge ${map[status] || ''}">${LC.escapeHtml(status)}</span>`;
}
function modeBadge(mode) {
  return `<span class="badge ${mode === 'Online' ? 'badge--info' : 'badge--primary'}">${LC.escapeHtml(mode)}</span>`;
}

// ── Filter chips & search ─────────────────────────────────────────────────────
function setupFilterChips() {
  document.querySelectorAll('#filterChips .filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#filterChips .filter-chip').forEach(c => c.classList.remove('filter-chip--active'));
      chip.classList.add('filter-chip--active');
      activeFilter = chip.getAttribute('data-filter');
      renderTable();
    });
  });
}
function setupSearch() {
  document.getElementById('searchInput')?.addEventListener('input', e => {
    searchQuery = e.target.value;
    renderTable();
  });
}

// ── View Modal ────────────────────────────────────────────────────────────────
window.openViewModal = function(id) {
  const a = allAppointments.find(x => x.appointment_id === id);
  if (!a) return;

  document.getElementById('viewApptBody').innerHTML = `
    <div class="detail-row"><span class="detail-row__label">Client</span><strong class="detail-row__value">${LC.escapeHtml(a.client_name)}</strong></div>
    <div class="detail-row"><span class="detail-row__label">Date</span><span class="detail-row__value">${a.appointment_date}</span></div>
    <div class="detail-row"><span class="detail-row__label">Time</span><span class="detail-row__value">${LC.formatTime(a.start_time)} – ${LC.formatTime(a.end_time)}</span></div>
    <div class="detail-row"><span class="detail-row__label">Mode</span><span class="detail-row__value">${modeBadge(a.mode)}</span></div>
    <div class="detail-row"><span class="detail-row__label">Package</span><span class="detail-row__value">${LC.escapeHtml(a.package_name || '—')}</span></div>
    <div class="detail-row"><span class="detail-row__label">Fee</span><span class="detail-row__value">LKR ${a.package_fee ? Number(a.package_fee).toLocaleString() : '—'}</span></div>
    <div class="detail-row"><span class="detail-row__label">Status</span><span class="detail-row__value">${statusBadge(a.status)}</span></div>
    <div class="detail-row"><span class="detail-row__label">Booked On</span><span class="detail-row__value">${LC.formatDateTime(a.created_at)}</span></div>`;

  let footer = `<button class="btn secondary" onclick="closeModal()">Close</button>`;
  if (a.status === 'Pending') {
    footer = `<button class="btn danger" onclick="actionCancel(${id});closeModal();">Cancel</button>
              <button class="btn primary" onclick="actionConfirm(${id});closeModal();">Confirm</button>` + footer;
  } else if (a.status === 'Confirmed') {
    footer = `<button class="btn danger" onclick="actionCancel(${id});closeModal();">Cancel</button>
              <button class="btn primary" onclick="actionComplete(${id});closeModal();">Mark Complete</button>` + footer;
  }
  document.getElementById('viewApptFooter').innerHTML = footer;
  document.getElementById('viewApptModal').classList.add('lc-modal--open');
};

window.closeModal = function() {
  document.getElementById('viewApptModal').classList.remove('lc-modal--open');
};

// ── Status Actions ────────────────────────────────────────────────────────────
window.actionConfirm = async function(id) {
  await changeStatus(id, 'Confirmed');
};
window.actionComplete = async function(id) {
  await changeStatus(id, 'Completed');
};
window.actionCancel = function(id) {
  LC.openConfirmModal(
    'Are you sure you want to cancel this appointment? The slot will be released.',
    'Cancel Appointment',
    'danger'
  ).then(async confirmed => {
    if (!confirmed) return;
    try {
      await window.appointmentsApi.delete(id);
      allAppointments = allAppointments.map(a =>
        a.appointment_id === id ? { ...a, status: 'Cancelled' } : a
      );
      renderAll();
      LC.showToast('Appointment cancelled and slot released.', 'success');
    } catch (err) {
      LC.showToast('Cancel failed: ' + err.message, 'error');
    }
  });
};

async function changeStatus(id, newStatus) {
  const a = allAppointments.find(x => x.appointment_id === id);
  if (!a) return;
  try {
    const updated = await window.appointmentsApi.update(id, {
      client_id:        a.client_id,
      lawyer_id:        a.lawyer_id,
      slot_id:          a.slot_id,
      package_id:       a.package_id,
      appointment_date: a.appointment_date,
      start_time:       LC.formatTime(a.start_time),
      end_time:         LC.formatTime(a.end_time),
      mode:             a.mode,
      status:           newStatus,
    });
    allAppointments = allAppointments.map(x =>
      x.appointment_id === id ? { ...x, status: updated.status } : x
    );
    renderAll();
    LC.showToast(`Appointment marked as ${newStatus}.`, 'success');
  } catch (err) {
    LC.showToast('Update failed: ' + err.message, 'error');
  }
}
