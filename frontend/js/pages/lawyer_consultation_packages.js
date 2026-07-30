/**
 * LegalConnect — Lawyer: Consultation Packages Page
 *
 * Handles full CRUD for consultation packages.
 * Features: category lookup populating, real-time search, status filters,
 * KPI cards, loading skeletons, collapsible form panel, modal confirmation.
 *
 * Utility helpers (escapeHtml, badge, formatDateTime, showToast,
 * openConfirmModal) come from utils.js via the window.LC namespace.
 */

'use strict';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const form               = document.getElementById('packageForm');
const rows               = document.getElementById('packageRows');
const formTitle          = document.getElementById('formTitle');
const packageId          = document.getElementById('packageId');
const lawyerId           = document.getElementById('lawyerId');
const categoryId         = document.getElementById('categoryId');
const packageName        = document.getElementById('packageName');
const packageFee         = document.getElementById('packageFee');
const durationMinutes    = document.getElementById('durationMinutes');
const packageDescription = document.getElementById('packageDescription');
const packageStatus      = document.getElementById('packageStatus');
const saveButton         = document.getElementById('saveButton');
const resetButton        = document.getElementById('resetButton');
const packageCountBadge  = document.getElementById('packageCount');
const searchInput        = document.getElementById('searchInput');
const resultsCountEl     = document.getElementById('resultsCount');
const addNewBtn          = document.getElementById('addNewBtn');

// KPI elements
const kpiTotal    = document.getElementById('kpiTotal');
const kpiActive   = document.getElementById('kpiActive');
const kpiInactive = document.getElementById('kpiInactive');

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
let packages     = [];
let categories   = [];
let searchQuery  = '';
let activeFilter = 'all';

// ── Category Dropdown Population ──────────────────────────────────────────────
async function loadCategoryOptions() {
  try {
    categories = await window.legalCategories.list();
    const activeCats = categories.filter(c => c.status === 'Active');

    categoryId.innerHTML = '<option value="">— Optional —</option>' +
      activeCats.map(c => `<option value="${c.category_id}">${LC.escapeHtml(c.category_name)}</option>`).join('');
  } catch (error) {
    console.warn('Unable to load categories for dropdown:', error);
  }
}

// ── KPI card update ───────────────────────────────────────────────────────────
function updateKPIs() {
  const total    = packages.length;
  const active   = packages.filter(p => p.status === 'Active').length;
  const inactive = total - active;

  animateCounter(kpiTotal, total);
  animateCounter(kpiActive, active);
  animateCounter(kpiInactive, inactive);
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
function getFilteredPackages() {
  return packages.filter(pkg => {
    // Status filter
    if (activeFilter !== 'all' && pkg.status !== activeFilter) return false;

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = (pkg.package_name || '').toLowerCase().includes(q);
      const catMatch  = (pkg.category_name || '').toLowerCase().includes(q);
      const descMatch = (pkg.description || '').toLowerCase().includes(q);
      if (!nameMatch && !catMatch && !descMatch) return false;
    }

    return true;
  });
}

function updateResultsCount(filtered) {
  if (!resultsCountEl) return;
  if (searchQuery || activeFilter !== 'all') {
    resultsCountEl.textContent = `${filtered.length} of ${packages.length} shown`;
  } else {
    resultsCountEl.textContent = `${filtered.length} packages`;
  }
}

// ── Table rendering ───────────────────────────────────────────────────────────
function renderRows() {
  if (packageCountBadge) {
    const active = packages.filter(p => p.status === 'Active').length;
    packageCountBadge.textContent = `${active} active`;
  }

  updateKPIs();

  const filtered = getFilteredPackages();
  updateResultsCount(filtered);

  if (filtered.length === 0) {
    const isFiltered = searchQuery || activeFilter !== 'all';
    rows.innerHTML = `
      <tr><td colspan="7">
        <div class="empty-state">
          <div class="empty-state__icon">${isFiltered ? '⌕' : '◈'}</div>
          <p class="empty-state__title">${isFiltered ? 'No matching packages' : 'No consultation packages yet'}</p>
          <p>${isFiltered
            ? 'Try adjusting your search or category filter.'
            : 'Add a new consultation package to specify pricing and duration.'}</p>
          ${!isFiltered ? '<div class="empty-state__action"><button class="btn primary" type="button" onclick="document.getElementById(\'addNewBtn\').click()">+ Add Package</button></div>' : ''}
        </div>
      </td></tr>`;
    return;
  }

  rows.innerHTML = filtered.map((pkg, idx) => `
    <tr style="animation-delay:${idx * 40}ms">
      <td class="cell-num">${idx + 1}</td>
      <td class="cell-primary">${LC.escapeHtml(pkg.package_name)}</td>
      <td class="cell-muted">${pkg.category_name ? LC.escapeHtml(pkg.category_name) : '<span class="muted">General</span>'}</td>
      <td style="font-weight:700; color:var(--navy);">LKR ${Number(pkg.fee).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      <td class="cell-muted">${LC.escapeHtml(pkg.duration_minutes)} mins</td>
      <td>${LC.badge(pkg.status)}</td>
      <td>
        <div class="table-actions">
          <button class="btn secondary icon-btn" type="button" title="Edit"
            data-action="edit" data-id="${pkg.package_id}">✎</button>
          <button class="btn danger icon-btn" type="button" title="Deactivate"
            data-action="delete" data-id="${pkg.package_id}"
            ${pkg.status === 'Inactive' ? 'disabled title="Already inactive"' : ''}>✕</button>
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
      <td><div class="skeleton-bar w-40"></div></td>
      <td><div class="skeleton-bar w-40"></div></td>
      <td><div class="skeleton-bar badge-size"></div></td>
      <td><div class="skeleton-bar btn-size"></div></td>
    </tr>`).join('');
}

