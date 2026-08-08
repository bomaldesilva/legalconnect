/**
 * LegalConnect — Lawyer Profile Page (Module 4)
 *
 * Fully wired to the real backend API. Replaces the demo-only skeleton.
 *
 * Features:
 *  - Loads profile from GET /api/lawyer-profile/{id}
 *  - Saves changes via PUT /api/lawyer-profile/{id}
 *  - Manages legal categories via /api/lawyer-profile/{id}/categories
 *  - Displays availability summary and package summary (read-only)
 *  - Renders verification stepper based on verification_status
 *  - Calculates and displays profile completeness
 *  - Full loading / error / empty states
 *  - Toast notifications via LC.showToast
 *
 * Utility helpers (escapeHtml, badge, formatDateTime, showToast, openConfirmModal)
 * are provided by utils.js via window.LC.
 */

'use strict';

let LAWYER_ID = null;

// ── State ─────────────────────────────────────────────────────────────────────
let profile       = null;   // Full profile object from API
let allCategories = [];     // All active legal categories (for dropdown + chips)
let myCategories  = [];     // Currently assigned categories

// ── DOM refs ──────────────────────────────────────────────────────────────────
const loadingState   = document.getElementById('loadingState');
const errorState     = document.getElementById('errorState');
const profileContent = document.getElementById('profileContent');
const errorMsg       = document.getElementById('errorMsg');

const heroAvatar     = document.getElementById('heroAvatar');
const heroName       = document.getElementById('heroName');
const heroSub        = document.getElementById('heroSub');
const heroTags       = document.getElementById('heroTags');
const heroVerifBadge = document.getElementById('heroVerifBadge');
const topbarAvatar   = document.getElementById('topbarAvatar');
const topbarSubtitle = document.getElementById('topbarSubtitle');

const completenessPct     = document.getElementById('completenessPct');
const completenessBar     = document.getElementById('completenessBar');
const completenessMissing = document.getElementById('completenessMissing');

// Form fields
const profileForm     = document.getElementById('profileForm');
const firstNameEl     = document.getElementById('firstName');
const lastNameEl      = document.getElementById('lastName');
const emailEl         = document.getElementById('email');
const barRegEl        = document.getElementById('barRegistrationNo');
const supremeCourtEl  = document.getElementById('supremeCourtNo');
const experienceEl    = document.getElementById('experienceYears');
const courtEl         = document.getElementById('court');
const bioEl           = document.getElementById('bio');
const educationEl     = document.getElementById('education');
const bioCharCount    = document.getElementById('bioCharCount');
const eduCharCount    = document.getElementById('eduCharCount');
const saveFormBtn     = document.getElementById('saveFormBtn');
const resetFormBtn    = document.getElementById('resetFormBtn');

// Hero save/reset
const saveBtn  = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');

// Credentials panel
const credStatus     = document.getElementById('credStatus');
const credBar        = document.getElementById('credBar');
const credSC         = document.getElementById('credSC');
const credExperience = document.getElementById('credExperience');
const credRating     = document.getElementById('credRating');
const credMemberSince = document.getElementById('credMemberSince');

// Availability summary
const availTotal     = document.getElementById('availTotal');
const availAvailable = document.getElementById('availAvailable');
const availNext      = document.getElementById('availNext');

// Package summary
const pkgTotal  = document.getElementById('pkgTotal');
const pkgActive = document.getElementById('pkgActive');
const pkgList   = document.getElementById('pkgList');

// Verification stepper
const verificationStepper = document.getElementById('verificationStepper');

// Legal expertise
const specialtyChips = document.getElementById('specialtyChips');
const categorySelect = document.getElementById('categorySelect');
const categoryChips  = document.getElementById('categoryChips');
const addCategoryBtn = document.getElementById('addCategoryBtn');

// ── Boot / Data loading ───────────────────────────────────────────────────────

