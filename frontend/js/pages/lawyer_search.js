/**
 * LegalConnect — Lawyer Search & Discovery Page Script
 *
 * Handles fetching categories, displaying verified lawyers, real-time filtering
 * (search text, category dropdown, location, rating chips, sorting), URL query param
 * parsing, and detailed lawyer profile / package modal viewing.
 *
 * Utility helpers (escapeHtml, badge, showToast) come from utils.js via window.LC.
 * API callers (legalCategories, consultationPackages) come from api.js.
 */

'use strict';

// DEMO DATA — Verified Sri Lankan Lawyers List
const DEMO_LAWYERS = [
  {
    lawyer_id: 2,
    user_id: 2,
    name: 'Demo Lawyer',
    bar_no: 'BAR-DEMO-001',
    rating: 4.50,
    reviews_count: 28,
    experience_years: 5,
    status: 'Active',
    court: 'Supreme Court & District Court, Colombo',
    location: 'Colombo',
    categories: ['1', '2', '4'], // Family Law (1), Property Law (2), Criminal Law (4)
    category_names: ['Family Law', 'Property & Real Estate', 'Criminal Law'],
    bio: 'Experienced Sri Lankan Attorney-at-Law & Notary Public. Specializes in family disputes, deed attestations, land title opinions, and criminal defense in Colombo courts.',
    avatar_text: 'DL',
    packages_count: 3,
    packages: [
      { name: 'Initial Legal Discovery Call', fee: '5,000 LKR', duration: '30 mins', mode: 'Online Video' },
      { name: 'Property Deed & Title Search Review', fee: '15,000 LKR', duration: '60 mins', mode: 'Physical Office / Document Review' },
      { name: 'Comprehensive Strategy & Representation', fee: '25,000 LKR', duration: '90 mins', mode: 'In-Person' }
    ]
  },
  {
    lawyer_id: 10,
    user_id: 10,
    name: 'Attorney Saman Perera',
    bar_no: 'BAR-SL-1042',
    rating: 4.85,
    reviews_count: 42,
    experience_years: 12,
    status: 'Active',
    court: 'Commercial High Court & District Court, Kandy',
    location: 'Kandy',
    categories: ['2', '3'], // Property (2), Corporate (3)
    category_names: ['Property & Real Estate', 'Corporate & Commercial'],
    bio: 'Senior Counsel specializing in corporate law, commercial contract drafting, real estate transactions, and land dispute litigation in Central Province.',
    avatar_text: 'SP',
    packages_count: 2,
    packages: [
      { name: 'Corporate Compliance Consultation', fee: '12,000 LKR', duration: '45 mins', mode: 'Online Video' },
      { name: 'Commercial Contract Review & Drafting', fee: '30,000 LKR', duration: '90 mins', mode: 'In-Person' }
    ]
  },
  {
    lawyer_id: 11,
    user_id: 11,
    name: 'Attorney Dilini Fernando',
    bar_no: 'BAR-SL-2088',
    rating: 4.70,
    reviews_count: 35,
    experience_years: 8,
    status: 'Active',
    court: 'District Court & Magistrate Court, Galle',
    location: 'Galle',
    categories: ['1', '5'], // Family (1), Labour (5)
    category_names: ['Family Law', 'Labour & Employment'],
    bio: 'Dedicated Attorney-at-Law focusing on matrimonial causes, child custody, maintenance petitions, and industrial tribunal employment disputes.',
    avatar_text: 'DF',
    packages_count: 2,
    packages: [
      { name: 'Family & Custody Advisory', fee: '7,500 LKR', duration: '45 mins', mode: 'Online / In-Person' },
      { name: 'Employment & EPF Dispute Assessment', fee: '10,000 LKR', duration: '60 mins', mode: 'Online Video' }
    ]
  },
  {
    lawyer_id: 12,
    user_id: 12,
    name: 'Attorney Chaminda Jayasinghe',
    bar_no: 'BAR-SL-3015',
    rating: 4.90,
    reviews_count: 56,
    experience_years: 15,
    status: 'Active',
    court: 'Supreme Court & Court of Appeal, Colombo',
    location: 'Colombo',
    categories: ['4', '6'], // Criminal (4), Constitutional (6)
    category_names: ['Criminal Law', 'Constitutional Law'],
    bio: 'Supreme Court Practitioner specializing in Fundamental Rights petitions, Writ Applications in the Court of Appeal, and high-profile criminal trials.',
    avatar_text: 'CJ',
    packages_count: 3,
    packages: [
      { name: 'Supreme Court Writ & FR Consultation', fee: '20,000 LKR', duration: '60 mins', mode: 'In-Person Office' },
      { name: 'Bail & High Court Trial Advisory', fee: '18,000 LKR', duration: '45 mins', mode: 'Online / In-Person' }
    ]
  }
];

