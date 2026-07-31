/**
 * LegalConnect — Client Service Requests JS
 * Manages property title search & deed verification requests.
 */
'use strict';

// DEMO DATA (maps to property_requests DB table)
const DEMO_REQUESTS = [
  {
    request_id: 101,
    request_type: 'Land Registry Title Search',
    property_location: 'Kandy Municipal Council Area (Deed Vol 142)',
    lawyer_name: 'Demo Lawyer',
    submitted_at: '2026-07-25',
    status: 'Approved',
    description: 'Title check report extract for commercial property acquisition.'
  },
  {
    request_id: 102,
    request_type: 'Deed Title Ownership Verification',
    property_location: 'Colombo 07 - Ward Place Residency',
    lawyer_name: 'Demo Lawyer',
    submitted_at: '2026-07-29',
    status: 'InReview',
    description: 'Verification of prior encumbrances and mortgage registers.'
  }
];

// DOM refs
const requestRows = document.getElementById('requestRows');
const searchInput = document.getElementById('searchInput');
const resultsCount = document.getElementById('resultsCount');
const requestCount = document.getElementById('requestCount');
const kpiTotalReq = document.getElementById('kpiTotalReq');
const kpiPendingReq = document.getElementById('kpiPendingReq');
const kpiCompletedReq = document.getElementById('kpiCompletedReq');
const newRequestBtn = document.getElementById('newRequestBtn');
const requestModalOverlay = document.getElementById('requestModalOverlay');
const requestForm = document.getElementById('requestForm');

let activeFilter = 'all';
let allRequests = [...DEMO_REQUESTS];

function getStatusBadge(status) {
  const map = {
    Pending: '<span class="badge warning">Pending</span>',
    InReview: '<span class="badge booked">In Review</span>',
    Approved: '<span class="badge active">Approved</span>',
    Rejected: '<span class="badge inactive">Rejected</span>',
    Closed: '<span class="badge inactive">Closed</span>'
  };
  return map[status] || `<span class="badge">${LC.escapeHtml(status)}</span>`;
}

function renderRequests(list) {
  if (!requestRows) return;

  if (list.length === 0) {
    requestRows.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state" style="padding:36px 0;">
            <div class="empty-state__icon">🏛</div>
            <p class="empty-state__title">No service requests found</p>
            <p>Submit a title check or legal service request using the button above.</p>
          </div>
        </td>
      </tr>`;
    if (resultsCount) resultsCount.textContent = '0 results';
    return;
  }

  if (resultsCount) resultsCount.textContent = `${list.length} result${list.length !== 1 ? 's' : ''}`;

  requestRows.innerHTML = list.map(r => `
    <tr>
      <td class="cell-num">#${r.request_id}</td>
      <td style="font-weight:700;color:var(--navy);">${LC.escapeHtml(r.request_type)}</td>
      <td style="font-size:13px;color:var(--text);">${LC.escapeHtml(r.property_location)}</td>
      <td style="font-size:13px;color:var(--muted);">${LC.escapeHtml(r.lawyer_name)}</td>
      <td style="font-size:12px;color:var(--muted);">${r.submitted_at}</td>
      <td>${getStatusBadge(r.status)}</td>
      <td>
        <button class="btn secondary" type="button" onclick="viewRequestDetails(${r.request_id})" style="height:32px;font-size:12px;padding:0 10px;">View</button>
      </td>
    </tr>`).join('');
}

function applyFilters() {
  const q = (searchInput?.value || '').toLowerCase();
  let filtered = allRequests;

  if (activeFilter !== 'all') {
    filtered = filtered.filter(r => r.status === activeFilter);
  }

  if (q) {
    filtered = filtered.filter(r =>
      `${r.request_type} ${r.property_location} ${r.lawyer_name}`.toLowerCase().includes(q)
    );
  }

  renderRequests(filtered);
}

// Filter chips
document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    activeFilter = chip.dataset.filter;
    applyFilters();
  });
});

searchInput?.addEventListener('input', applyFilters);

function openRequestModal() {
  if (requestModalOverlay) {
    requestModalOverlay.style.display = 'grid';
  }
}

function closeRequestModal() {
  if (requestModalOverlay) {
    requestModalOverlay.style.display = 'none';
  }
}

if (newRequestBtn) {
  newRequestBtn.addEventListener('click', openRequestModal);
}

if (requestForm) {
  requestForm.addEventListener('submit', e => {
    e.preventDefault();
    const type = document.getElementById('requestType').value;
    const location = document.getElementById('propertyLocation').value;
    const desc = document.getElementById('requestDescription').value;

    const newReq = {
      request_id: 100 + allRequests.length + 1,
      request_type: type,
      property_location: location,
      lawyer_name: 'Demo Lawyer',
      submitted_at: new Date().toISOString().slice(0, 10),
      status: 'Pending',
      description: desc
    };

    allRequests.unshift(newReq);
    closeRequestModal();
    applyFilters();
    updateKPIs();
    LC.showToast('Service request submitted successfully! Assigned to Demo Lawyer.', 'success');
  });
}

function viewRequestDetails(id) {
  const r = allRequests.find(x => x.request_id === id);
  if (!r) return;

  LC.openConfirmModal(
    `Request #${r.request_id}: ${r.request_type}\nLocation: ${r.property_location}\nStatus: ${r.status}\n\nDetails: ${r.description || 'N/A'}`,
    'Close Detail',
    'primary'
  );
}

window.closeRequestModal = closeRequestModal;
window.viewRequestDetails = viewRequestDetails;

function updateKPIs() {
  if (kpiTotalReq) kpiTotalReq.textContent = allRequests.length;
  if (kpiPendingReq) kpiPendingReq.textContent = allRequests.filter(r => r.status === 'Pending' || r.status === 'InReview').length;
  if (kpiCompletedReq) kpiCompletedReq.textContent = allRequests.filter(r => r.status === 'Approved' || r.status === 'Closed').length;
  if (requestCount) requestCount.textContent = `${allRequests.length} requests`;
}

// Sidebar toggle
document.getElementById('sidebarToggle')?.addEventListener('click', () => {
  document.getElementById('sidebar')?.classList.toggle('sidebar--open');
});

// Boot
updateKPIs();
renderRequests(allRequests);
