/**
 * LegalConnect — Admin Dashboard
 * Loads live metrics from available APIs, populates KPI cards,
 * category list, and activity timeline.
 */
'use strict';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const kpiCategories    = document.getElementById('kpiCategories');
const kpiSlots         = document.getElementById('kpiSlots');
const kpiVerifications = document.getElementById('kpiVerifications');
const kpiVerifNote     = document.getElementById('kpiVerifNote');
const kpiPackages      = document.getElementById('kpiPackages');
const categoryList     = document.getElementById('categoryList');
const activityTimeline = document.getElementById('activityTimeline');
const pendingVerifBadge= document.getElementById('pendingVerifBadge');
const notifCount       = document.getElementById('notifCount');
const sidebarToggle    = document.getElementById('sidebarToggle');
const sidebar          = document.getElementById('sidebar');

// ── Set current date ──────────────────────────────────────────────────────────
const dateEl = document.getElementById('currentDate');
if (dateEl) {
  dateEl.textContent = new Date().toLocaleDateString('en-LK', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// Set API base
const apiBaseEl = document.getElementById('apiBase');
if (apiBaseEl) {
  apiBaseEl.textContent = window.LEGALCONNECT_API_BASE_URL
    || `${window.location.origin}/legalConnect/backend/public/api`;
}

// ── Animate counter ───────────────────────────────────────────────────────────
function animateCounter(el, target) {
  if (!el) return;
  const duration = 500;
  const start    = performance.now();
  function step(now) {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * ease);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── Star rating helper ────────────────────────────────────────────────────────
function renderStars(value) {
  const rating = parseFloat(value) || 0;
  return Array.from({ length: 5 }, (_, i) =>
    `<span class="stars-rating__star${i < Math.round(rating) ? ' filled' : ''}">★</span>`
  ).join('');
}

// ── Load categories ───────────────────────────────────────────────────────────
async function loadCategories() {
  try {
    const cats = await window.legalCategories.list();
    const active = cats.filter(c => c.status === 'Active');
    animateCounter(kpiCategories, active.length);

    if (cats.length === 0) {
      categoryList.innerHTML = '<div class="empty-state" style="padding:24px 0;"><p>No categories yet.</p></div>';
      return;
    }

    categoryList.innerHTML = cats.slice(0, 6).map(c => `
      <div class="detail-row">
        <span class="detail-row__label">${LC.escapeHtml(c.category_name)}</span>
        <span>${LC.badge(c.status)}</span>
      </div>`).join('');
  } catch {
    animateCounter(kpiCategories, 0);
    categoryList.innerHTML = '<div class="empty-state" style="padding:16px 0;"><p>Unable to load.</p></div>';
  }
}

// ── Load availability slots ───────────────────────────────────────────────────
async function loadSlots() {
  try {
    const slots = await window.availabilitySlots.list();
    const available = slots.filter(s => s.status === 'Available').length;
    animateCounter(kpiSlots, available);
    return slots;
  } catch {
    animateCounter(kpiSlots, 0);
    return [];
  }
}

// ── Load packages ─────────────────────────────────────────────────────────────
async function loadPackages() {
  try {
    const pkgs = await window.consultationPackages.list();
    const active = pkgs.filter(p => p.status === 'Active').length;
    animateCounter(kpiPackages, active);
    return pkgs;
  } catch {
    animateCounter(kpiPackages, 0);
    return [];
  }
}

// ── Build activity timeline ───────────────────────────────────────────────────
function buildTimeline(slots, pkgs, cats) {
  const events = [];

  if (cats.length > 0) {
    events.push({
      title: `${cats.filter(c => c.status === 'Active').length} legal categories active`,
      meta: 'Platform setup',
      icon: '⊟',
      color: 'var(--teal)'
    });
  }

  if (pkgs.length > 0) {
    events.push({
      title: `${pkgs.length} consultation package${pkgs.length > 1 ? 's' : ''} configured`,
      meta: `Demo Lawyer · LKR ${Number(pkgs[0]?.fee || 0).toLocaleString()}`,
      icon: '◈',
      color: 'var(--info)'
    });
  }

  if (slots.length > 0) {
    const avail = slots.filter(s => s.status === 'Available').length;
    events.push({
      title: `${avail} availability slot${avail !== 1 ? 's' : ''} open`,
      meta: `${slots.length} total slots · Demo Lawyer`,
      icon: '◷',
      color: 'var(--success)'
    });
  }

  events.push({
    title: 'UI/UX Foundation complete',
    meta: 'Sprint 1 — Design system extended',
    icon: '⊞',
    color: 'var(--navy)'
  });

  events.push({
    title: 'Module 4: Lawyer Profile — In Planning',
    meta: 'Next development step',
    icon: '→',
    color: 'var(--warning)'
  });

  if (events.length === 0) {
    activityTimeline.innerHTML = '<div class="empty-state" style="padding:24px 0;"><div class="empty-state__icon">◷</div><p>No activity yet.</p></div>';
    return;
  }

  activityTimeline.innerHTML = events.map(e => `
    <div class="timeline-item">
      <div class="timeline-item__dot">
        <div class="timeline-item__circle" style="background:${e.color};box-shadow:0 0 0 3px rgba(14,165,160,.15);"></div>
        <div class="timeline-item__line"></div>
      </div>
      <div class="timeline-item__body">
        <p class="timeline-item__title">${LC.escapeHtml(e.title)}</p>
        <p class="timeline-item__meta">${LC.escapeHtml(e.meta)}</p>
      </div>
    </div>`).join('');
}

// ── Verifications placeholder ─────────────────────────────────────────────────
function loadVerifications() {
  // Backend for this exists in Module 4 (lawyer_verifications table)
  // Placeholder count until Module 4 backend is implemented
  animateCounter(kpiVerifications, 0);
  if (kpiVerifNote) kpiVerifNote.textContent = 'Module 4 backend pending';
}

// ── Sidebar toggle ────────────────────────────────────────────────────────────
if (sidebarToggle && sidebar) {
  sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('sidebar--open'));
}

// ── Boot ──────────────────────────────────────────────────────────────────────
(async () => {
  const [cats, slots, pkgs] = await Promise.all([
    legalCategories.list().catch(() => []),
    availabilitySlots.list().catch(() => []),
    consultationPackages.list().catch(() => [])
  ]);

  animateCounter(kpiCategories, cats.filter(c => c.status === 'Active').length);
  animateCounter(kpiSlots, slots.filter(s => s.status === 'Available').length);
  animateCounter(kpiPackages, pkgs.filter(p => p.status === 'Active').length);
  loadVerifications();
  buildTimeline(slots, pkgs, cats);

  // Populate category list
  if (cats.length === 0) {
    categoryList.innerHTML = '<div class="empty-state" style="padding:24px 0;"><p>No categories found.</p></div>';
  } else {
    categoryList.innerHTML = cats.slice(0, 6).map(c => `
      <div class="detail-row">
        <span class="detail-row__label">${LC.escapeHtml(c.category_name)}</span>
        <span>${LC.badge(c.status)}</span>
      </div>`).join('');
  }
})();
