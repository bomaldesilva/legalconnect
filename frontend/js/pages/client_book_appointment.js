/**
 * LegalConnect — Client Appointment Booking Wizard JS
 * 4-Step Interactive Appointment Booking with API fetching, live summary, and validation.
 */
'use strict';

// ── State Management ──────────────────────────────────────────────────────────
const state = {
  currentStep: 1,
  categories: [],
  packages: [],
  slots: [],
  selectedCategoryId: 'all',
  selectedPackage: null,
  selectedSlot: null,
  selectedDate: '',
  consultationMode: 'Online Video Consultation',
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  clientNotes: '',
  clientId: null,
  lawyerId: null
};

// ── Fallback Demo Data (Used if API returns empty array) ──────────────────────
// DEMO DATA
const FALLBACK_CATEGORIES = [
  { category_id: 1, category_name: 'Family Law' },
  { category_id: 2, category_name: 'Property & Land Law' },
  { category_id: 3, category_name: 'Corporate & Commercial' },
  { category_id: 4, category_name: 'Criminal Defense' }
];

const FALLBACK_PACKAGES = [
  {
    package_id: 101,
    lawyer_id: 2,
    lawyer_name: 'Demo Lawyer',
    category_id: 1,
    category_name: 'Family Law',
    package_name: 'Standard Legal Advice Consultation',
    fee: 5000,
    duration_minutes: 30,
    description: 'Initial advisory session for family legal matters, custody, or divorce proceedings.',
    status: 'Active'
  },
  {
    package_id: 102,
    lawyer_id: 2,
    lawyer_name: 'Demo Lawyer',
    category_id: 2,
    category_name: 'Property & Land Law',
    package_name: 'Comprehensive Property Deed Review',
    fee: 12000,
    duration_minutes: 60,
    description: 'Detailed analysis of Land Registry title deeds, encumbrance certificates, and ownership history.',
    status: 'Active'
  },
  {
    package_id: 103,
    lawyer_id: 2,
    lawyer_name: 'Demo Lawyer',
    category_id: 3,
    category_name: 'Corporate & Commercial',
    package_name: 'Express Contract & Agreement Review',
    fee: 7500,
    duration_minutes: 45,
    description: 'Rapid commercial lease and business contract evaluation with legal recommendations.',
    status: 'Active'
  }
];

const FALLBACK_SLOTS = [
  { slot_id: 201, lawyer_id: 2, lawyer_name: 'Demo Lawyer', available_date: '2026-08-05', start_time: '09:00:00', end_time: '10:00:00', status: 'Available' },
  { slot_id: 202, lawyer_id: 2, lawyer_name: 'Demo Lawyer', available_date: '2026-08-05', start_time: '11:00:00', end_time: '12:00:00', status: 'Available' },
  { slot_id: 203, lawyer_id: 2, lawyer_name: 'Demo Lawyer', available_date: '2026-08-06', start_time: '14:00:00', end_time: '15:00:00', status: 'Available' },
  { slot_id: 204, lawyer_id: 2, lawyer_name: 'Demo Lawyer', available_date: '2026-08-07', start_time: '10:30:00', end_time: '11:30:00', status: 'Available' }
];

// ── DOM References ────────────────────────────────────────────────────────────
const btnPrev = document.getElementById('btnPrevStep');
const btnNext = document.getElementById('btnNextStep');
const categoryFilter = document.getElementById('categoryFilter');
const slotDateInput = document.getElementById('slotDateInput');
const btnShowAllSlots = document.getElementById('btnShowAllSlots');

// ── Sidebar Toggle ────────────────────────────────────────────────────────────
document.getElementById('sidebarToggle')?.addEventListener('click', () => {
  document.getElementById('sidebar')?.classList.toggle('sidebar--open');
});