// ── Data loading ──────────────────────────────────────────────────────────────
async function loadPackages() {
  showLoadingSkeleton();

  try {
    packages = await window.consultationPackages.list();
    renderRows();
  } catch (error) {
    rows.innerHTML = `
      <tr><td colspan="7">
        <div class="empty-state">
          <div class="empty-state__icon">⚠</div>
          <p class="empty-state__title">Connection Error</p>
          <p>Unable to load consultation packages.</p>
          <div class="empty-state__action">
            <button class="btn secondary" type="button" onclick="loadPackages()">Retry</button>
          </div>
        </div>
      </td></tr>`;
    LC.showToast(error.message || 'Unable to load packages.', 'error');
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

// ── "Add Package" button ──────────────────────────────────────────────────────
addNewBtn.addEventListener('click', () => {
  resetForm();
  expandFormPanel();
  formPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => packageName.focus(), 280);
});

// ── Form helpers ──────────────────────────────────────────────────────────────
function resetForm() {
  form.reset();
  packageId.value          = '';
  lawyerId.value           = '2';
  categoryId.value         = '';
  packageStatus.value      = 'Active';
  durationMinutes.value    = '30';
  formTitle.textContent    = 'Add New Package';
  saveButton.textContent   = 'Save Package';
  form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

function fillForm(pkg) {
  packageId.value          = pkg.package_id;
  lawyerId.value           = pkg.lawyer_id;
  categoryId.value         = pkg.category_id || '';
  packageName.value        = pkg.package_name;
  packageFee.value         = pkg.fee;
  durationMinutes.value    = pkg.duration_minutes;
  packageDescription.value = pkg.description || '';
  packageStatus.value      = pkg.status;
  formTitle.textContent    = `Edit: ${pkg.package_name}`;
  saveButton.textContent   = 'Update Package';

  expandFormPanel();
  formPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => packageName.focus(), 280);
}

function payloadFromForm() {
  return {
    lawyer_id:        Number(lawyerId.value),
    category_id:      categoryId.value ? Number(categoryId.value) : null,
    package_name:     packageName.value.trim(),
    fee:              Number(packageFee.value),
    duration_minutes: Number(durationMinutes.value),
    description:      packageDescription.value.trim(),
    status:           packageStatus.value,
  };
}

// ── Form submit — create or update ───────────────────────────────────────────
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = payloadFromForm();

  if (!payload.package_name) {
    LC.showToast('Package name is required.', 'error');
    packageName.classList.add('is-invalid');
    packageName.focus();
    return;
  }
  if (isNaN(payload.fee) || payload.fee < 0) {
    LC.showToast('Valid positive fee is required.', 'error');
    packageFee.classList.add('is-invalid');
    packageFee.focus();
    return;
  }
  if (isNaN(payload.duration_minutes) || payload.duration_minutes < 1) {
    LC.showToast('Valid duration is required.', 'error');
    durationMinutes.classList.add('is-invalid');
    durationMinutes.focus();
    return;
  }

  saveButton.disabled    = true;
  saveButton.textContent = packageId.value ? 'Updating…' : 'Saving…';

  try {
    if (packageId.value) {
      await window.consultationPackages.update(packageId.value, payload);
      LC.showToast('Consultation package updated successfully.');
    } else {
      await window.consultationPackages.create(payload);
      LC.showToast('Consultation package created successfully.');
    }

    resetForm();
    collapseFormPanel();
    await loadPackages();
  } catch (error) {
    const details = Object.values(error.errors || {}).join(' ');
    LC.showToast(details || error.message || 'Unable to save package.', 'error');
  } finally {
    saveButton.disabled    = false;
    saveButton.textContent = packageId.value ? 'Update Package' : 'Save Package';
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

  const id  = Number(button.dataset.id);
  const pkg = packages.find((p) => Number(p.package_id) === id);

  if (button.dataset.action === 'edit' && pkg) {
    fillForm(pkg);
    return;
  }

  if (button.dataset.action === 'delete') {
    const confirmed = await LC.openConfirmModal(
      `Deactivate "${pkg?.package_name || 'this package'}"? It will be marked as Inactive.`,
      'Deactivate',
      'danger'
    );

    if (!confirmed) return;

    button.disabled = true;

    try {
      await window.consultationPackages.delete(id);
      LC.showToast('Consultation package deactivated.');
      await loadPackages();
    } catch (error) {
      LC.showToast(error.message || 'Unable to deactivate package.', 'error');
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
loadCategoryOptions();
loadPackages();
