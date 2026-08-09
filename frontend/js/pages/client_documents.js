// LegalConnect Client Document Portal Logic

// DEMO DATA for Client Documents (Module 8 storage backend pending)
const DEMO_DOCUMENTS = [
  {
    doc_id: 1,
    file_name: 'NIC_Copy.pdf',
    category: 'Identity Document',
    file_size: '1.2 MB',
    upload_date: '2026-07-20',
    status: 'Approved',
    file_type: 'pdf',
    notes: 'National Identity Card copy submitted for client identity authentication.'
  },
  {
    doc_id: 2,
    file_name: 'Property_Deed_Kandy.pdf',
    category: 'Property Deed',
    file_size: '4.5 MB',
    upload_date: '2026-07-25',
    status: 'Reviewed',
    file_type: 'pdf',
    notes: 'Land title deed folio extract 482/12 from Kandy District Land Registry.'
  },
  {
    doc_id: 3,
    file_name: 'Legal_Opinion_Draft.docx',
    category: 'Legal Advice',
    file_size: '850 KB',
    upload_date: '2026-07-30',
    status: 'Uploaded',
    file_type: 'docx',
    notes: 'Draft legal opinion note prepared by Demo Lawyer regarding boundary dispute.'
  }
];

let activeDocFilter = 'All';
let searchDocQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  initDocPage();
});

function initDocPage() {
  updateDocKPIs();
  renderDocTable();
  setupDocEventListeners();
  setupDropzone();

  // Sidebar toggle
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('sidebar--open');
  });
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'Approved': return 'badge--success';
    case 'Reviewed': return 'badge--info';
    case 'Uploaded': return 'badge--warning';
    case 'Rejected': return 'badge--danger';
    default: return '';
  }
}

function getFileIcon(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  if (ext === 'pdf') return '📕';
  if (ext === 'doc' || ext === 'docx') return '📘';
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return '🖼️';
  return '📄';
}

function updateDocKPIs() {
  const total = DEMO_DOCUMENTS.length;
  const approved = DEMO_DOCUMENTS.filter(d => d.status === 'Approved').length;
  const reviewed = DEMO_DOCUMENTS.filter(d => d.status === 'Reviewed' || d.status === 'Uploaded').length;

  const totalEl = document.getElementById('kpiTotalDocs');
  const approvedEl = document.getElementById('kpiApprovedDocs');
  const reviewedEl = document.getElementById('kpiReviewedDocs');

  if (totalEl) totalEl.textContent = total;
  if (approvedEl) approvedEl.textContent = approved;
  if (reviewedEl) reviewedEl.textContent = reviewed;
}