// ── Step Navigation & UI Controller ──────────────────────────────────────────
function updateWizardUI() {
  const step = state.currentStep;

  // 1. Update horizontal wizard step indicators
  for (let i = 1; i <= 4; i++) {
    const stepEl = document.getElementById(`wizStep${i}`);
    if (!stepEl) continue;
    
    stepEl.classList.remove('active', 'done');
    if (i < step) {
      stepEl.classList.add('done');
    } else if (i === step) {
      stepEl.classList.add('active');
    }

    const connEl = document.getElementById(`wizConn${i}`);
    if (connEl) {
      if (i < step) {
        connEl.style.background = 'var(--success)';
      } else {
        connEl.style.background = 'var(--line)';
      }
    }
  }

  // 2. Show container for current step, hide others
  for (let i = 1; i <= 4; i++) {
    const container = document.getElementById(`step${i}Container`);
    if (container) {
      container.style.display = i === step ? 'block' : 'none';
    }
  }

  // 3. Update Prev Button
  if (btnPrev) {
    if (step > 1) {
      btnPrev.style.visibility = 'visible';
    } else {
      btnPrev.style.visibility = 'hidden';
    }
  }

  // 4. Update Next / Confirm Button
  if (btnNext) {
    let isValid = false;
    if (step === 1) {
      isValid = state.selectedPackage !== null;
      btnNext.textContent = 'Next Step: Date & Time →';
    } else if (step === 2) {
      isValid = state.selectedSlot !== null;
      btnNext.textContent = 'Next Step: Details & Mode →';
    } else if (step === 3) {
      isValid = Boolean(state.clientName.trim() && state.clientEmail.trim());
      btnNext.textContent = 'Next Step: Summary & Pay →';
    } else if (step === 4) {
      isValid = true;
      const totalFee = (Number(state.selectedPackage?.fee || 0) + 500).toLocaleString();
      btnNext.textContent = `Confirm Booking & Pay (LKR ${totalFee})`;
    }

    btnNext.disabled = !isValid;
  }

  // 5. If on step 4, calculate summary details
  if (step === 4) {
    renderSummary();
  }
}

// ── STEP 1: Categories & Packages ────────────────────────────────────────────
function renderCategoriesDropdown() {
  if (!categoryFilter) return;
  const cats = state.categories.length > 0 ? state.categories : FALLBACK_CATEGORIES;
  
  categoryFilter.innerHTML = `<option value="all">All Practice Areas (${cats.length})</option>` +
    cats.map(c => `<option value="${c.category_id}">${LC.escapeHtml(c.category_name)}</option>`).join('');

  categoryFilter.addEventListener('change', (e) => {
    state.selectedCategoryId = e.target.value;
    renderPackages();
  });
}

function renderPackages() {
  const container = document.getElementById('packagesGrid');
  if (!container) return;

  const rawPkgs = state.packages.length > 0 ? state.packages : FALLBACK_PACKAGES;
  
  const filtered = rawPkgs.filter(p => {
    if (p.status && p.status !== 'Active') return false;
    if (String(p.lawyer_id) !== String(state.lawyerId)) return false;
    if (state.selectedCategoryId === 'all') return true;
    return String(p.category_id) === String(state.selectedCategoryId);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;padding:32px 0;">
        <div class="empty-state__icon">◈</div>
        <p>No active consultation packages found for this category.</p>
        <button class="btn secondary" onclick="document.getElementById('categoryFilter').value='all'; document.getElementById('categoryFilter').dispatchEvent(new Event('change'));" style="margin-top:10px;">View All Packages</button>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(p => {
    const isSelected = state.selectedPackage && String(state.selectedPackage.package_id) === String(p.package_id);
    return `
      <div class="package-card ${isSelected ? 'selected' : ''}" data-id="${p.package_id}">
        <div>
          <span class="tag" style="margin-bottom:8px;display:inline-block;">${LC.escapeHtml(p.category_name || 'General Law')}</span>
          <h3 style="font-size:16px;font-weight:700;color:var(--navy);margin-bottom:6px;">${LC.escapeHtml(p.package_name)}</h3>
          <p style="font-size:13px;color:var(--muted);margin-bottom:12px;">${LC.escapeHtml(p.description || '')}</p>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-size:13px;color:var(--muted);">⏱ ${p.duration_minutes} Mins</span>
            <span class="package-card__fee">LKR ${Number(p.fee).toLocaleString()}</span>
          </div>
          <button class="btn ${isSelected ? 'primary' : 'secondary'}" style="width:100%;">
            ${isSelected ? '✓ Selected Package' : 'Select Package'}
          </button>
        </div>
      </div>`;
  }).join('');

  // Wire card click handlers
  container.querySelectorAll('.package-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      const selected = filtered.find(p => String(p.package_id) === String(id));
      if (selected) {
        state.selectedPackage = selected;
        renderPackages();
        updateWizardUI();
      }
    });
  });
}

