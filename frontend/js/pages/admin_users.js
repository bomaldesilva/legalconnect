/**
 * LegalConnect — Admin Users Page
 * Displays seeded demo user data from the users table.
 * Full auth-based management activates in Module 4.
 */
'use strict';

// ── DEMO DATA (reflects actual DB seeded users) ───────────────────────────────
// Replace with API call to /api/admin/users when Module 4 is implemented
const DEMO_USERS = [
  {
    user_id: 1,
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@legalconnect.lk',
    role: 'Admin',
    status: 'Active',
    created_at: '2026-07-30'
  },
  {
    user_id: 2,
    first_name: 'Demo',
    last_name: 'Lawyer',
    email: 'demo.lawyer@legalconnect.lk',
    role: 'Lawyer',
    status: 'Active',
    created_at: '2026-07-30'
  },
  {
    user_id: 3,
    first_name: 'Demo',
    last_name: 'Client',
    email: 'demo.client@legalconnect.lk',
    role: 'Client',
    status: 'Active',
    created_at: '2026-07-30'
  },
  {
    user_id: 4,
    first_name: 'Demo',
    last_name: 'Assistant',
    email: 'assistant@legalconnect.lk',
    role: 'Assistant',
    status: 'Active',
    created_at: '2026-07-30'
  }
];

// ── DOM refs ──────────────────────────────────────────────────────────────────
const userRows   = document.getElementById('userRows');
const searchInput= document.getElementById('searchInput');
const resultsCount = document.getElementById('resultsCount');
const userCount  = document.getElementById('userCount');
const kpiLawyers = document.getElementById('kpiLawyers');
const kpiClients = document.getElementById('kpiClients');
const kpiAdmins  = document.getElementById('kpiAdmins');

let activeFilter = 'all';
let allUsers     = [...DEMO_USERS];

// ── Role badge ────────────────────────────────────────────────────────────────
function roleBadge(role) {
  const map = {
    Admin: 'role-badge--admin',
    Lawyer: 'role-badge--lawyer',
    Client: 'role-badge--client',
    Assistant: 'role-badge--assistant'
  };
  return `<span class="role-badge ${map[role] || ''}">${role}</span>`;
}

// ── Avatar initial ────────────────────────────────────────────────────────────
function avatarColor(role) {
  const map = {
    Admin: 'avatar--navy',
    Lawyer: 'avatar--teal',
    Client: 'avatar--slate',
    Assistant: 'avatar--navy'
  };
  return map[role] || 'avatar--slate';
}

// ── Render users ──────────────────────────────────────────────────────────────
function renderUsers(users) {
  if (users.length === 0) {
    userRows.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state" style="padding:40px 0;">
            <div class="empty-state__icon">👤</div>
            <p class="empty-state__title">No users found</p>
            <p>Try a different filter or search term.</p>
          </div>
        </td>
      </tr>`;
    if (resultsCount) resultsCount.textContent = '0 results';
    return;
  }

  if (resultsCount) resultsCount.textContent = `${users.length} result${users.length !== 1 ? 's' : ''}`;

  userRows.innerHTML = users.map((u, idx) => {
    const initials = (u.first_name[0] + u.last_name[0]).toUpperCase();
    const fullName = `${u.first_name} ${u.last_name}`;
    return `
      <tr>
        <td class="cell-num">${idx + 1}</td>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="avatar avatar--sm ${avatarColor(u.role)}">${initials}</div>
            <span style="font-weight:600;color:var(--navy);font-size:14px;">${LC.escapeHtml(fullName)}</span>
          </div>
        </td>
        <td style="font-size:13px;color:var(--muted);">${LC.escapeHtml(u.email)}</td>
        <td>${roleBadge(u.role)}</td>
        <td>${LC.badge(u.status)}</td>
        <td class="cell-muted" style="font-size:12px;">${u.created_at}</td>
        <td>
          <div class="table-actions">
            <button class="btn secondary" type="button" onclick="viewUser(${u.user_id})" style="height:32px;font-size:12px;padding:0 10px;">View</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// ── Filter logic ──────────────────────────────────────────────────────────────
function applyFilters() {
  const q = (searchInput?.value || '').toLowerCase();
  let filtered = allUsers;

  if (activeFilter !== 'all') {
    filtered = filtered.filter(u => u.role === activeFilter);
  }

  if (q) {
    filtered = filtered.filter(u =>
      `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(q)
    );
  }

  renderUsers(filtered);
}

// ── Filter chip events ────────────────────────────────────────────────────────
document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    activeFilter = chip.dataset.filter;
    applyFilters();
  });
});

searchInput?.addEventListener('input', applyFilters);

// ── View user modal ───────────────────────────────────────────────────────────
function viewUser(id) {
  const u = allUsers.find(x => x.user_id === id);
  if (!u) return;

  const fullName = `${u.first_name} ${u.last_name}`;
  const initials = (u.first_name[0] + u.last_name[0]).toUpperCase();

  document.getElementById('userModalTitle').textContent = fullName;
  document.getElementById('userModalContent').innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
      <div class="avatar avatar--lg ${avatarColor(u.role)}">${initials}</div>
      <div>
        <p style="font-size:18px;font-weight:800;color:var(--navy);">${LC.escapeHtml(fullName)}</p>
        <p style="font-size:13px;color:var(--muted);">${LC.escapeHtml(u.email)}</p>
        <div style="display:flex;gap:8px;margin-top:6px;">${roleBadge(u.role)} ${LC.badge(u.status)}</div>
      </div>
    </div>
    <div class="detail-row"><span class="detail-row__label">User ID</span><span class="detail-row__value">#${u.user_id}</span></div>
    <div class="detail-row"><span class="detail-row__label">Role</span><span class="detail-row__value">${roleBadge(u.role)}</span></div>
    <div class="detail-row"><span class="detail-row__label">Status</span><span class="detail-row__value">${LC.badge(u.status)}</span></div>
    <div class="detail-row"><span class="detail-row__label">Email</span><span class="detail-row__value">${LC.escapeHtml(u.email)}</span></div>
    <div class="detail-row"><span class="detail-row__label">Joined</span><span class="detail-row__value">${u.created_at}</span></div>
    <div class="inline-alert inline-alert--info" style="margin-top:16px;">
      <span class="inline-alert__icon">ℹ</span>
      <div>Full user management (edit, block, delete) will be available in Module 4.</div>
    </div>`;

  const overlay = document.getElementById('userModalOverlay');
  overlay.style.display = 'grid';
}

function closeUserModal() {
  document.getElementById('userModalOverlay').style.display = 'none';
}

// Close on overlay click
document.getElementById('userModalOverlay')?.addEventListener('click', e => {
  if (e.target === document.getElementById('userModalOverlay')) closeUserModal();
});

// Expose for HTML onclick
window.viewUser       = viewUser;
window.closeUserModal = closeUserModal;

// ── Sidebar toggle ────────────────────────────────────────────────────────────
document.getElementById('sidebarToggle')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('sidebar--open');
});

// ── Boot ──────────────────────────────────────────────────────────────────────
(function init() {
  // KPI
  if (kpiLawyers) kpiLawyers.textContent = allUsers.filter(u => u.role === 'Lawyer').length;
  if (kpiClients) kpiClients.textContent = allUsers.filter(u => u.role === 'Client').length;
  if (kpiAdmins)  kpiAdmins.textContent  = allUsers.filter(u => u.role === 'Admin').length;
  if (userCount)  userCount.textContent  = `${allUsers.length} users`;

  renderUsers(allUsers);
})();