function renderDocTable() {
  const tbody = document.getElementById('documentsTableBody');
  const emptyState = document.getElementById('emptyStateDocs');
  const resultsCount = document.getElementById('resultsCountDocs');

  if (!tbody) return;

  let filtered = DEMO_DOCUMENTS.filter(d => {
    if (activeDocFilter !== 'All') {
      if (activeDocFilter === 'Approved' && d.status !== 'Approved') return false;
      if (activeDocFilter !== 'Approved' && d.category !== activeDocFilter) return false;
    }
    if (searchDocQuery) {
      const q = searchDocQuery.toLowerCase();
      if (!d.file_name.toLowerCase().includes(q) && !d.category.toLowerCase().includes(q)) {
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

  tbody.innerHTML = filtered.map(d => {
    const icon = getFileIcon(d.file_name);
    const statusHtml = `<span class="badge ${getStatusBadgeClass(d.status)}">${window.LC?.escapeHtml(d.status) || d.status}</span>`;

    return `
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:12px 10px;font-weight:600;color:var(--navy);">#${d.doc_id}</td>
        <td style="padding:12px 10px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:1.25rem;">${icon}</span>
            <span style="font-weight:600;color:var(--navy);">${window.LC?.escapeHtml(d.file_name)}</span>
          </div>
        </td>
        <td style="padding:12px 10px;color:#475569;">${window.LC?.escapeHtml(d.category)}</td>
        <td style="padding:12px 10px;color:#64748b;font-size:0.8rem;">${d.file_size}</td>
        <td style="padding:12px 10px;color:#64748b;">${d.upload_date}</td>
        <td style="padding:12px 10px;">${statusHtml}</td>
        <td style="padding:12px 10px;">
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn btn--secondary btn--sm" onclick="openDocModal(${d.doc_id})">View</button>
            <button class="btn btn--secondary btn--sm" onclick="downloadDoc(${d.doc_id})">📥 Download</button>
            <button class="btn btn--danger btn--sm" onclick="deleteDoc(${d.doc_id})">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function setupDocEventListeners() {
  const chips = document.querySelectorAll('.filter-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      chips.forEach(c => c.classList.remove('filter-chip--active'));
      e.target.classList.add('filter-chip--active');
      activeDocFilter = e.target.getAttribute('data-filter');
      renderDocTable();
    });
  });

  const searchInput = document.getElementById('searchDocsInput');
  searchInput?.addEventListener('input', (e) => {
    searchDocQuery = e.target.value;
    renderDocTable();
  });

  document.getElementById('closeDocModalBtn')?.addEventListener('click', closeDocModal);
}

function setupDropzone() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') {
      fileInput.click();
    }
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('drag-over');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('drag-over');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleFilesUpload(files);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFilesUpload(e.target.files);
    }
  });
}

function handleFilesUpload(files) {
  const progressArea = document.getElementById('uploadProgressArea');
  const progressBar = document.getElementById('uploadProgressBar');
  const statusText = document.getElementById('uploadStatusText');

  if (progressArea) progressArea.style.display = 'block';
  if (statusText) {
    statusText.style.display = 'block';
    statusText.textContent = `Uploading ${files[0].name}... (UI demonstration)`;
  }

  let progress = 0;
  const interval = setInterval(() => {
    progress += 25;
    if (progressBar) progressBar.style.width = `${progress}%`;

    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        if (progressArea) progressArea.style.display = 'none';
        if (statusText) statusText.style.display = 'none';
        if (progressBar) progressBar.style.width = '0%';

        // Add demo document to array
        const fileName = files[0].name;
        const ext = fileName.split('.').pop().toLowerCase();
        const category = ext === 'pdf' ? 'Property Deed' : 'Identity Document';
        
        const newDoc = {
          doc_id: DEMO_DOCUMENTS.length + 1,
          file_name: fileName,
          category: category,
          file_size: `${(files[0].size / (1024 * 1024)).toFixed(1)} MB`,
          upload_date: new Date().toISOString().split('T')[0],
          status: 'Uploaded',
          file_type: ext,
          notes: 'Uploaded by client via drag-and-drop portal.'
        };

        // // DEMO DATA
        DEMO_DOCUMENTS.unshift(newDoc);
        updateDocKPIs();
        renderDocTable();

        if (window.LC?.showToast) {
          window.LC.showToast(`Document "${fileName}" uploaded successfully! (UI demonstration)`, 'success');
        } else {
          alert(`Document "${fileName}" uploaded successfully! (UI demonstration)`);
        }
      }, 400);
    }
  }, 150);
}

window.openDocModal = function(id) {
  const doc = DEMO_DOCUMENTS.find(d => d.doc_id === id);
  if (!doc) return;

  const icon = getFileIcon(doc.file_name);
  document.getElementById('docIconLarge').textContent = icon;
  document.getElementById('modalDocTitle').textContent = doc.file_name;
  document.getElementById('modalDocCategoryBadge').innerHTML = `<span class="badge badge--primary">${doc.category}</span>`;
  document.getElementById('modalDocSize').textContent = doc.file_size;
  document.getElementById('modalDocDate').textContent = doc.upload_date;
  document.getElementById('modalDocStatus').innerHTML = `<span class="badge ${getStatusBadgeClass(doc.status)}">${doc.status}</span>`;
  document.getElementById('modalDocNotes').textContent = doc.notes || 'No notes available.';

  const footerHtml = `
    <button class="btn btn--danger" onclick="deleteDoc(${id});closeDocModal();">Delete File</button>
    <button class="btn btn--secondary" onclick="downloadDoc(${id})">📥 Download File</button>
    <button class="btn btn--primary" onclick="closeDocModal()">Close</button>
  `;

  document.getElementById('modalDocFooter').innerHTML = footerHtml;
  document.getElementById('viewDocModal').classList.add('lc-appt-modal--open');
};

window.closeDocModal = function() {
  document.getElementById('viewDocModal').classList.remove('lc-appt-modal--open');
};

window.downloadDoc = function(id) {
  const doc = DEMO_DOCUMENTS.find(d => d.doc_id === id);
  if (window.LC?.showToast) {
    window.LC.showToast(`Downloading "${doc ? doc.file_name : 'document'}"... (Demo Placeholder)`, 'info');
  } else {
    alert(`Downloading "${doc ? doc.file_name : 'document'}"... (Demo Placeholder)`);
  }
};

window.deleteDoc = function(id) {
  const doc = DEMO_DOCUMENTS.find(d => d.doc_id === id);
  if (!doc) return;

  if (window.LC?.openConfirmModal) {
    window.LC.openConfirmModal(
      `Are you sure you want to delete "${doc.file_name}"? This action cannot be undone.`,
      'Delete Document',
      'danger'
    ).then((confirmed) => {
      if (confirmed) {
        const index = DEMO_DOCUMENTS.findIndex(d => d.doc_id === id);
        if (index !== -1) {
          DEMO_DOCUMENTS.splice(index, 1);
          if (window.LC?.showToast) {
            window.LC.showToast('Document deleted (demo)', 'info');
          }
          updateDocKPIs();
          renderDocTable();
        }
      }
    });
  } else {
    if (confirm(`Delete document ${doc.file_name}?`)) {
      const index = DEMO_DOCUMENTS.findIndex(d => d.doc_id === id);
      if (index !== -1) {
        DEMO_DOCUMENTS.splice(index, 1);
        updateDocKPIs();
        renderDocTable();
      }
    }
  }
};