// ── STEP 2: Dates & Available Time Slots ──────────────────────────────────────
function initDateFilter() {
  if (!slotDateInput) return;

  const allSlots = state.slots.length > 0 ? state.slots : FALLBACK_SLOTS;
  const availDates = allSlots
    .filter(s => s.status === 'Available' && String(s.lawyer_id) === String(state.lawyerId))
    .map(s => s.available_date)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();

  const initialDate = availDates[0] || new Date().toISOString().slice(0, 10);
  slotDateInput.value = initialDate;
  state.selectedDate = initialDate;

  slotDateInput.addEventListener('change', (e) => {
    state.selectedDate = e.target.value;
    renderSlots();
  });

  btnShowAllSlots?.addEventListener('click', () => {
    state.selectedDate = 'all';
    renderSlots();
  });
}

function renderSlots() {
  const container = document.getElementById('slotsGrid');
  if (!container) return;

  const rawSlots = state.slots.length > 0 ? state.slots : FALLBACK_SLOTS;

  const filtered = rawSlots.filter(s => {
    if (s.status && s.status !== 'Available') return false;
    if (String(s.lawyer_id) !== String(state.lawyerId)) return false;
    if (state.selectedDate === 'all' || !state.selectedDate) return true;
    return s.available_date === state.selectedDate;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;padding:32px 0;">
        <div class="empty-state__icon">◷</div>
        <p>No available slots found on ${state.selectedDate}.</p>
        <button class="btn secondary" id="btnViewAllDemoSlots" style="margin-top:10px;">Show All Available Demo Slots</button>
      </div>`;
    
    document.getElementById('btnViewAllDemoSlots')?.addEventListener('click', () => {
      state.selectedDate = 'all';
      renderSlots();
    });
    return;
  }

  container.innerHTML = filtered.map(s => {
    const isSelected = state.selectedSlot && String(state.selectedSlot.slot_id) === String(s.slot_id);
    return `
      <div class="slot-card ${isSelected ? 'selected' : ''}" data-id="${s.slot_id}">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong style="font-size:14px;color:var(--navy);">📅 ${s.available_date}</strong>
          ${LC.badge(s.status)}
        </div>
        <div style="font-size:14px;font-weight:700;color:var(--teal-dark);margin:4px 0;">
          ⏰ ${LC.formatTime(s.start_time)} – ${LC.formatTime(s.end_time)}
        </div>
        <div style="font-size:12px;color:var(--muted);">Lawyer: ${LC.escapeHtml(s.lawyer_name || 'Demo Lawyer')}</div>
        <button class="btn ${isSelected ? 'primary' : 'secondary'}" style="margin-top:8px;height:30px;font-size:12px;">
          ${isSelected ? '✓ Selected Slot' : 'Select Slot'}
        </button>
      </div>`;
  }).join('');

  container.querySelectorAll('.slot-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      const selected = filtered.find(s => String(s.slot_id) === String(id));
      if (selected) {
        state.selectedSlot = selected;
        renderSlots();
        updateWizardUI();
      }
    });
  });
}

// ── STEP 3: Mode & Form Listeners ─────────────────────────────────────────────
function initStep3Form() {
  const nameInp = document.getElementById('clientName');
  const emailInp = document.getElementById('clientEmail');
  const phoneInp = document.getElementById('clientPhone');
  const notesInp = document.getElementById('clientNotes');

  nameInp?.addEventListener('input', (e) => { state.clientName = e.target.value; updateWizardUI(); });
  emailInp?.addEventListener('input', (e) => { state.clientEmail = e.target.value; updateWizardUI(); });
  phoneInp?.addEventListener('input', (e) => { state.clientPhone = e.target.value; });
  notesInp?.addEventListener('input', (e) => { state.clientNotes = e.target.value; });

  const modeOnline = document.getElementById('modeOnline');
  const modePhysical = document.getElementById('modePhysical');

  modeOnline?.addEventListener('click', () => {
    state.consultationMode = 'Online Video Consultation';
    modeOnline.classList.add('selected');
    modePhysical?.classList.remove('selected');
  });

  modePhysical?.addEventListener('click', () => {
    state.consultationMode = 'Physical Court / Office Meeting';
    modePhysical.classList.add('selected');
    modeOnline?.classList.remove('selected');
  });
}

// ── STEP 4: Render Summary Details ────────────────────────────────────────────
function renderSummary() {
  const p = state.selectedPackage;
  const s = state.selectedSlot;

  document.getElementById('sumLawyer').textContent = 'Demo Lawyer (BAR-DEMO-001)';
  document.getElementById('sumPackage').textContent = p ? `${p.package_name} (${p.duration_minutes} Mins)` : 'Standard Consultation';
  document.getElementById('sumCategory').textContent = p?.category_name || 'Family Law';
  
  if (s) {
    document.getElementById('sumDateTime').textContent = `${s.available_date} at ${LC.formatTime(s.start_time)} – ${LC.formatTime(s.end_time)}`;
  } else {
    document.getElementById('sumDateTime').textContent = '2026-08-05 at 11:00 AM';
  }

  document.getElementById('sumMode').textContent = state.consultationMode;
  document.getElementById('sumClient').textContent = `${state.clientName} (${state.clientEmail})`;

  const baseFee = p ? Number(p.fee) : 5000;
  const totalFee = baseFee + 500;

  document.getElementById('sumFee').textContent = `LKR ${baseFee.toLocaleString()}`;
  document.getElementById('sumTotal').textContent = `LKR ${totalFee.toLocaleString()}`;
}

// ── Navigation Button Event Listeners ─────────────────────────────────────────
btnPrev?.addEventListener('click', () => {
  if (state.currentStep > 1) {
    state.currentStep--;
    updateWizardUI();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

btnNext?.addEventListener('click', async () => {
  if (state.currentStep < 4) {
    state.currentStep++;
    updateWizardUI();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (state.currentStep === 4) {
    // Final step — submit to real API
    btnNext.disabled = true;
    btnNext.textContent = 'Confirming Appointment…';

    // Determine mode value for API ('Online' or 'Physical')
    const apiMode = state.consultationMode.toLowerCase().includes('physical') ? 'Physical' : 'Online';

    const slot = state.selectedSlot;
    const pkg  = state.selectedPackage;

    const payload = {
      client_id:        state.clientId,
      lawyer_id:        state.lawyerId,
      slot_id:          slot ? slot.slot_id        : null,
      package_id:       pkg  ? pkg.package_id      : null,
      appointment_date: slot ? slot.available_date : '',
      start_time:       slot ? LC.formatTime(slot.start_time) : '',
      end_time:         slot ? LC.formatTime(slot.end_time)   : '',
      mode:             apiMode,
      status:           'Pending',
    };

    try {
      await window.appointmentsApi.create(payload);
      LC.showToast('Appointment booked successfully! Redirecting…', 'success');
      setTimeout(() => {
        window.location.href = 'client_appointments.html';
      }, 1500);
    } catch (err) {
      btnNext.disabled = false;
      btnNext.textContent = 'Confirm Booking';
      const msg = err.errors && Object.values(err.errors).length
        ? Object.values(err.errors).join(' ')
        : (err.message || 'Booking failed. Please try again.');
      LC.showToast(msg, 'error');
    }
  }
});

// ── Initialize App ────────────────────────────────────────────────────────────
(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const targetLawyerId = parseInt(urlParams.get('lawyer'));
  if (!targetLawyerId) {
    LC.showToast('No lawyer specified. Redirecting...', 'error');
    setTimeout(() => window.location.href = 'client_lawyers.html', 1500);
    return;
  }
  state.lawyerId = targetLawyerId;

  try {
    const user = await window.authApi.me();
    state.clientId = user.user_id;
    state.clientName = user.first_name + ' ' + user.last_name;
    state.clientEmail = user.email;
  } catch(err) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const [catData, pkgData, slotData] = await Promise.all([
      window.legalCategories?.list().catch(() => []) || [],
      window.consultationPackages?.list().catch(() => []) || [],
      window.availabilitySlots?.list().catch(() => []) || []
    ]);

    state.categories = catData.length > 0 ? catData : FALLBACK_CATEGORIES;
    state.packages   = pkgData.length > 0 ? pkgData : FALLBACK_PACKAGES;
    state.slots      = slotData.length > 0 ? slotData : FALLBACK_SLOTS;

    // Auto-select first active package & first available slot by default for seamless flow
    if (state.packages.length > 0) {
      state.selectedPackage = state.packages[0];
    }
    if (state.slots.length > 0) {
      state.selectedSlot = state.slots[0];
    }

    renderCategoriesDropdown();
    renderPackages();
    initDateFilter();
    renderSlots();
    initStep3Form();
    updateWizardUI();
  } catch (err) {
    console.error('Error loading appointment booking wizard data:', err);
    // Fallback in case of error
    state.categories = FALLBACK_CATEGORIES;
    state.packages   = FALLBACK_PACKAGES;
    state.slots      = FALLBACK_SLOTS;
    state.selectedPackage = FALLBACK_PACKAGES[0];
    state.selectedSlot = FALLBACK_SLOTS[0];
    
    renderCategoriesDropdown();
    renderPackages();
    initDateFilter();
    renderSlots();
    initStep3Form();
    updateWizardUI();
  }
})();
