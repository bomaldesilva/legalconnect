// LegalConnect Client Appointments Page Logic

// DEMO DATA for Client Appointments (Module 5 backend pending)
const DEMO_APPOINTMENTS = [
  {
    appointment_id: 1,
    lawyer_name: 'Demo Lawyer',
    bar_no: 'BAR-DEMO-001',
    date: '2026-08-05',
    start_time: '11:00 AM',
    end_time: '12:00 PM',
    mode: 'Online',
    package_name: 'Initial Property Consultation',
    status: 'Confirmed',
    location: 'Online Video Call',
    meeting_link: 'https://meet.legalconnect.lk/room-demo-001',
    notes: 'Title Deed inspection & verification consultation for land plot in Kandy.'
  },
  {
    appointment_id: 2,
    lawyer_name: 'Sarah Jenkins',
    bar_no: 'BAR-COL-482',
    date: '2026-08-12',
    start_time: '02:30 PM',
    end_time: '03:30 PM',
    mode: 'Physical',
    package_name: 'Land Registry Verification',
    status: 'Pending',
    location: 'LegalConnect Chambers, Colombo 03',
    meeting_link: '',
    notes: 'Discussion regarding Land Registry deed search report and boundary title validation.'
  },
  {
    appointment_id: 3,
    lawyer_name: 'Demo Lawyer',
    bar_no: 'BAR-DEMO-001',
    date: '2026-07-20',
    start_time: '10:00 AM',
    end_time: '11:00 AM',
    mode: 'Online',
    package_name: 'Family Law Preliminary Advice',
    status: 'Completed',
    location: 'Online Video Call',
    meeting_link: 'https://meet.legalconnect.lk/room-demo-001',
    notes: 'Reviewed power of attorney draft and provided preliminary legal opinion.'
  },
  {
    appointment_id: 4,
    lawyer_name: 'Nimal Perera',
    bar_no: 'BAR-KND-105',
    date: '2026-07-15',
    start_time: '04:00 PM',
    end_time: '05:00 PM',
    mode: 'Physical',
    package_name: 'Corporate Legal Retainer',
    status: 'Cancelled',
    location: 'Kandy District Court Annex',
    meeting_link: '',
    notes: 'Session cancelled by client due to schedule clash.'
  }
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
  switch (status) {
    case 'Pending': return 'badge--warning';
    case 'Confirmed': return 'badge--success';
    case 'Completed': return 'badge--active';
    case 'Cancelled': return 'badge--inactive';
    default: return '';
  }
}

function getModeBadgeClass(mode) {
  return mode === 'Online' ? 'badge--info' : 'badge--primary';
}

function updateKPIs() {
  const total = DEMO_APPOINTMENTS.length;
  const upcoming = DEMO_APPOINTMENTS.filter(a => a.status === 'Confirmed' || a.status === 'Pending').length;
  const completed = DEMO_APPOINTMENTS.filter(a => a.status === 'Completed').length;
  
  const totalEl = document.getElementById('kpiTotal');
  const upcomingEl = document.getElementById('kpiUpcoming');
  const completedEl = document.getElementById('kpiCompleted');

  if (totalEl) totalEl.textContent = total;
  if (upcomingEl) upcomingEl.textContent = upcoming;
  if (completedEl) completedEl.textContent = completed;
}

