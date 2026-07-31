/**
 * LegalConnect — Lawyer Dashboard JS
 * Loads live data from available APIs and renders all dashboard sections.
 */
'use strict';

const DEMO_LAWYER_ID = 2;

// ── Set date ──────────────────────────────────────────────────────────────────
const dateEl = document.getElementById('currentDate');
if (dateEl) {
  dateEl.textContent = new Date().toLocaleDateString('en-LK', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ── Animate counter ───────────────────────────────────────────────────────────
function animateCounter(el, target) {
  if (!el) return;
  const dur = 500, start = performance.now();
  const step = now => {
    const p = Math.min((now - start) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * e);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ── Build week strip ──────────────────────────────────────────────────────────
function buildWeekStrip() {
  const strip = document.getElementById('weekStrip');
  if (!strip) return;
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7)); // Go to Monday

  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  strip.innerHTML = '';
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const isToday = d.toDateString() === today.toDateString();
    const btn = document.createElement('button');
    btn.className = `week-day${isToday ? ' today' : ''}`;
    btn.setAttribute('type', 'button');
    btn.innerHTML = `
      <span class="week-day__name">${days[i]}</span>
      <span class="week-day__num">${d.getDate()}</span>`;
    btn.addEventListener('click', () => {
      strip.querySelectorAll('.week-day').forEach(el => el.classList.remove('today'));
      btn.classList.add('today');
    });
    strip.appendChild(btn);
  }
}

// ── Render upcoming slots table ───────────────────────────────────────────────
function renderSlots(slots) {
  const tbody = document.getElementById('upcomingSlots');
  if (!tbody) return;

  const upcoming = slots
    .filter(s => s.status === 'Available' && s.available_date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.available_date.localeCompare(b.available_date))
    .slice(0, 5);

  if (upcoming.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4">
          <div class="empty-state" style="padding:24px 0;">
            <div class="empty-state__icon">◷</div>
            <p>No upcoming available slots.</p>
            <a href="lawyer_availability_slots.html" class="btn secondary" style="margin-top:10px;height:32px;font-size:12px;padding:0 12px;">Add Slots</a>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = upcoming.map(s => `
    <tr>
      <td style="font-weight:600;color:var(--navy);">${s.available_date}</td>
      <td style="font-size:13px;">${LC.formatTime(s.start_time)}</td>
      <td style="font-size:13px;">${LC.formatTime(s.end_time)}</td>
      <td>${LC.badge(s.status)}</td>
    </tr>`).join('');
}

// ── Build activity timeline ───────────────────────────────────────────────────
function buildTimeline(slots, pkgs) {
  const timeline = document.getElementById('activityTimeline');
  if (!timeline) return;

  const events = [];
  const avail = slots.filter(s => s.status === 'Available').length;
  if (avail > 0) {
    events.push({ title: `${avail} slot${avail !== 1 ? 's' : ''} available for booking`, meta: 'Availability · Live', color: 'var(--success)' });
  }
  if (pkgs.length > 0) {
    events.push({ title: `${pkgs.length} consultation package${pkgs.length !== 1 ? 's' : ''} configured`, meta: `From LKR ${Number(pkgs[0].fee).toLocaleString()}`, color: 'var(--info)' });
  }
  events.push({ title: 'Profile verification: Approved', meta: 'BAR-DEMO-001 · Admin verified', color: 'var(--teal)' });
  events.push({ title: 'Module 5 (Appointments) — Planning', meta: 'Upcoming development', color: 'var(--warning)' });

  if (events.length === 0) {
    timeline.innerHTML = '<div class="empty-state" style="padding:24px 0;"><p>No recent activity.</p></div>';
    return;
  }

  timeline.innerHTML = events.map(e => `
    <div class="timeline-item">
      <div class="timeline-item__dot">
        <div class="timeline-item__circle" style="background:${e.color};box-shadow:0 0 0 3px rgba(14,165,160,.12);"></div>
        <div class="timeline-item__line"></div>
      </div>
      <div class="timeline-item__body">
        <p class="timeline-item__title">${LC.escapeHtml(e.title)}</p>
        <p class="timeline-item__meta">${LC.escapeHtml(e.meta)}</p>
      </div>
    </div>`).join('');
}

// ── Sidebar toggle ────────────────────────────────────────────────────────────
document.getElementById('sidebarToggle')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('sidebar--open');
});

// ── Boot ──────────────────────────────────────────────────────────────────────
buildWeekStrip();

(async () => {
  try {
    const [slots, pkgs] = await Promise.all([
      window.availabilitySlots.list().catch(() => []),
      window.consultationPackages.list().catch(() => [])
    ]);

    const availCount = slots.filter(s => s.status === 'Available').length;
    const pkgCount   = pkgs.filter(p => p.status === 'Active').length;

    animateCounter(document.getElementById('kpiSlots'),    availCount);
    animateCounter(document.getElementById('kpiPackages'), pkgCount);

    renderSlots(slots);
    buildTimeline(slots, pkgs);
  } catch (err) {
    console.error('Dashboard load error:', err);
  }
})();