async function boot() {
  showLoading();

  try {
    const user = await window.authApi.me();
    LAWYER_ID = user.user_id;
    profile = await window.lawyerProfileApi.get(LAWYER_ID);
    myCategories = profile.categories || [];
    renderAll();
    await loadAllCategories();
    showContent();
  } catch (error) {
    showError(error.message || 'Unable to load profile. Is the XAMPP server running?');
  }
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function renderAll() {
  renderHero();
  renderForm();
  renderCompleteness();
  renderCredentials();
  renderVerificationStepper();
  renderAvailabilitySummary();
  renderPackageSummary();
  renderSpecialtyChips();
}

/** Renders the hero card at the top of the page. */
function renderHero() {
  const initials = getInitials(profile.first_name, profile.last_name);
  const fullName  = `${LC.escapeHtml(profile.first_name)} ${LC.escapeHtml(profile.last_name)}`;
  const verifStatus = profile.verification_status || null;

  heroAvatar.textContent     = initials;
  topbarAvatar.textContent   = initials;
  topbarAvatar.title         = fullName;
  heroName.textContent       = `${profile.first_name} ${profile.last_name}`;
  topbarSubtitle.textContent = `${profile.email} — LegalConnect Lawyer Portal`;

  // Sub line
  const parts = [profile.email];
  if (profile.bar_registration_no) parts.push(profile.bar_registration_no);
  parts.push(profile.lawyer_status || profile.user_status || 'Active');
  heroSub.textContent = parts.join(' · ');

  // Tags (categories)
  heroTags.innerHTML = myCategories.length
    ? myCategories.map(c => `<span class="hero-tag">${LC.escapeHtml(c.category_name)}</span>`).join('')
    : '<span class="hero-tag" style="opacity:.5">No specializations</span>';

  // Verification badge
  heroVerifBadge.textContent = verifBadgeText(verifStatus);
  heroVerifBadge.className   = `verif-badge ${verifBadgeClass(verifStatus)}`;
}

/** Populates all form input fields from the loaded profile. */
function renderForm() {
  firstNameEl.value    = profile.first_name || '';
  lastNameEl.value     = profile.last_name  || '';
  emailEl.value        = profile.email      || '';
  barRegEl.value       = profile.bar_registration_no || '';
  supremeCourtEl.value = profile.supreme_court_no    || '';
  experienceEl.value   = profile.experience_years !== null ? profile.experience_years : '';
  courtEl.value        = profile.court               || '';
  bioEl.value          = profile.bio                 || '';
  educationEl.value    = profile.education           || '';

  updateCharCount();
}

/** Updates the profile completeness bar and missing fields message. */
function renderCompleteness() {
  const fields = [
    { weight: 15, filled: !!(profile.first_name && profile.last_name),    label: 'Name' },
    { weight: 20, filled: !!(profile.bio && profile.bio.trim().length > 10), label: 'Biography' },
    { weight: 10, filled: profile.experience_years !== null && profile.experience_years !== undefined, label: 'Experience years' },
    { weight: 15, filled: !!(profile.education && profile.education.trim().length > 5), label: 'Education' },
    { weight: 10, filled: !!(profile.court && profile.court.trim()),       label: 'Court/Jurisdiction' },
    { weight: 10, filled: !!(profile.bar_registration_no && profile.bar_registration_no.trim()), label: 'Bar registration' },
    { weight: 20, filled: myCategories.length > 0,                        label: 'At least one legal specialty' },
  ];

  let score = 0;
  const missing = [];

  fields.forEach(f => {
    if (f.filled) {
      score += f.weight;
    } else {
      missing.push(f.label);
    }
  });

  completenessPct.textContent  = `${score}%`;
  completenessBar.style.width  = `${score}%`;

  if (missing.length > 0) {
    completenessMissing.textContent = `To complete: ${missing.join(', ')}.`;
  } else {
    completenessMissing.textContent = '✓ Profile is complete!';
  }
}

/** Renders the read-only professional credentials panel. */
function renderCredentials() {
  // Account status
  credStatus.innerHTML = LC.badge(profile.lawyer_status || profile.user_status || 'Unknown');

  // Bar registration
  credBar.innerHTML = profile.bar_registration_no
    ? `${LC.escapeHtml(profile.bar_registration_no)}`
    : '<span style="color:var(--muted);font-style:italic;font-size:13px;">Not submitted</span>';

  // Supreme Court no.
  credSC.innerHTML = profile.supreme_court_no
    ? LC.escapeHtml(profile.supreme_court_no)
    : '<span style="color:var(--muted);font-style:italic;font-size:13px;">Not submitted</span>';

  // Experience
  credExperience.textContent = profile.experience_years !== null && profile.experience_years !== undefined
    ? `${profile.experience_years} year${profile.experience_years !== 1 ? 's' : ''}`
    : '—';

  // Rating
  const r = parseFloat(profile.rating) || 0;
  credRating.innerHTML = r > 0
    ? `${renderStars(r)} <span class="stars-rating__value">${r.toFixed(1)}</span>`
    : '<span style="color:var(--muted);font-size:13px;">No reviews yet</span>';

  // Member since
  credMemberSince.textContent = profile.member_since
    ? profile.member_since.split(' ')[0]
    : '—';
}

/** Renders the verification stepper based on verification_status. */
function renderVerificationStepper() {
  const status = (profile.verification_status || 'none').toLowerCase();

  const steps = [
    {
      title: 'Account Created',
      desc: `${profile.first_name} ${profile.last_name} registered successfully`,
      state: 'done',
    },
    {
      title: 'Bar Registration Submitted',
      desc: profile.bar_registration_no
        ? `BASL No. ${profile.bar_registration_no}`
        : 'Not yet submitted — update your profile to add this.',
      state: profile.bar_registration_no ? 'done' : 'active',
    },
    {
      title: 'Admin Review',
      desc: status === 'approved'
        ? 'Credentials approved by admin'
        : status === 'rejected'
          ? `Rejected${profile.verification_remarks ? ': ' + profile.verification_remarks : ''}`
          : 'Pending admin verification of credentials.',
      state: status === 'approved' ? 'done'
           : status === 'rejected' ? 'rejected'
           : 'active',
    },
    {
      title: 'Verified & Activated',
      desc: status === 'approved'
        ? 'Available for client bookings'
        : 'Awaiting verification approval.',
      state: status === 'approved' ? 'done' : '',
    },
  ];

  verificationStepper.innerHTML = steps.map((step, i) => {
    const isLast = i === steps.length - 1;
    const numHtml = step.state === 'done' ? '✓'
                  : step.state === 'rejected' ? '✕'
                  : (i + 1);
    return `
      <div class="stepper-step ${step.state}">
        <div class="stepper-step__track">
          <div class="stepper-step__num">${numHtml}</div>
          ${!isLast ? '<div class="stepper-step__connector"></div>' : ''}
        </div>
        <div class="stepper-step__content">
          <p class="stepper-step__title">${LC.escapeHtml(step.title)}</p>
          <p class="stepper-step__desc">${LC.escapeHtml(step.desc)}</p>
        </div>
      </div>`;
  }).join('');
}

/** Renders the availability summary panel. */
function renderAvailabilitySummary() {
  const avail = profile.availability_summary || {};
  availTotal.textContent     = avail.total_slots     ?? '0';
  availAvailable.textContent = avail.available_slots ?? '0';
  availNext.textContent      = avail.next_available_date
    ? avail.next_available_date
    : '—';
}

/** Renders the consultation package summary panel. */
function renderPackageSummary() {
  const summary = profile.package_summary || {};
  const s       = summary.summary || {};
  const packages = summary.packages || [];

  pkgTotal.textContent  = s.total_packages ?? '0';
  pkgActive.textContent = s.active_packages ?? '0';

  if (packages.length === 0) {
    pkgList.innerHTML = `
      <p style="font-size:13px;color:var(--muted);text-align:center;padding:12px 0;">
        No packages created yet.
      </p>`;
    return;
  }

  pkgList.innerHTML = packages.map(pkg => `
    <div class="summary-item">
      <div>
        <div class="summary-item__name">${LC.escapeHtml(pkg.package_name)}</div>
        <div class="summary-item__meta">${pkg.duration_minutes} mins · ${LC.badge(pkg.status)}</div>
      </div>
      <div class="summary-item__right">
        <div class="summary-item__value">LKR ${Number(pkg.fee).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      </div>
    </div>`).join('');
}

/** Renders the specialty chips in the expertise section. */
function renderSpecialtyChips() {
  if (myCategories.length === 0) {
    specialtyChips.innerHTML = `
      <p style="font-size:13px;color:var(--muted);padding:6px 0;">
        No legal specializations added yet. Add from the list below.
      </p>`;
  } else {
    specialtyChips.innerHTML = myCategories.map(cat => `
      <span class="specialty-tag">
        ${LC.escapeHtml(cat.category_name)}
        <button class="specialty-tag__remove" type="button"
          data-cat-id="${cat.category_id}" title="Remove">✕</button>
      </span>`).join('');

    specialtyChips.querySelectorAll('.specialty-tag__remove').forEach(btn => {
      btn.addEventListener('click', () => removeCategory(Number(btn.dataset.catId)));
    });
  }

  // Also update quick-chip "already added" state
  updateCategoryChipStates();

  // Update hero tags and completeness
  if (profile) {
    heroTags.innerHTML = myCategories.length
      ? myCategories.map(c => `<span class="hero-tag">${LC.escapeHtml(c.category_name)}</span>`).join('')
      : '<span class="hero-tag" style="opacity:.5">No specializations</span>';
    renderCompleteness();
  }
}

// ── Category management ───────────────────────────────────────────────────────

/** Loads all active legal categories and populates the dropdown + quick chips. */
async function loadAllCategories() {
  try {
    const cats = await window.legalCategories.list();
    allCategories = cats.filter(c => c.status === 'Active');

    // Dropdown
    categorySelect.innerHTML = '<option value="">Select a category…</option>' +
      allCategories.map(c =>
        `<option value="${c.category_id}">${LC.escapeHtml(c.category_name)}</option>`
      ).join('');

    // Quick-add chips
    categoryChips.innerHTML = allCategories.map(c => `
      <button type="button" class="category-quick-chip" data-cat-id="${c.category_id}">
        ${LC.escapeHtml(c.category_name)}
      </button>`).join('');

    categoryChips.querySelectorAll('.category-quick-chip').forEach(btn => {
      btn.addEventListener('click', () => addCategoryById(Number(btn.dataset.catId)));
    });

    updateCategoryChipStates();
  } catch {
    categorySelect.innerHTML = '<option>Could not load categories</option>';
  }
}

/** Marks already-assigned quick chips as disabled. */
function updateCategoryChipStates() {
  const assignedIds = new Set(myCategories.map(c => c.category_id));
  categoryChips.querySelectorAll('.category-quick-chip').forEach(btn => {
    const id = Number(btn.dataset.catId);
    btn.classList.toggle('already-added', assignedIds.has(id));
    btn.disabled = assignedIds.has(id);
  });
}

/** Adds a category by ID (used by both quick chips and the dropdown). */
async function addCategoryById(categoryId) {
  if (!categoryId) return;

  // Optimistic check
  if (myCategories.some(c => c.category_id === categoryId)) {
    LC.showToast('This category is already in your profile.', 'error');
    return;
  }

  try {
    addCategoryBtn.disabled = true;
    const updated = await window.lawyerProfileApi.addCategory(LAWYER_ID, { category_id: categoryId });
    myCategories = updated;
    renderSpecialtyChips();
    LC.showToast('Legal specialty added to your profile.', 'success');
  } catch (error) {
    const details = Object.values(error.errors || {}).join(' ');
    LC.showToast(details || error.message || 'Unable to add category.', 'error');
  } finally {
    addCategoryBtn.disabled = false;
    categorySelect.value    = '';
  }
}

/** Removes a category by ID. */
async function removeCategory(categoryId) {
  const confirmed = await LC.openConfirmModal(
    'Remove this legal specialty from your profile?',
    'Remove',
    'danger'
  );
  if (!confirmed) return;

  try {
    const updated = await window.lawyerProfileApi.removeCategory(LAWYER_ID, categoryId);
    myCategories  = updated;
    renderSpecialtyChips();
    LC.showToast('Legal specialty removed.', 'success');
  } catch (error) {
    LC.showToast(error.message || 'Unable to remove category.', 'error');
  }
}

// Category dropdown "Add" button
addCategoryBtn.addEventListener('click', () => {
  addCategoryById(Number(categorySelect.value));
});

// ── Form save ─────────────────────────────────────────────────────────────────

async function saveProfile() {
  const data = buildPayload();

  // Client-side validation
  const clientErrors = validateClientSide(data);
  if (clientErrors.length > 0) {
    clearInvalidStates();
    clientErrors.forEach(e => {
      const el = document.getElementById(e.id);
      if (el) el.classList.add('is-invalid');
    });
    LC.showToast(clientErrors[0].message, 'error');
    document.getElementById(clientErrors[0].id)?.focus();
    return;
  }

  setSaving(true);

  try {
    clearInvalidStates();
    profile = await window.lawyerProfileApi.update(LAWYER_ID, data);
    myCategories = profile.categories || [];
    renderAll();
    LC.showToast('Profile updated successfully!', 'success');
  } catch (error) {
    // Mark server-validated fields
    const errors = error.errors || {};
    const fieldMap = {
      first_name:           'firstName',
      last_name:            'lastName',
      bio:                  'bio',
      experience_years:     'experienceYears',
      education:            'education',
      court:                'court',
      bar_registration_no:  'barRegistrationNo',
      supreme_court_no:     'supremeCourtNo',
    };

    Object.entries(errors).forEach(([field, msg]) => {
      const elId = fieldMap[field];
      if (elId) {
        const el = document.getElementById(elId);
        if (el) el.classList.add('is-invalid');
      }
    });

    const details = Object.values(errors).join(' ');
    LC.showToast(details || error.message || 'Unable to save profile.', 'error');
  } finally {
    setSaving(false);
  }
}

function buildPayload() {
  return {
    first_name:          firstNameEl.value.trim(),
    last_name:           lastNameEl.value.trim(),
    bio:                 bioEl.value.trim(),
    experience_years:    experienceEl.value !== '' ? Number(experienceEl.value) : null,
    education:           educationEl.value.trim(),
    court:               courtEl.value.trim(),
    bar_registration_no: barRegEl.value.trim(),
    supreme_court_no:    supremeCourtEl.value.trim(),
  };
}

function validateClientSide(data) {
  const errors = [];
  if (!data.first_name) errors.push({ id: 'firstName', message: 'First name is required.' });
  if (!data.last_name)  errors.push({ id: 'lastName',  message: 'Last name is required.' });
  if (data.experience_years !== null && (data.experience_years < 0 || data.experience_years > 60)) {
    errors.push({ id: 'experienceYears', message: 'Experience must be between 0 and 60 years.' });
  }
  return errors;
}

function clearInvalidStates() {
  profileForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

function setSaving(isSaving) {
  saveFormBtn.disabled    = isSaving;
  saveBtn.disabled        = isSaving;
  saveFormBtn.textContent = isSaving ? 'Saving…' : 'Save Changes';
  saveBtn.textContent     = isSaving ? 'Saving…' : 'Save Changes';
}

// Form submit handler
profileForm.addEventListener('submit', (event) => {
  event.preventDefault();
  saveProfile();
});

// Hero save button (mirrors form submit)
saveBtn.addEventListener('click', saveProfile);

// Reset — reload data from server
async function doReset() {
  const confirmed = await LC.openConfirmModal(
    'Reset all unsaved changes?',
    'Reset',
    'danger'
  );
  if (!confirmed) return;
  clearInvalidStates();
  renderForm();
  LC.showToast('Changes discarded.', 'success');
}

resetBtn.addEventListener('click', doReset);
resetFormBtn.addEventListener('click', doReset);

// ── Character counters ────────────────────────────────────────────────────────

function updateCharCount() {
  bioCharCount.textContent = bioEl.value.length;
  eduCharCount.textContent = educationEl.value.length;
}

bioEl.addEventListener('input', updateCharCount);
educationEl.addEventListener('input', updateCharCount);

// ── UI state helpers ──────────────────────────────────────────────────────────

function showLoading() {
  loadingState.style.display   = '';
  errorState.style.display     = 'none';
  profileContent.style.display = 'none';
}

function showContent() {
  loadingState.style.display   = 'none';
  errorState.style.display     = 'none';
  profileContent.style.display = '';
}

function showError(message) {
  loadingState.style.display   = 'none';
  errorState.style.display     = '';
  profileContent.style.display = 'none';
  errorMsg.textContent         = message;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(first, last) {
  const f = (first || '').trim().charAt(0).toUpperCase();
  const l = (last  || '').trim().charAt(0).toUpperCase();
  return f + l || 'DL';
}

function verifBadgeText(status) {
  switch ((status || '').toLowerCase()) {
    case 'approved': return '✓ Verified';
    case 'rejected': return '✕ Rejected';
    case 'pending':  return '⏳ Pending Verification';
    default:         return '— Not Submitted';
  }
}

function verifBadgeClass(status) {
  switch ((status || '').toLowerCase()) {
    case 'approved': return 'verif-badge--approved';
    case 'rejected': return 'verif-badge--rejected';
    case 'pending':  return 'verif-badge--pending';
    default:         return 'verif-badge--unknown';
  }
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  return [
    ...Array(full).fill('<span class="stars-rating__star filled">★</span>'),
    ...Array(half).fill('<span class="stars-rating__star half">★</span>'),
    ...Array(empty).fill('<span class="stars-rating__star">★</span>'),
  ].join('');
}

// ── Sidebar toggle (mobile) ───────────────────────────────────────────────────
document.getElementById('sidebarToggle')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('sidebar--open');
});

// ── Boot ──────────────────────────────────────────────────────────────────────
boot();
