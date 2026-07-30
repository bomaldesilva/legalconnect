/**
 * LegalConnect — Admin: Legal Categories Page
 *
 * Handles full CRUD for legal categories.
 * Features: search, status filters, KPI cards, loading skeletons,
 * collapsible form panel, row animations, confirmation modals.
 *
 * Utility helpers (escapeHtml, badge, formatDateTime, showToast,
 * openConfirmModal) come from utils.js via the window.LC namespace.
 */

'use strict';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const form                = document.getElementById('categoryForm');
const rows                = document.getElementById('categoryRows');
const formTitle           = document.getElementById('formTitle');
const categoryId          = document.getElementById('categoryId');
const categoryName        = document.getElementById('categoryName');
const categoryDescription = document.getElementById('categoryDescription');
const categoryStatus      = document.getElementById('categoryStatus');
const saveButton          = document.getElementById('saveButton');
const resetButton         = document.getElementById('resetButton');
const categoryCountBadge  = document.getElementById('categoryCount');
const searchInput         = document.getElementById('searchInput');
const resultsCountEl      = document.getElementById('resultsCount');
const addNewBtn           = document.getElementById('addNewBtn');

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
let categories   = [];
let searchQuery  = '';
let activeFilter = 'all';

// ── KPI card update ───────────────────────────────────────────────────────────
function updateKPIs() {
  const total    = categories.length;
  const active   = categories.filter(c => c.status === 'Active').length;
  const inactive = total - active;

  animateCounter(kpiTotal, total);
  animateCounter(kpiActive, active);
  animateCounter(kpiInactive, inactive);
}

/**
 * Smoothly animates a number counter from current displayed value to target.
 */
