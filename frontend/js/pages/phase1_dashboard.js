/**
 * LegalConnect — Dashboard Page
 * Loads live KPI metrics from the API and displays them.
 */

'use strict';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const categoryCountEl = document.getElementById('categoryCount');
const slotCountEl     = document.getElementById('slotCount');
const currentDateEl   = document.getElementById('currentDate');
const apiBaseEl       = document.getElementById('apiBase');

// ── Init ──────────────────────────────────────────────────────────────────────
(function init() {
  // Show today's date in the topbar
  if (currentDateEl) {
    currentDateEl.textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  // Show API base URL in the status card
  if (apiBaseEl) {
    const base = window.LEGALCONNECT_API_BASE_URL
      || `${window.location.origin}/legalConnect/backend/public/api`;
    apiBaseEl.textContent = base;
  }

  loadMetrics();
})();

// ── Metrics ───────────────────────────────────────────────────────────────────
async function loadMetrics() {
  try {
    const metrics = await window.dashboardApi.metrics();
    animateCount(categoryCountEl, metrics.active_legal_categories ?? 0);
    animateCount(slotCountEl,     metrics.available_slots         ?? 0);
  } catch (error) {
    LC.showToast(error.message || 'Unable to load dashboard metrics.', 'error');
    if (categoryCountEl) categoryCountEl.textContent = '—';
    if (slotCountEl)     slotCountEl.textContent     = '—';
  }
}

/**
 * Animates a numeric counter from 0 to `target` over ~500 ms.
 * @param {HTMLElement} el
 * @param {number} target
 */
function animateCount(el, target) {
  if (!el) return;

  const duration = 500;
  const start    = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(progress * target);
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}
