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
    let currentUser = null;
    if (window.authApi) {
      try {
        currentUser = await window.authApi.me();
      } catch (e) {
        console.warn("Not logged in or error fetching user context");
      }
    }

    if (!currentUser) {
      // Fallback to zeros if not authenticated
      animateCounter(document.getElementById('kpiUpcoming'), 0);
      animateCounter(document.getElementById('kpiRequests'), 0);
      animateCounter(document.getElementById('kpiDocs'), 0);
      animateCounter(document.getElementById('kpiPayments'), 0, true);
      document.querySelectorAll('.stat-card__delta').forEach(d => d.textContent = '');
      return;
    }
    
    // Fetch live data
    const clientId = currentUser.user_id;
    
    // 1. Appointments
    let upcomingCount = 0;
    try {
      const appts = await window.appointmentsApi.list();
      const myAppts = appts.filter(a => String(a.client_id) === String(clientId) && (a.status === 'Pending' || a.status === 'Confirmed'));
      upcomingCount = myAppts.length;
    } catch(e) { console.error(e); }
    
    // 2. Documents
    let docsCount = 0;
    try {
      const docs = await window.clientDocumentsApi.list(clientId);
      docsCount = docs.length;
    } catch(e) { console.error(e); }
    
    // 3. Payments
    let totalPayments = 0;
    try {
      const payments = await window.paymentsApi.list();
      const myPayments = payments.filter(p => String(p.client_id) === String(clientId));
      totalPayments = myPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    } catch(e) { console.error(e); }
    
    // 4. Requests (Backend not implemented yet, default to 0)
    let requestsCount = 0;
    
    // Animate the counters with real data
    animateCounter(document.getElementById('kpiUpcoming'), upcomingCount);
    animateCounter(document.getElementById('kpiRequests'), requestsCount);
    animateCounter(document.getElementById('kpiDocs'), docsCount);
    animateCounter(document.getElementById('kpiPayments'), totalPayments, true);

    // Clear stat delta subtitles for real data, or update them based on the data if needed
    document.querySelectorAll('.stat-card__delta').forEach(d => d.textContent = '');

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