function animateCounter(el, target) {
  if (!el) return;
  const current = parseInt(el.textContent, 10) || 0;
  if (current === target) { el.textContent = target; return; }

  const duration = 400;
  const start    = performance.now();

  function step(now) {
    const p    = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
    el.textContent = Math.round(current + (target - current) * ease);
    if (p < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// ── Filtering & searching ─────────────────────────────────────────────────────
function getFilteredCategories() {
  return categories.filter(cat => {
    // Status filter
    if (activeFilter !== 'all' && cat.status !== activeFilter) return false;

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = (cat.category_name || '').toLowerCase().includes(q);
      const descMatch = (cat.description || '').toLowerCase().includes(q);
      if (!nameMatch && !descMatch) return false;
    }

    return true;
  });
}

function updateResultsCount(filtered) {
  if (!resultsCountEl) return;
  if (searchQuery || activeFilter !== 'all') {
    resultsCountEl.textContent = `${filtered.length} of ${categories.length} shown`;
  } else {
    resultsCountEl.textContent = `${filtered.length} categories`;
  }
}

// ── Table rendering ───────────────────────────────────────────────────────────
function renderRows() {
  // Update count badge
  if (categoryCountBadge) {
    const active = categories.filter(c => c.status === 'Active').length;
    categoryCountBadge.textContent = `${active} active`;
  }

  // Update KPIs
  updateKPIs();

  // Get filtered data
  const filtered = getFilteredCategories();
  updateResultsCount(filtered);

  // Empty state
  if (filtered.length === 0) {
    const isFiltered = searchQuery || activeFilter !== 'all';
    rows.innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <div class="empty-state__icon">${isFiltered ? '⌕' : '⊟'}</div>
          <p class="empty-state__title">${isFiltered ? 'No matching categories' : 'No legal categories yet'}</p>
          <p>${isFiltered
            ? 'Try adjusting your search or filter criteria.'
            : 'Get started by adding your first legal category.'}</p>
          ${!isFiltered ? '<div class="empty-state__action"><button class="btn primary" type="button" onclick="document.getElementById(\'addNewBtn\').click()">+ Add Category</button></div>' : ''}
        </div>
      </td></tr>`;
    return;
  }

  rows.innerHTML = filtered.map((cat, idx) => `
    <tr style="animation-delay:${idx * 40}ms">
      <td class="cell-num">${idx + 1}</td>
      <td class="cell-primary">${LC.escapeHtml(cat.category_name)}</td>
      <td><span class="cell-desc" title="${LC.escapeHtml(cat.description || '')}">${cat.description ? LC.escapeHtml(cat.description) : '<span class="muted">—</span>'}</span></td>
      <td>${LC.badge(cat.status)}</td>
      <td class="cell-muted" style="font-size:13px;">${LC.formatDateTime(cat.updated_at)}</td>
      <td>
        <div class="table-actions">
          <button class="btn secondary icon-btn" type="button" title="Edit"
            data-action="edit" data-id="${cat.category_id}">✎</button>
          <button class="btn danger icon-btn" type="button" title="Deactivate"
            data-action="delete" data-id="${cat.category_id}"
            ${cat.status === 'Inactive' ? 'disabled title="Already inactive"' : ''}>✕</button>
        </div>
      </td>
    </tr>`).join('');
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function showLoadingSkeleton() {
  const skeletonCount = 5;
  rows.innerHTML = Array.from({ length: skeletonCount }, () => `
    <tr class="skeleton-row">
      <td><div class="skeleton-bar w-20"></div></td>
      <td><div class="skeleton-bar w-60"></div></td>
      <td><div class="skeleton-bar w-80"></div></td>
      <td><div class="skeleton-bar badge-size"></div></td>
      <td><div class="skeleton-bar w-40"></div></td>
      <td><div class="skeleton-bar btn-size"></div></td>
    </tr>`).join('');
}

// ── Data loading ──────────────────────────────────────────────────────────────
async function loadCategories() {
  showLoadingSkeleton();

  try {
    categories = await window.legalCategories.list();
    renderRows();
  } catch (error) {
    rows.innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <div class="empty-state__icon">⚠</div>
          <p class="empty-state__title">Connection Error</p>
          <p>Unable to load categories. Check that XAMPP is running.</p>
          <div class="empty-state__action">
            <button class="btn secondary" type="button" onclick="loadCategories()">Retry</button>
          </div>
        </div>
      </td></tr>`;
    LC.showToast(error.message || 'Unable to load categories.', 'error');
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

// ── "Add Category" button ─────────────────────────────────────────────────────
addNewBtn.addEventListener('click', () => {
  resetForm();
  expandFormPanel();
  formPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // Small delay to allow panel to expand before focusing
  setTimeout(() => categoryName.focus(), 280);
});

// ── Form helpers ──────────────────────────────────────────────────────────────
function resetForm() {
  form.reset();
  categoryId.value      = '';
  categoryStatus.value  = 'Active';
  formTitle.textContent = 'Add New Category';
  saveButton.textContent = 'Save Category';
  // Remove any validation error styles
  form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

function fillForm(cat) {
  categoryId.value          = cat.category_id;
  categoryName.value        = cat.category_name;
  categoryDescription.value = cat.description || '';
  categoryStatus.value      = cat.status;
  formTitle.textContent     = `Edit: ${cat.category_name}`;
  saveButton.textContent    = 'Update Category';

  // Expand and scroll
  expandFormPanel();
  formPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => categoryName.focus(), 280);
}

function payloadFromForm() {
  return {
    category_name: categoryName.value.trim(),
    description:   categoryDescription.value.trim(),
    status:        categoryStatus.value,
  };
}

// ── Form submit — create or update ───────────────────────────────────────────
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = payloadFromForm();

  // Client-side validation
  if (!payload.category_name) {
    LC.showToast('Category name is required.', 'error');
    categoryName.classList.add('is-invalid');
    categoryName.focus();
    return;
  }
  categoryName.classList.remove('is-invalid');

  saveButton.disabled    = true;
  saveButton.textContent = categoryId.value ? 'Updating…' : 'Saving…';

  try {
    if (categoryId.value) {
      await window.legalCategories.update(categoryId.value, payload);
      LC.showToast('Legal category updated successfully.');
    } else {
      await window.legalCategories.create(payload);
      LC.showToast('Legal category created successfully.');
    }

    resetForm();
    collapseFormPanel();
    await loadCategories();
  } catch (error) {
    const details = Object.values(error.errors || {}).join(' ');
    LC.showToast(details || error.message || 'Unable to save category.', 'error');
  } finally {
    saveButton.disabled    = false;
    saveButton.textContent = categoryId.value ? 'Update Category' : 'Save Category';
  }
});

// ── Clear / reset ─────────────────────────────────────────────────────────────
resetButton.addEventListener('click', () => {
  resetForm();
  collapseFormPanel();
});

// ── Table row actions (event delegation) ─────────────────────────────────────
rows.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button || button.disabled) return;

  const id       = Number(button.dataset.id);
  const category = categories.find((c) => Number(c.category_id) === id);

  // ── Edit
  if (button.dataset.action === 'edit' && category) {
    fillForm(category);
    return;
  }

  // ── Deactivate (soft delete)
  if (button.dataset.action === 'delete') {
    const confirmed = await LC.openConfirmModal(
      `Deactivate "${category?.category_name || 'this category'}"? It will be marked as Inactive and hidden from active lists.`,
      'Deactivate',
      'danger'
    );

    if (!confirmed) return;

    button.disabled = true;

    try {
      await window.legalCategories.delete(id);
      LC.showToast('Legal category deactivated.');
      await loadCategories();
    } catch (error) {
      LC.showToast(error.message || 'Unable to deactivate category.', 'error');
      button.disabled = false;
    }
  }
});

// ── Search input ──────────────────────────────────────────────────────────────
let searchTimeout = null;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchQuery = searchInput.value.trim();
    renderRows();
  }, 200); // debounce 200ms
});

// ── Filter chips ──────────────────────────────────────────────────────────────
filterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    // Update visual state
    filterChips.forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');

    // Update filter
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
loadCategories();
