// DEMO DATA for appointments (Module 5 backend pending)
const DEMO_APPOINTMENTS = [
  { appointment_id:1, client_name:'Demo Client', date:'2026-08-05', start_time:'11:00', end_time:'12:30', mode:'Online', package_name:'Initial Family Law Consultation', status:'Pending' },
  { appointment_id:2, client_name:'Demo Client', date:'2026-08-10', start_time:'09:00', end_time:'10:00', mode:'Physical', package_name:'Criminal Law Brief', status:'Confirmed' },
  { appointment_id:3, client_name:'Demo Client', date:'2026-07-28', start_time:'14:00', end_time:'15:00', mode:'Online', package_name:'Property Consultation', status:'Completed' }
];

let activeFilter = 'All';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  initPage();
});

function initPage() {
  updateKPIs();
  renderTable();
  setupEventListeners();
  
  // Sidebar toggle
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('sidebar--open');
  });
}

function getStatusBadgeClass(status) {
  switch(status) {
    case 'Pending': return 'badge--warning';
    case 'Confirmed': return 'badge--success';
    case 'Completed': return 'badge--active';
    case 'Cancelled': return 'badge--inactive';
    case 'NoShow': return 'badge--danger';
    default: return '';
  }
}

function getModeBadgeClass(mode) {
  return mode === 'Online' ? 'badge--info' : 'badge--primary';
}

function updateKPIs() {
  const total = DEMO_APPOINTMENTS.length;
  const pending = DEMO_APPOINTMENTS.filter(a => a.status === 'Pending').length;
  const confirmed = DEMO_APPOINTMENTS.filter(a => a.status === 'Confirmed').length;
  const completed = DEMO_APPOINTMENTS.filter(a => a.status === 'Completed').length;
  
  document.getElementById('kpiTotal').textContent = total;
  document.getElementById('kpiPending').textContent = pending;
  document.getElementById('kpiConfirmed').textContent = confirmed;
  document.getElementById('kpiCompleted').textContent = completed;
}

function renderTable() {
  const tbody = document.getElementById('appointmentsTableBody');
  const emptyState = document.getElementById('emptyState');
  const resultsCount = document.getElementById('resultsCount');
  
  let filtered = DEMO_APPOINTMENTS.filter(a => {
    if (activeFilter !== 'All' && a.status !== activeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!a.client_name.toLowerCase().includes(q) && !a.package_name.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });
  
  resultsCount.textContent = `Showing ${filtered.length} results`;
  
  if (filtered.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  
  emptyState.style.display = 'none';
  tbody.innerHTML = filtered.map(a => {
    const statusHtml = `<span class="badge ${getStatusBadgeClass(a.status)}">${window.LC?.escapeHtml(a.status) || a.status}</span>`;
    const modeHtml = `<span class="badge ${getModeBadgeClass(a.mode)}">${window.LC?.escapeHtml(a.mode) || a.mode}</span>`;
    
    let actionsHtml = `<button class="btn btn--secondary btn--sm" onclick="openViewModal(${a.appointment_id})">View</button>`;
    if (a.status === 'Pending') {
      actionsHtml += ` <button class="btn btn--primary btn--sm" onclick="confirmAppt(${a.appointment_id})">Confirm</button>`;
      actionsHtml += ` <button class="btn btn--danger btn--sm" onclick="cancelAppt(${a.appointment_id})">Cancel</button>`;
    } else if (a.status === 'Confirmed') {
      actionsHtml += ` <button class="btn btn--primary btn--sm" onclick="completeAppt(${a.appointment_id})">Complete</button>`;
      actionsHtml += ` <button class="btn btn--danger btn--sm" onclick="cancelAppt(${a.appointment_id})">Cancel</button>`;
    }

    return `
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:12px 8px;">${a.appointment_id}</td>
        <td style="padding:12px 8px;">${window.LC?.escapeHtml(a.client_name) || a.client_name}</td>
        <td style="padding:12px 8px;">${a.date} ${a.start_time}</td>
        <td style="padding:12px 8px;">${modeHtml}</td>
        <td style="padding:12px 8px;">${window.LC?.escapeHtml(a.package_name) || a.package_name}</td>
        <td style="padding:12px 8px;">${statusHtml}</td>
        <td style="padding:12px 8px;">${actionsHtml}</td>
      </tr>
    `;
  }).join('');
}

function setupEventListeners() {
  const chips = document.querySelectorAll('.filter-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      chips.forEach(c => c.classList.remove('filter-chip--active'));
      e.target.classList.add('filter-chip--active');
      activeFilter = e.target.getAttribute('data-filter');
      renderTable();
    });
  });
  
  const searchInput = document.getElementById('searchInput');
  searchInput?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderTable();
  });
  
  document.getElementById('closeModalBtn')?.addEventListener('click', closeViewModal);
}

window.openViewModal = function(id) {
  const appt = DEMO_APPOINTMENTS.find(a => a.appointment_id === id);
  if (!appt) return;
  
  document.getElementById('modalClient').textContent = appt.client_name;
  document.getElementById('modalDate').textContent = appt.date;
  document.getElementById('modalTime').textContent = `${appt.start_time} - ${appt.end_time}`;
  
  document.getElementById('modalMode').innerHTML = `<span class="badge ${getModeBadgeClass(appt.mode)}">${appt.mode}</span>`;
  document.getElementById('modalPackage').textContent = appt.package_name;
  document.getElementById('modalStatus').innerHTML = `<span class="badge ${getStatusBadgeClass(appt.status)}">${appt.status}</span>`;
  
  let footerHtml = `<button class="btn btn--secondary" onclick="closeViewModal()">Close</button>`;
  if (appt.status === 'Pending') {
    footerHtml = `
      <button class="btn btn--danger" onclick="cancelAppt(${id});closeViewModal()">Cancel</button>
      <button class="btn btn--primary" onclick="confirmAppt(${id});closeViewModal()">Confirm</button>
    ` + footerHtml;
  } else if (appt.status === 'Confirmed') {
    footerHtml = `
      <button class="btn btn--danger" onclick="cancelAppt(${id});closeViewModal()">Cancel</button>
      <button class="btn btn--primary" onclick="completeAppt(${id});closeViewModal()">Complete</button>
    ` + footerHtml;
  }
  
  document.getElementById('modalFooter').innerHTML = footerHtml;
  document.getElementById('viewApptModal').classList.add('lc-modal--open');
};

window.closeViewModal = function() {
  document.getElementById('viewApptModal').classList.remove('lc-modal--open');
};

window.confirmAppt = function(id) {
  if(window.LC && window.LC.showToast) {
    window.LC.showToast('Module 5 backend pending: Appointment marked as confirmed (demo)', 'success');
  } else {
    alert('Module 5 backend pending: Appointment marked as confirmed (demo)');
  }
};

window.cancelAppt = function(id) {
  if(window.LC && window.LC.openConfirmModal) {
    window.LC.openConfirmModal('Cancel Appointment', 'Are you sure you want to cancel this demo appointment?', () => {
      if(window.LC.showToast) window.LC.showToast('Module 5 backend pending: Appointment cancelled (demo)', 'info');
    });
  } else {
    alert('Module 5 backend pending: Appointment cancelled (demo)');
  }
};

window.completeAppt = function(id) {
  if(window.LC && window.LC.showToast) {
    window.LC.showToast('Module 5 backend pending: Appointment completed (demo)', 'success');
  } else {
    alert('Module 5 backend pending: Appointment completed (demo)');
  }
};