// ── DOM Elements ──────────────────────────────────────────────────────────────
const searchInput     = document.getElementById('searchInput');
const categoryFilter  = document.getElementById('categoryFilter');
const locationFilter  = document.getElementById('locationFilter');
const sortSelect      = document.getElementById('sortSelect');
const resultsCountEl  = document.getElementById('resultsCount');
const lawyerGrid      = document.getElementById('lawyerGrid');
const emptyState      = document.getElementById('emptyState');
const resetSearchBtn  = document.getElementById('resetSearchBtn');
const filterChips     = document.querySelectorAll('.filter-chip[data-rating]');

// Modal Elements
const lawyerModal     = document.getElementById('lawyerModal');
const closeModalBtn   = document.getElementById('closeModalBtn');
const modalCloseSec   = document.getElementById('modalCloseSecondary');
const modalAvatar     = document.getElementById('modalAvatar');
const modalLawyerName = document.getElementById('modalLawyerName');
const modalBarNo      = document.getElementById('modalBarNo');
const modalCourt      = document.getElementById('modalCourt');
const modalExp        = document.getElementById('modalExp');
const modalRating     = document.getElementById('modalRating');
const modalBio        = document.getElementById('modalBio');
const modalPkgsList   = document.getElementById('modalPackagesList');
const modalClientBook = document.getElementById('modalClientBookBtn');

// ── State ─────────────────────────────────────────────────────────────────────
let categoriesList   = [];
let activeRating     = 'all';
let currentLawyers   = [...DEMO_LAWYERS];

// ── Initialize Page ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadCategories();
  parseUrlQueryParams();
  renderLawyerResults();
});

// ── Fetch Categories from API ─────────────────────────────────────────────────
async function loadCategories() {
  try {
    if (window.legalCategories && typeof window.legalCategories.list === 'function') {
      categoriesList = await window.legalCategories.list();
      if (categoriesList && categoriesList.length > 0 && categoryFilter) {
        let options = '<option value="">All Legal Categories</option>';
        categoriesList.forEach(cat => {
          const id = String(cat.category_id || cat.id);
          const name = cat.category_name || cat.name;
          options += `<option value="${id}">${LC.escapeHtml(name)}</option>`;
        });
        categoryFilter.innerHTML = options;
      }
    }
  } catch (err) {
    console.warn('API categories load fallback to static options:', err.message);
  }
}

// ── Parse URL Parameters (e.g. ?search=divorce&category=1&lawyer=2) ────────────
function parseUrlQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const search = params.get('search');
  const category = params.get('category');
  const lawyerIdParam = params.get('lawyer');

  if (search && searchInput) {
    searchInput.value = search;
  }
  if (category && categoryFilter) {
    categoryFilter.value = category;
  }
  if (lawyerIdParam) {
    const target = DEMO_LAWYERS.find(l => String(l.lawyer_id) === String(lawyerIdParam));
    if (target) {
      setTimeout(() => openLawyerModal(target), 300);
    }
  }
}

// ── Event Listeners ───────────────────────────────────────────────────────────
function setupEventListeners() {
  if (searchInput) {
    searchInput.addEventListener('input', renderLawyerResults);
  }
  if (categoryFilter) {
    categoryFilter.addEventListener('change', renderLawyerResults);
  }
  if (locationFilter) {
    locationFilter.addEventListener('change', renderLawyerResults);
  }
  if (sortSelect) {
    sortSelect.addEventListener('change', renderLawyerResults);
  }

  // Rating Filter Chips
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeRating = chip.dataset.rating || 'all';
      renderLawyerResults();
    });
  });

  // Reset Button
  if (resetSearchBtn) {
    resetSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (categoryFilter) categoryFilter.value = '';
      if (locationFilter) locationFilter.value = '';
      activeRating = 'all';
      filterChips.forEach(c => c.classList.toggle('active', c.dataset.rating === 'all'));
      if (sortSelect) sortSelect.value = 'recommended';
      renderLawyerResults();
    });
  }

  // Modal Closers
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeLawyerModal);
  if (modalCloseSec) modalCloseSec.addEventListener('click', closeLawyerModal);
  if (lawyerModal) {
    lawyerModal.addEventListener('click', (e) => {
      if (e.target === lawyerModal) closeLawyerModal();
    });
  }
}

