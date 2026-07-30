'use strict';

const form = document.getElementById('packageForm');
const rows = document.getElementById('packageRows');
const formTitle = document.getElementById('formTitle');
const packageId = document.getElementById('packageId');
const lawyerId = document.getElementById('lawyerId');
const packageName = document.getElementById('packageName');
const packageFee = document.getElementById('packageFee');
const durationMinutes = document.getElementById('durationMinutes');
const categoryId = document.getElementById('categoryId');
const packageStatus = document.getElementById('packageStatus');
const packageDescription = document.getElementById('packageDescription');
const saveButton = document.getElementById('saveButton');
const resetButton = document.getElementById('resetButton');
const packageCountBadge = document.getElementById('packageCount');

let packages = [];

function renderRows() {
  if (packageCountBadge) {
    const active = packages.filter((p) => p.status === 'Active').length;
    packageCountBadge.textContent = `${active} active`;
  }

  if (packages.length === 0) {
    rows.innerHTML = `<tr><td colspan="7"><div class="empty-state"><p>No packages found. Add one above.</p></div></td></tr>`;
    return;
  }

  rows.innerHTML = packages.map((pkg) => `
    <tr>
      <td class="cell-muted">#${LC.escapeHtml(pkg.package_id)}</td>
      <td class="cell-primary">${LC.escapeHtml(pkg.package_name)}</td>
      <td class="cell-muted">${pkg.category_name ? LC.escapeHtml(pkg.category_name) : '—'}</td>
      <td style="font-weight:600;">${Number(pkg.fee).toFixed(2)}</td>
      <td>${LC.escapeHtml(pkg.duration_minutes)} min</td>
      <td>${LC.badge(pkg.status)}</td>
      <td>
        <div class="table-actions">
          <button class="btn secondary" type="button" data-action="edit" data-id="${pkg.package_id}">Edit</button>
          <button class="btn danger" type="button" data-action="delete" data-id="${pkg.package_id}"
            ${pkg.status === 'Inactive' ? 'disabled' : ''}>Deactivate</button>
        </div>
      </td>
    </tr>`).join('');
}

async function loadCategories() {
  const categories = await window.legalCategories.list();
  categoryId.innerHTML = '<option value="">— Optional —</option>' + categories
    .filter((c) => c.status === 'Active')
    .map((c) => `<option value="${c.category_id}">${LC.escapeHtml(c.category_name)}</option>`)
    .join('');
}

async function loadPackages() {
  try {
    packages = await window.consultationPackages.list();
    renderRows();
  } catch (error) {
    rows.innerHTML = `<tr><td colspan="7"><div class="empty-state"><p>Unable to load packages.</p></div></td></tr>`;
    LC.showToast(error.message || 'Unable to load packages.', 'error');
  }
}

function resetForm() {
  form.reset();
  packageId.value = '';
  lawyerId.value = '2';
  durationMinutes.value = '30';
  packageStatus.value = 'Active';
  formTitle.textContent = 'Add New Package';
  saveButton.textContent = 'Save Package';
}

function fillForm(pkg) {
  packageId.value = pkg.package_id;
  lawyerId.value = pkg.lawyer_id;
  packageName.value = pkg.package_name;
  packageFee.value = pkg.fee;
  durationMinutes.value = pkg.duration_minutes;
  categoryId.value = pkg.category_id || '';
  packageStatus.value = pkg.status;
  packageDescription.value = pkg.description || '';
  formTitle.textContent = 'Edit Package';
  saveButton.textContent = 'Update Package';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    lawyer_id: Number(lawyerId.value || 2),
    package_name: packageName.value.trim(),
    fee: Number(packageFee.value),
    duration_minutes: Number(durationMinutes.value),
    category_id: categoryId.value || null,
    description: packageDescription.value,
    status: packageStatus.value,
  };

  if (!payload.package_name || Number.isNaN(payload.fee) || !payload.duration_minutes) {
    LC.showToast('Package name, fee, and duration are required.', 'error');
    return;
  }

  saveButton.disabled = true;
  try {
    if (packageId.value) {
      await window.consultationPackages.update(packageId.value, payload);
      LC.showToast('Consultation package updated successfully.');
    } else {
      await window.consultationPackages.create(payload);
      LC.showToast('Consultation package created successfully.');
    }
    resetForm();
    await loadPackages();
  } catch (error) {
    const details = Object.values(error.errors || {}).join(' ');
    LC.showToast(details || error.message || 'Unable to save package.', 'error');
  } finally {
    saveButton.disabled = false;
  }
});

resetButton.addEventListener('click', resetForm);

rows.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button || button.disabled) return;
  const id = Number(button.dataset.id);
  const pkg = packages.find((p) => Number(p.package_id) === id);

  if (button.dataset.action === 'edit' && pkg) {
    fillForm(pkg);
    return;
  }

  if (button.dataset.action === 'delete') {
    const confirmed = await LC.openConfirmModal(
      `Deactivate package “${pkg?.package_name || id}”?`,
      'Deactivate Package',
      'danger'
    );
    if (!confirmed) return;
    try {
      await window.consultationPackages.delete(id);
      LC.showToast('Consultation package deactivated.');
      await loadPackages();
    } catch (error) {
      LC.showToast(error.message || 'Unable to deactivate package.', 'error');
    }
  }
});

(async function boot() {
  try {
    await loadCategories();
  } catch (error) {
    LC.showToast(error.message || 'Unable to load categories.', 'error');
  }
  await loadPackages();
})();
