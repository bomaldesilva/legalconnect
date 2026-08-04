/**
 * LegalConnect — Public Lawyer Profile (Client-Facing)
 *
 * Read-only profile view for clients browsing lawyers.
 * Loaded via: lawyer_public_profile.html?id=<lawyer_id>
 *
 * Fetches from GET /api/lawyer-profile/{id}/public
 * No editing capability — uses lawyerProfileApi.getPublic(id)
 */

'use strict';

// ── Resolve lawyer ID from URL query string ───────────────────────────────────
const params   = new URLSearchParams(window.location.search);
const LAWYER_ID = parseInt(params.get('id') || '2', 10);

// ── DOM refs ──────────────────────────────────────────────────────────────────
const loadingState   = document.getElementById('loadingState');
const errorState     = document.getElementById('errorState');
const profileContent = document.getElementById('profileContent');
const errorMsg       = document.getElementById('errorMsg');

// ── Boot ──────────────────────────────────────────────────────────────────────
async function boot() {
  try {
    const profile = await window.lawyerProfileApi.getPublic(LAWYER_ID);
    renderProfile(profile);
    showContent();
  } catch (error) {
    showError(error.message || 'Profile not found or server unavailable.');
  }
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function renderProfile(p) {
  // Page title
  document.title = `LegalConnect | ${p.first_name} ${p.last_name}`;

  // Avatar
  const initials = getInitials(p.first_name, p.last_name);
  document.getElementById('pubAvatar').textContent = initials;

  // Verification badge
  const verifEl = document.getElementById('pubVerifBadge');
  const status  = (p.verification_status || '').toLowerCase();
  verifEl.textContent = verifBadgeText(status);
  verifEl.className   = `pub-verif-badge ${verifBadgeClass(status)}`;

  // Name + sub
  document.getElementById('pubName').textContent = `${p.first_name} ${p.last_name}`;
  const subParts = ['Lawyer'];
  if (p.experience_years) subParts.push(`${p.experience_years} yrs exp.`);
  if (p.court) subParts.push(p.court);
  document.getElementById('pubSub').textContent = subParts.join(' · ');

  // Hero tags (categories)
  const tags = document.getElementById('pubTags');
  const cats  = p.categories || [];
  tags.innerHTML = cats.length
    ? cats.map(c => `<span class="public-hero-tag">${LC.escapeHtml(c.category_name)}</span>`).join('')
    : '<span class="public-hero-tag" style="opacity:.5">General Practice</span>';

  // Biography
  if (p.bio && p.bio.trim()) {
    document.getElementById('bioPanel').style.display = '';
    document.getElementById('pubBio').textContent     = p.bio;
  }

  // Education
  if (p.education && p.education.trim()) {
    document.getElementById('eduPanel').style.display = '';
    document.getElementById('pubEdu').textContent     = p.education;
  }

  // Legal expertise tags
  if (cats.length > 0) {
    document.getElementById('expertisePanel').style.display = '';
    document.getElementById('pubExpertiseTags').innerHTML = cats.map(c =>
      `<span class="tag">${LC.escapeHtml(c.category_name)}</span>`
    ).join('');
  }

  // Quick facts
  document.getElementById('pubExperience').textContent = p.experience_years
    ? `${p.experience_years} year${p.experience_years !== 1 ? 's' : ''}`
    : '—';
  document.getElementById('pubCourt').textContent = p.court || '—';
  document.getElementById('pubBar').textContent   = p.bar_registration_no || '—';
  document.getElementById('pubMemberSince').textContent = p.member_since
    ? p.member_since.split(' ')[0]
    : '—';

  // Rating
  const r = parseFloat(p.rating) || 0;
  const pubRating = document.getElementById('pubRating');
  if (r > 0) {
    pubRating.innerHTML = `
      <span class="stars-rating">
        ${renderStars(r)}
        <span class="stars-rating__value">${r.toFixed(1)}</span>
      </span>`;
  } else {
    pubRating.innerHTML = '<span style="color:var(--muted);font-size:13px;">No reviews yet</span>';
  }

  // Availability summary
  const avail = p.availability_summary || {};
  document.getElementById('pubAvailTotal').textContent = avail.total_slots     ?? '0';
  document.getElementById('pubAvailAvail').textContent = avail.available_slots ?? '0';
  document.getElementById('pubAvailNext').textContent  = avail.next_available_date || '—';

  // Packages
  const pkgs     = (p.package_summary && p.package_summary.packages) || [];
  const pkgListEl = document.getElementById('pubPkgList');

  if (pkgs.length === 0) {
    pkgListEl.innerHTML = `
      <div class="empty-state" style="padding:24px;">
        <div class="empty-state__icon" style="font-size:28px;">◈</div>
        <p style="color:var(--muted);font-size:13px;">No consultation packages available yet.</p>
      </div>`;
  } else {
    pkgListEl.innerHTML = pkgs
      .filter(pkg => pkg.status === 'Active')
      .map(pkg => `
        <div class="pkg-card">
          <div class="pkg-card__name">${LC.escapeHtml(pkg.package_name)}</div>
          <div class="pkg-card__meta">${pkg.duration_minutes} minutes · ${LC.badge(pkg.status)}</div>
          <div class="pkg-card__fee">LKR ${Number(pkg.fee).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        </div>`)
      .join('');

    if (pkgListEl.innerHTML.trim() === '') {
      pkgListEl.innerHTML = `<p style="color:var(--muted);font-size:13px;text-align:center;padding:12px 0;">No active packages at this time.</p>`;
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(first, last) {
  return ((first || '').trim().charAt(0) + (last || '').trim().charAt(0)).toUpperCase() || 'DL';
}

function verifBadgeText(status) {
  switch (status) {
    case 'approved': return '✓ Verified Lawyer';
    case 'pending':  return '⏳ Verification Pending';
    case 'rejected': return '✕ Not Verified';
    default:         return '— Verification Status Unknown';
  }
}

function verifBadgeClass(status) {
  switch (status) {
    case 'approved': return 'pub-verif-badge--approved';
    case 'pending':  return 'pub-verif-badge--pending';
    case 'rejected': return 'pub-verif-badge--rejected';
    default:         return 'pub-verif-badge--unknown';
  }
}

function renderStars(rating) {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return [
    ...Array(full).fill('<span class="stars-rating__star filled">★</span>'),
    ...Array(half).fill('<span class="stars-rating__star half">★</span>'),
    ...Array(empty).fill('<span class="stars-rating__star">★</span>'),
  ].join('');
}

// ── UI states ─────────────────────────────────────────────────────────────────

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

// ── Start ─────────────────────────────────────────────────────────────────────
boot();