// ── Filter and Render Lawyer Results ──────────────────────────────────────────
function renderLawyerResults() {
  const query = (searchInput?.value || '').toLowerCase().trim();
  const selectedCat = (categoryFilter?.value || '');
  const selectedLoc = (locationFilter?.value || '').toLowerCase();
  const sortMode = sortSelect?.value || 'recommended';

  // Filter list
  let filtered = DEMO_LAWYERS.filter(lawyer => {
    // Search query match
    if (query) {
      const matchName = lawyer.name.toLowerCase().includes(query);
      const matchBar = lawyer.bar_no.toLowerCase().includes(query);
      const matchCourt = lawyer.court.toLowerCase().includes(query);
      const matchCat = lawyer.category_names.some(c => c.toLowerCase().includes(query));
      if (!matchName && !matchBar && !matchCourt && !matchCat) return false;
    }

    // Category match
    if (selectedCat) {
      const matchCatId = lawyer.categories.includes(selectedCat);
      const matchCatName = categoriesList.find(c => String(c.category_id || c.id) === selectedCat);
      const nameMatch = matchCatName ? lawyer.category_names.includes(matchCatName.category_name || matchCatName.name) : false;
      if (!matchCatId && !nameMatch) return false;
    }

    // Location match
    if (selectedLoc) {
      if (!lawyer.location.toLowerCase().includes(selectedLoc) && !lawyer.court.toLowerCase().includes(selectedLoc)) {
        return false;
      }
    }

    // Rating filter match
    if (activeRating !== 'all') {
      const minRating = parseFloat(activeRating);
      if (lawyer.rating < minRating) return false;
    }

    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sortMode === 'rating') return b.rating - a.rating;
    if (sortMode === 'experience') return b.experience_years - a.experience_years;
    if (sortMode === 'name') return a.name.localeCompare(b.name);
    return 0; // recommended maintains default order
  });

  // Update counter
  if (resultsCountEl) {
    resultsCountEl.innerHTML = `Showing <strong>${filtered.length}</strong> verified ${filtered.length === 1 ? 'attorney' : 'attorneys'}`;
  }

  // Handle empty state
  if (filtered.length === 0) {
    lawyerGrid.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  lawyerGrid.style.display = 'grid';

  // Render cards
  lawyerGrid.innerHTML = filtered.map(lawyer => renderLawyerCard(lawyer)).join('');

  // Attach card button events
  document.querySelectorAll('.btn-view-lawyer').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const target = DEMO_LAWYERS.find(l => String(l.lawyer_id) === String(id));
      if (target) openLawyerModal(target);
    });
  });

  document.querySelectorAll('.btn-book-lawyer').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const target = DEMO_LAWYERS.find(l => String(l.lawyer_id) === String(id));
      if (target) {
        LC.showToast(`Selected ${target.name}. Redirecting to Client Login...`, 'success');
        setTimeout(() => {
          window.location.href = `client_login.html?lawyer=${target.lawyer_id}`;
        }, 1000);
      }
    });
  });
}

