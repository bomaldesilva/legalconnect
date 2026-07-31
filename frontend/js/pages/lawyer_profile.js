/**
 * LegalConnect — Lawyer Profile JS
 * Manages specializations, loads categories from API, handles form interactions.
 */
'use strict';

// DEMO DATA — current specializations
let specialties = ['Family Law', 'Criminal Law', 'Property Law'];

// ── DOM refs ──────────────────────────────────────────────────────────────────
const heroTags       = document.getElementById('heroTags');
const specialtyChips = document.getElementById('specialtyChips');
const categorySelect = document.getElementById('categorySelect');
const categoryChips  = document.getElementById('categoryChips');
const addSpecialtyBtn= document.getElementById('addSpecialtyBtn');
const saveBtn        = document.getElementById('saveBtn');

// ── Render specializations ────────────────────────────────────────────────────
function renderSpecialties() {
  // Hero tags
  if (heroTags) {
    heroTags.innerHTML = specialties.map(s =>
      `<span class="tag">${LC.escapeHtml(s)}</span>`
    ).join('');
  }

  // Editable chips in panel
  if (specialtyChips) {
    if (specialties.length === 0) {
      specialtyChips.innerHTML = '<p style="font-size:13px;color:var(--muted);padding:8px 0;">No specializations added yet.</p>';
      return;
    }
    specialtyChips.innerHTML = specialties.map(s => `
      <span class="specialty-tag">
        ${LC.escapeHtml(s)}
        <button class="specialty-tag__remove" type="button" data-specialty="${LC.escapeHtml(s)}" title="Remove">✕</button>
      </span>`).join('');

    specialtyChips.querySelectorAll('.specialty-tag__remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.specialty;
        specialties = specialties.filter(s => s !== name);
        renderSpecialties();
      });
    });
  }
}

// ── Add specialty from select ─────────────────────────────────────────────────
function addSpecialty(name) {
  if (!name || specialties.includes(name)) return;
  specialties.push(name);
  renderSpecialties();
}

if (addSpecialtyBtn && categorySelect) {
  addSpecialtyBtn.addEventListener('click', () => {
    addSpecialty(categorySelect.value);
  });
}

// ── Load categories from API ──────────────────────────────────────────────────
async function loadCategories() {
  try {
    const cats = await window.legalCategories.list();
    const active = cats.filter(c => c.status === 'Active');

    if (categorySelect) {
      categorySelect.innerHTML = '<option value="">Select a category…</option>' +
        active.map(c => `<option value="${LC.escapeHtml(c.category_name)}">${LC.escapeHtml(c.category_name)}</option>`).join('');
    }

    if (categoryChips) {
      categoryChips.innerHTML = active.map(c => `
        <button type="button" class="tag tag--navy" style="cursor:pointer;border:none;" data-name="${LC.escapeHtml(c.category_name)}">${LC.escapeHtml(c.category_name)}</button>
      `).join('');

      categoryChips.querySelectorAll('.tag').forEach(btn => {
        btn.addEventListener('click', () => {
          addSpecialty(btn.dataset.name);
          LC.showToast(`Added: ${btn.dataset.name}`, 'success');
        });
      });
    }
  } catch {
    if (categorySelect) categorySelect.innerHTML = '<option>Could not load categories</option>';
  }
}

// ── Save changes ──────────────────────────────────────────────────────────────
if (saveBtn) {
  saveBtn.addEventListener('click', () => {
    LC.showToast('Profile update will be available in Module 4.', 'success');
  });
}

// ── Sidebar toggle ────────────────────────────────────────────────────────────
document.getElementById('sidebarToggle')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('sidebar--open');
});

// ── Boot ──────────────────────────────────────────────────────────────────────
renderSpecialties();
loadCategories();
