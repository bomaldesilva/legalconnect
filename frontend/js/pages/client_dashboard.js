/**
 * LegalConnect — Client Workspace Dashboard JS
 * Handles date rendering, metric counters, quick actions, and sidebar toggle.
 */
'use strict';

// DEMO DATA CONTEXT
const DEMO_CLIENT_ID = 1;
const DEMO_USER_ID = 3;

// ── Set Date ──────────────────────────────────────────────────────────────────
const dateEl = document.getElementById('currentDate');
if (dateEl) {
  dateEl.textContent = new Date().toLocaleDateString('en-LK', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// ── Counter Animation Helper ──────────────────────────────────────────────────
function animateCounter(el, target, isCurrency = false) {
  if (!el) return;
  const dur = 600, start = performance.now();
  const step = now => {
    const p = Math.min((now - start) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    const val = Math.round(target * e);
    if (isCurrency) {
      el.textContent = `LKR ${val.toLocaleString()}`;
    } else {
      el.textContent = val;
    }
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ── Sidebar Toggle ────────────────────────────────────────────────────────────
document.getElementById('sidebarToggle')?.addEventListener('click', () => {
  document.getElementById('sidebar')?.classList.toggle('sidebar--open');
});

// ── Quick Action Listeners ─────────────────────────────────────────────────────
document.getElementById('btnJoinMeeting')?.addEventListener('click', () => {
  LC.showToast('Connecting to encrypted video consultation room...', 'info');
});

document.getElementById('btnReschedule')?.addEventListener('click', () => {
  LC.showToast('Reschedule request sent to lawyer. (Module 5 Demo)', 'info');
});

document.getElementById('btnRequestTitleCheck')?.addEventListener('click', async () => {
  const confirm = await LC.openConfirmModal(
    'Request Title Deed Verification service from Demo Lawyer?',
    'Submit Request',
    'primary'
  );
  if (confirm) {
    LC.showToast('Title Deed Verification request submitted! (Ref #REQ-2026-090)', 'success');
  }
});

document.getElementById('btnUploadDocument')?.addEventListener('click', () => {
  LC.showToast('Select files to upload into My Documents portal.', 'info');
});

document.getElementById('btnEditProfile')?.addEventListener('click', (e) => {
  e.preventDefault();
  LC.showToast('Client profile update settings preview.', 'info');
});

// ── Initial Data Load ─────────────────────────────────────────────────────────
(async () => {
  try {
    // Determine if this is a demo account or a real new user
    const DEMO_EMAILS = ['client@legalconnect.lk', 'lawyer@legalconnect.lk', 'admin@legalconnect.lk'];
    let isDemo = false;
    if (window.authApi) {
      try {
        const user = await window.authApi.me();
        isDemo = DEMO_EMAILS.includes(user.email);
      } catch (e) {
        isDemo = false;
      }
    }

    if (isDemo) {
      // DEMO ACCOUNT: animate with hardcoded demo numbers
      animateCounter(document.getElementById('kpiUpcoming'), 1);
      animateCounter(document.getElementById('kpiRequests'), 2);
      animateCounter(document.getElementById('kpiDocs'), 4);
      animateCounter(document.getElementById('kpiPayments'), 15000, true);
    } else {
      // NEW / REAL USER: show zeros — real data would come from live API calls
      animateCounter(document.getElementById('kpiUpcoming'), 0);
      animateCounter(document.getElementById('kpiRequests'), 0);
      animateCounter(document.getElementById('kpiDocs'), 0);
      animateCounter(document.getElementById('kpiPayments'), 0, true);

      // Clear stat delta subtitles ("Next: 2026-08-05", "1 Under Review", etc.)
      document.querySelectorAll('.stat-card__delta').forEach(d => d.textContent = '');
    }

    // Fetch live availability slots & consultation packages for context check
    const [slots, pkgs] = await Promise.all([
      window.availabilitySlots?.list().catch(() => []) || [],
      window.consultationPackages?.list().catch(() => []) || []
    ]);

    console.log(`Live API available slots count: ${slots.length}, active packages count: ${pkgs.length}`);
  } catch (err) {
    console.error('Client dashboard initialization error:', err);
  }
})();