// ── Card Template Generator ───────────────────────────────────────────────────
function renderLawyerCard(lawyer) {
  const isDemo = lawyer.lawyer_id === 2;
  const tagsHtml = lawyer.category_names.map(cat => `<span class="tag">${LC.escapeHtml(cat)}</span>`).join('');

  return `
    <article class="lawyer-card ${isDemo ? 'lawyer-card--featured' : ''}" style="${isDemo ? 'border:2px solid var(--teal); background:linear-gradient(180deg, var(--surface) 0%, #f4fbfb 100%);' : ''}">
      ${isDemo ? '<div style="font-size:11px; font-weight:800; color:var(--teal-dark); text-transform:uppercase; letter-spacing:.6px; margin-bottom:-4px;">⭐ Highlighted Verified Attorney</div>' : ''}

      <div class="lawyer-card__header">
        <div class="avatar avatar--lg ${isDemo ? 'avatar--teal' : 'avatar--navy'}" style="font-size:18px;">
          ${LC.escapeHtml(lawyer.avatar_text)}
        </div>
        <div class="lawyer-card__info">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <h3 class="lawyer-card__name">${LC.escapeHtml(lawyer.name)}</h3>
            <span class="badge active" style="font-size:11px;">${LC.escapeHtml(lawyer.bar_no)}</span>
          </div>
          <p class="lawyer-card__court">🏛 ${LC.escapeHtml(lawyer.court)}</p>
          <div class="lawyer-card__tags">
            ${tagsHtml}
          </div>
        </div>
      </div>

      <p style="font-size:13.5px; color:var(--muted); line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
        ${LC.escapeHtml(lawyer.bio)}
      </p>

      <div class="lawyer-card__stats">
        <div class="lawyer-card__stat">
          <span class="lawyer-card__stat-val" style="color:var(--teal-dark);">⭐ ${lawyer.rating.toFixed(2)}</span>
          <span class="lawyer-card__stat-label">${lawyer.reviews_count} reviews</span>
        </div>
        <div class="lawyer-card__stat">
          <span class="lawyer-card__stat-val">${lawyer.experience_years} yrs</span>
          <span class="lawyer-card__stat-label">Experience</span>
        </div>
        <div class="lawyer-card__stat">
          <span class="lawyer-card__stat-val" style="color:var(--navy);">${lawyer.packages_count}</span>
          <span class="lawyer-card__stat-label">Packages</span>
        </div>
      </div>

      <div class="lawyer-card__actions" style="margin-top:auto;">
        <button type="button" class="btn secondary btn-view-lawyer" data-id="${lawyer.lawyer_id}" style="flex:1;">
          View Profile
        </button>
        <button type="button" class="btn primary btn-book-lawyer" data-id="${lawyer.lawyer_id}" style="flex:1.2;">
          Book Consultation
        </button>
      </div>
    </article>
  `;
}

// ── Modal Handlers ────────────────────────────────────────────────────────────
function openLawyerModal(lawyer) {
  if (!lawyerModal) return;

  modalAvatar.textContent = lawyer.avatar_text;
  modalLawyerName.textContent = lawyer.name;
  modalBarNo.textContent = `${lawyer.bar_no} · ${lawyer.status} Status`;
  modalCourt.textContent = lawyer.court;
  modalExp.textContent = `${lawyer.experience_years} Years Active Practice`;
  modalRating.textContent = `⭐ ${lawyer.rating.toFixed(2)} / 5.00 (${lawyer.reviews_count} verified reviews)`;
  modalBio.textContent = lawyer.bio;

  // Render packages list in modal
  if (lawyer.packages && lawyer.packages.length > 0) {
    modalPkgsList.innerHTML = lawyer.packages.map(pkg => `
      <div style="background:var(--surface-2); border:1px solid var(--line); border-radius:var(--radius); padding:12px 14px; display:flex; justify-content:space-between; align-items:center; gap:10px;">
        <div>
          <p style="font-size:14px; font-weight:700; color:var(--navy); margin-bottom:2px;">${LC.escapeHtml(pkg.name)}</p>
          <span class="mode-badge mode-badge--online">${LC.escapeHtml(pkg.mode)}</span>
          <span style="font-size:12px; color:var(--muted); margin-left:6px;">⏱ ${LC.escapeHtml(pkg.duration)}</span>
        </div>
        <div style="text-align:right;">
          <span style="font-size:15px; font-weight:800; color:var(--teal-dark);">${LC.escapeHtml(pkg.fee)}</span>
        </div>
      </div>
    `).join('');
  } else {
    modalPkgsList.innerHTML = '<p style="font-size:13px; color:var(--muted);">No specific packages listed.</p>';
  }

  modalClientBook.href = `client_login.html?lawyer=${lawyer.lawyer_id}`;

  lawyerModal.style.display = 'block';
  lawyerModal.classList.add('slide-panel__overlay--show');
}

function closeLawyerModal() {
  if (!lawyerModal) return;
  lawyerModal.style.display = 'none';
  lawyerModal.classList.remove('slide-panel__overlay--show');
}
