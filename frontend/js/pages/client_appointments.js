/**
 * LegalConnect — Client Appointments Page
 * Loads real appointments from /api/appointments, filtered by client_id.
 * Demo client_id = 3.
 */
'use strict';

// ── Constants ─────────────────────────────────────────────────────────────────
let CLIENT_ID = null;

// ── State ─────────────────────────────────────────────────────────────────────
let allAppointments = [];
let activeFilter    = 'All';
let searchQuery     = '';

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const user = await window.authApi.me();
    CLIENT_ID = user.user_id;
  } catch(err) {
    window.location.href = 'login.html';
    return;
  }
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('sidebar--open');
  });
  document.getElementById('closeViewModalBtn')?.addEventListener('click', closeModal);
  document.getElementById('viewApptModal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  setupFilterChips();
  setupSearch();
  loadAppointments();
});

// ── Load data ─────────────────────────────────────────────────────────────────
async function loadAppointments() {
  try {
    const data = await window.appointmentsApi.list();
    allAppointments = data.filter(a => String(a.client_id) === String(CLIENT_ID));
    renderAll();
  } catch (err) {
    document.getElementById('appointmentsTableBody').innerHTML = `
      <tr><td colspan="7" style="padding:40px;text-align:center;color:var(--danger);">
        Failed to load appointments: ${LC.escapeHtml(err.message)}
      </td></tr>`;
    LC.showToast('Could not load appointments.', 'error');
  }
}

// ── Render all ────────────────────────────────────────────────────────────────
function renderAll() {
  updateKPIs();
  renderTable();
}

// ── KPIs ──────────────────────────────────────────────────────────────────────
function updateKPIs() {
  document.getElementById('kpiTotal').textContent    = allAppointments.length;
  document.getElementById('kpiUpcoming').textContent = allAppointments.filter(
    a => a.status === 'Pending' || a.status === 'Confirmed'
  ).length;
  document.getElementById('kpiCompleted').textContent = allAppointments.filter(
    a => a.status === 'Completed'
  ).length;
}

// ── Table ─────────────────────────────────────────────────────────────────────
function renderTable() {
  const tbody      = document.getElementById('appointmentsTableBody');
  const emptyState = document.getElementById('emptyState');
  const countEl    = document.getElementById('resultsCount');

  const filtered = allAppointments.filter(a => {
    if (activeFilter !== 'All' && a.status !== activeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (a.lawyer_name || '').toLowerCase().includes(q) ||
             (a.package_name || '').toLowerCase().includes(q);
    }
    return true;
  });

  countEl.textContent = `Showing ${filtered.length} result${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  tbody.innerHTML = filtered.map(a => {
    let actions = `<button class="btn secondary btn--sm" onclick="openViewModal(${a.appointment_id})">View</button>`;
    if (a.status === 'Pending' || a.status === 'Confirmed') {
      actions += ` <button class="btn danger btn--sm" onclick="cancelAppt(${a.appointment_id})">Cancel</button>`;
    }

    return `
      <tr style="border-bottom:1px solid var(--line);">
        <td style="padding:12px 8px;font-weight:600;color:var(--navy);">#${a.appointment_id}</td>
        <td style="padding:12px 8px;">
          <div style="font-weight:600;">${LC.escapeHtml(a.lawyer_name)}</div>
          <div style="font-size:11px;color:var(--muted);">${LC.escapeHtml(a.package_name || '—')}</div>
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

// ── Badge helpers ─────────────────────────────────────────────────────────────
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
  const a = allAppointments.find(x => Number(x.appointment_id) === Number(id));
  if (!a) return;

  const modeLocation = a.mode === 'Online'
    ? 'Online Video Consultation'
    : 'Physical Meeting — Colombo District Court Chambers';

  document.getElementById('viewApptBody').innerHTML = `
    <div class="detail-row"><span class="detail-row__label">Lawyer</span><strong class="detail-row__value">${LC.escapeHtml(a.lawyer_name)}</strong></div>
    <div class="detail-row"><span class="detail-row__label">Date &amp; Time</span><span class="detail-row__value">${a.appointment_date} at ${LC.formatTime(a.start_time)} – ${LC.formatTime(a.end_time)}</span></div>
    <div class="detail-row"><span class="detail-row__label">Mode</span><span class="detail-row__value">${modeBadge(a.mode)}</span></div>
    <div class="detail-row"><span class="detail-row__label">Location</span><span class="detail-row__value">${LC.escapeHtml(modeLocation)}</span></div>
    <div class="detail-row"><span class="detail-row__label">Package</span><span class="detail-row__value">${LC.escapeHtml(a.package_name || '—')}</span></div>
    <div class="detail-row"><span class="detail-row__label">Fee</span><span class="detail-row__value">LKR ${a.package_fee ? Number(a.package_fee).toLocaleString() : '—'}</span></div>
    <div class="detail-row"><span class="detail-row__label">Status</span><span class="detail-row__value">${statusBadge(a.status)}</span></div>`;

  let footer = `<button class="btn secondary" onclick="closeModal()">Close</button>`;
  if (a.status === 'Pending' || a.status === 'Confirmed') {
    footer = `<button class="btn danger" onclick="cancelAppt(${id});closeModal();">Cancel Appointment</button>` + footer;
  }
  document.getElementById('viewApptFooter').innerHTML = footer;
  document.getElementById('viewApptModal').classList.add('lc-appt-modal--open');
};

window.closeModal = function() {
  document.getElementById('viewApptModal').classList.remove('lc-appt-modal--open');
};

// ── Cancel ────────────────────────────────────────────────────────────────────
window.cancelAppt = function(id) {
  const a = allAppointments.find(x => Number(x.appointment_id) === Number(id));
  if (!a) return;

  LC.openConfirmModal(
    `Cancel your appointment on ${a.appointment_date} at ${LC.formatTime(a.start_time)}? The slot will be released.`,
    'Cancel Appointment',
    'danger'
  ).then(async confirmed => {
    if (!confirmed) return;
    try {
      await window.appointmentsApi.delete(id);
      allAppointments = allAppointments.map(x =>
        Number(x.appointment_id) === Number(id) ? { ...x, status: 'Cancelled' } : x
      );
      renderAll();
      LC.showToast('Appointment cancelled. Lawyer has been notified.', 'success');
    } catch (err) {
      LC.showToast('Cancel failed: ' + err.message, 'error');
    }
  });
};