function renderTable() {
  const tbody = document.getElementById('appointmentsTableBody');
  const emptyState = document.getElementById('emptyState');
  const resultsCount = document.getElementById('resultsCount');
  
  if (!tbody) return;

  let filtered = DEMO_APPOINTMENTS.filter(a => {
    if (activeFilter !== 'All' && a.status !== activeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!a.lawyer_name.toLowerCase().includes(q) && !a.package_name.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });
  
  if (resultsCount) resultsCount.textContent = `Showing ${filtered.length} results`;
  
  if (filtered.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  
  if (emptyState) emptyState.style.display = 'none';
  
  tbody.innerHTML = filtered.map(a => {
    const statusHtml = `<span class="badge ${getStatusBadgeClass(a.status)}">${window.LC?.escapeHtml(a.status) || a.status}</span>`;
    const modeHtml = `<span class="badge ${getModeBadgeClass(a.mode)}">${window.LC?.escapeHtml(a.mode) || a.mode}</span>`;
    
    let actionsHtml = `<button class="btn btn--secondary btn--sm" onclick="openViewModal(${a.appointment_id})">View Details</button>`;
    
    if (a.mode === 'Online' && (a.status === 'Confirmed' || a.status === 'Pending')) {
      actionsHtml += ` <button class="btn btn--primary btn--sm" onclick="joinVideoCall(${a.appointment_id})">🎥 Join Call</button>`;
    }
    
    if (a.status === 'Pending' || a.status === 'Confirmed') {
      actionsHtml += ` <button class="btn btn--danger btn--sm" onclick="cancelAppt(${a.appointment_id})">Cancel</button>`;
    }

    return `
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:12px 10px;font-weight:600;color:var(--navy);">#${a.appointment_id}</td>
        <td style="padding:12px 10px;">
          <div style="font-weight:600;">${window.LC?.escapeHtml(a.lawyer_name) || a.lawyer_name}</div>
          <div style="font-size:0.75rem;color:#64748b;">${window.LC?.escapeHtml(a.bar_no) || a.bar_no}</div>
        </td>
        <td style="padding:12px 10px;">
          <div>${a.date}</div>
          <div style="font-size:0.75rem;color:#64748b;">${a.start_time} - ${a.end_time}</div>
        </td>
        <td style="padding:12px 10px;">${modeHtml}</td>
        <td style="padding:12px 10px;">${window.LC?.escapeHtml(a.package_name) || a.package_name}</td>
        <td style="padding:12px 10px;">${statusHtml}</td>
        <td style="padding:12px 10px;">
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${actionsHtml}
          </div>
        </td>
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
  
  document.getElementById('closeViewModalBtn')?.addEventListener('click', closeViewModal);
  document.getElementById('openBookModalBtn')?.addEventListener('click', openBookModal);
  document.getElementById('closeBookModalBtn')?.addEventListener('click', closeBookModal);
  document.getElementById('cancelBookBtn')?.addEventListener('click', closeBookModal);
  document.getElementById('bookConsultationForm')?.addEventListener('submit', handleBookSubmit);
}

window.openViewModal = function(id) {
  const appt = DEMO_APPOINTMENTS.find(a => a.appointment_id === id);
  if (!appt) return;
  
  document.getElementById('modalLawyer').textContent = appt.lawyer_name;
  document.getElementById('modalBarNo').textContent = appt.bar_no;
  document.getElementById('modalDateTime').textContent = `${appt.date} at ${appt.start_time} - ${appt.end_time}`;
  
  const locationText = appt.mode === 'Online' ? 'Online Video Call' : appt.location;
  document.getElementById('modalMode').innerHTML = `<span class="badge ${getModeBadgeClass(appt.mode)}">${appt.mode}</span> <span style="font-size:0.85rem;color:#475569;margin-left:6px;">(${locationText})</span>`;
  document.getElementById('modalPackage').textContent = appt.package_name;
  document.getElementById('modalStatus').innerHTML = `<span class="badge ${getStatusBadgeClass(appt.status)}">${appt.status}</span>`;
  document.getElementById('modalNotes').textContent = appt.notes || 'No specific notes provided.';

  let footerHtml = `<button class="btn btn--secondary" onclick="closeViewModal()">Close</button>`;
  
  if (appt.mode === 'Online' && (appt.status === 'Confirmed' || appt.status === 'Pending')) {
    footerHtml = `<button class="btn btn--primary" onclick="joinVideoCall(${id})">🎥 Join Video Call</button> ` + footerHtml;
  }
  
  if (appt.status === 'Pending' || appt.status === 'Confirmed') {
    footerHtml = `<button class="btn btn--danger" onclick="cancelAppt(${id});closeViewModal();">Cancel Appointment</button> ` + footerHtml;
  }
  
  document.getElementById('modalFooter').innerHTML = footerHtml;
  document.getElementById('viewApptModal').classList.add('lc-modal--open');
};

window.closeViewModal = function() {
  document.getElementById('viewApptModal').classList.remove('lc-modal--open');
};

window.joinVideoCall = function(id) {
  const appt = DEMO_APPOINTMENTS.find(a => a.appointment_id === id);
  if (window.LC?.showToast) {
    window.LC.showToast(`Connecting to video room with ${appt ? appt.lawyer_name : 'Lawyer'}... (Demo Placeholder)`, 'success');
  } else {
    alert(`Connecting to video room with ${appt ? appt.lawyer_name : 'Lawyer'}... (Demo Placeholder)`);
  }
};

window.cancelAppt = function(id) {
  const appt = DEMO_APPOINTMENTS.find(a => a.appointment_id === id);
  if (!appt) return;

  if (window.LC?.openConfirmModal) {
    window.LC.openConfirmModal(
      `Are you sure you want to cancel your appointment with ${appt.lawyer_name} on ${appt.date}?`,
      'Cancel Appointment',
      'danger'
    ).then((confirmed) => {
      if (confirmed) {
        appt.status = 'Cancelled';
        if (window.LC?.showToast) {
          window.LC.showToast('Appointment cancelled successfully (demo)', 'info');
        }
        updateKPIs();
        renderTable();
      }
    });
  } else {
    if (confirm(`Cancel appointment #${id}?`)) {
      appt.status = 'Cancelled';
      updateKPIs();
      renderTable();
    }
  }
};

function openBookModal() {
  document.getElementById('bookConsultationModal')?.classList.add('lc-modal--open');
}

function closeBookModal() {
  document.getElementById('bookConsultationModal')?.classList.remove('lc-modal--open');
}

function handleBookSubmit(e) {
  e.preventDefault();
  
  const lawyerVal = document.getElementById('bookLawyer').value;
  const packageVal = document.getElementById('bookPackage').value;
  const dateVal = document.getElementById('bookDate').value;
  const timeVal = document.getElementById('bookTime').value;
  const modeVal = document.getElementById('bookMode').value;
  const notesVal = document.getElementById('bookNotes').value;
  
  const lawyerName = lawyerVal.split(' — ')[0] || lawyerVal.split(' (')[0];
  const barNo = lawyerVal.includes('(') ? lawyerVal.substring(lawyerVal.indexOf('(') + 1, lawyerVal.indexOf(')')) : 'BAR-NEW-001';
  
  const newAppt = {
    appointment_id: DEMO_APPOINTMENTS.length + 1,
    lawyer_name: lawyerName,
    bar_no: barNo,
    date: dateVal,
    start_time: timeVal,
    end_time: '12:00 PM',
    mode: modeVal,
    package_name: packageVal,
    status: 'Pending',
    location: modeVal === 'Online' ? 'Online Video Call' : 'LegalConnect Chambers',
    meeting_link: modeVal === 'Online' ? 'https://meet.legalconnect.lk/room-new-slot' : '',
    notes: notesVal
  };
  
  // // DEMO DATA
  DEMO_APPOINTMENTS.unshift(newAppt);
  
  closeBookModal();
  updateKPIs();
  renderTable();
  
  if (window.LC?.showToast) {
    window.LC.showToast('Consultation request submitted! (Module 5 Backend Pending)', 'success');
  } else {
    alert('Consultation request submitted! (Module 5 Backend Pending)');
  }
}
