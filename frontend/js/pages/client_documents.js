/**
 * LegalConnect — Client Document Portal Logic
 * Implements full CRUD (Create, Read, Update, Delete) against the backend API.
 */
'use strict';

// ── Constants & State ─────────────────────────────────────────────────────────
let CLIENT_ID = null;
let documentsData = [];
let activeDocFilter = 'All';
let searchDocQuery = '';

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const user = await window.authApi.me();
    CLIENT_ID = user.user_id;
  } catch(err) {
    window.location.href = 'login.html';
    return;
  }
  
  initDocPage();
});

function initDocPage() {
  setupDocEventListeners();
  setupDropzone();
  loadDocuments();

  // Sidebar toggle
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('sidebar--open');
  });
}

// ── Load Data (READ) ──────────────────────────────────────────────────────────
async function loadDocuments() {
  try {
    documentsData = await window.clientDocumentsApi.list(CLIENT_ID);
    updateDocKPIs();
    renderDocTable();
  } catch (err) {
    console.error(err);
    if (window.LC?.showToast) {
      window.LC.showToast('Failed to load documents.', 'error');
    }
    const tbody = document.getElementById('documentsTableBody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:red;">Error loading documents.</td></tr>`;
    }
  }
}

// ── Rendering & UI Helpers ────────────────────────────────────────────────────
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
  const total = documentsData.length;
  const approved = documentsData.filter(d => d.status === 'Approved').length;
  const reviewed = documentsData.filter(d => d.status === 'Reviewed' || d.status === 'Uploaded').length;

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

  let filtered = documentsData.filter(d => {
    if (activeDocFilter !== 'All') {
      if (activeDocFilter === 'Approved' && d.status !== 'Approved') return false;
      if (activeDocFilter !== 'Approved' && d.category !== activeDocFilter) return false;
    }
    if (searchDocQuery) {
      const q = searchDocQuery.toLowerCase();
      if (!d.file_name.toLowerCase().includes(q) && !(d.category || '').toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  if (resultsCount) resultsCount.textContent = `Showing ${filtered.length} result${filtered.length !== 1 ? 's' : ''}`;

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
        <td style="padding:12px 10px;color:#475569;">${window.LC?.escapeHtml(d.category || 'General')}</td>
        <td style="padding:12px 10px;color:#64748b;font-size:0.8rem;">${d.file_size || 'N/A'}</td>
        <td style="padding:12px 10px;color:#64748b;">${d.upload_date}</td>
        <td style="padding:12px 10px;">${statusHtml}</td>
        <td style="padding:12px 10px;">
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn btn--secondary btn--sm" onclick="openDocModal(${d.doc_id})">View</button>
            <button class="btn btn--secondary btn--sm" onclick="openEditModal(${d.doc_id})">Edit</button>
            <button class="btn btn--secondary btn--sm" onclick="downloadDoc(${d.doc_id}, '${d.file_path}')">📥 Download</button>
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
  
  // Edit Form Submit (UPDATE)
  document.getElementById('saveEditDocBtn')?.addEventListener('click', async () => {
    const docId = document.getElementById('editDocId').value;
    const category = document.getElementById('editDocCategory').value;
    const notes = document.getElementById('editDocNotes').value;
    
    try {
      const btn = document.getElementById('saveEditDocBtn');
      btn.disabled = true;
      btn.textContent = 'Saving...';
      
      await window.clientDocumentsApi.update(docId, { client_id: CLIENT_ID, category, notes });
      
      if (window.LC?.showToast) window.LC.showToast('Document updated successfully', 'success');
      closeEditDocModal();
      await loadDocuments();
    } catch (err) {
      console.error(err);
      if (window.LC?.showToast) window.LC.showToast('Failed to update document', 'error');
    } finally {
      const btn = document.getElementById('saveEditDocBtn');
      btn.disabled = false;
      btn.textContent = 'Save Changes';
    }
  });
}

// ── Create Document ───────────────────────────────────────────────────────────
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

async function handleFilesUpload(files) {
  const file = files[0];
  const progressArea = document.getElementById('uploadProgressArea');
  const progressBar = document.getElementById('uploadProgressBar');
  const statusText = document.getElementById('uploadStatusText');

  if (progressArea) progressArea.style.display = 'block';
  if (statusText) {
    statusText.style.display = 'block';
    statusText.textContent = `Uploading ${file.name}...`;
  }
  
  if (progressBar) progressBar.style.width = '50%';

  try {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('client_id', CLIENT_ID);
    
    // Auto-detect category based on extension for better UX
    const ext = file.name.split('.').pop().toLowerCase();
    const category = ext === 'pdf' ? 'Property Deed' : 'Identity Document';
    formData.append('category', category);

    await window.clientDocumentsApi.upload(formData);
    
    if (progressBar) progressBar.style.width = '100%';
    if (window.LC?.showToast) window.LC.showToast(`Document "${file.name}" uploaded successfully!`, 'success');
    
    setTimeout(() => {
      if (progressArea) progressArea.style.display = 'none';
      if (progressBar) progressBar.style.width = '0%';
    }, 500);

    // Refresh list
    await loadDocuments();
  } catch (err) {
    console.error(err);
    if (window.LC?.showToast) window.LC.showToast(`Upload failed: ${err.message}`, 'error');
    if (progressArea) progressArea.style.display = 'none';
  }
}

// ── View Document (READ Details) ──────────────────────────────────────────────
window.openDocModal = function(id) {
  const doc = documentsData.find(d => d.doc_id === id);
  if (!doc) return;

  const icon = getFileIcon(doc.file_name);
  document.getElementById('docIconLarge').textContent = icon;
  document.getElementById('modalDocTitle').textContent = doc.file_name;
  document.getElementById('modalDocCategoryBadge').innerHTML = `<span class="badge badge--primary">${doc.category || 'General'}</span>`;
  document.getElementById('modalDocSize').textContent = doc.file_size || 'N/A';
  document.getElementById('modalDocDate').textContent = doc.upload_date;
  document.getElementById('modalDocStatus').innerHTML = `<span class="badge ${getStatusBadgeClass(doc.status)}">${doc.status}</span>`;
  document.getElementById('modalDocNotes').textContent = doc.notes || 'No notes available.';

  const footerHtml = `
    <button class="btn btn--danger" onclick="deleteDoc(${id});closeDocModal();">Delete File</button>
    <button class="btn btn--secondary" onclick="openEditModal(${id});closeDocModal();">Edit Details</button>
    <button class="btn btn--secondary" onclick="downloadDoc(${id}, '${doc.file_path}')">📥 Download File</button>
    <button class="btn btn--primary" onclick="closeDocModal()">Close</button>
  `;

  document.getElementById('modalDocFooter').innerHTML = footerHtml;
  document.getElementById('viewDocModal').classList.add('lc-appt-modal--open');
};

window.closeDocModal = function() {
  document.getElementById('viewDocModal').classList.remove('lc-appt-modal--open');
};

// ── Edit Document (UPDATE) ────────────────────────────────────────────────────
window.openEditModal = function(id) {
  const doc = documentsData.find(d => d.doc_id === id);
  if (!doc) return;
  
  document.getElementById('editDocId').value = doc.doc_id;
  document.getElementById('editDocCategory').value = doc.category || 'General';
  document.getElementById('editDocNotes').value = doc.notes || '';
  
  document.getElementById('editDocModal').classList.add('lc-appt-modal--open');
};

window.closeEditDocModal = function() {
  document.getElementById('editDocModal').classList.remove('lc-appt-modal--open');
};

// ── Download Document (Mocked) ────────────────────────────────────────────────
window.downloadDoc = function(id, path) {
  const doc = documentsData.find(d => d.doc_id === id);
  if (window.LC?.showToast) {
    window.LC.showToast(`Downloading "${doc ? doc.file_name : 'document'}"...`, 'info');
  }
};

// ── Delete Document (DELETE) ──────────────────────────────────────────────────
window.deleteDoc = async function(id) {
  const doc = documentsData.find(d => d.doc_id === id);
  if (!doc) return;

  if (window.LC?.openConfirmModal) {
    window.LC.openConfirmModal(
      `Are you sure you want to delete "${doc.file_name}"? This action cannot be undone.`,
      'Delete Document',
      'danger'
    ).then(async (confirmed) => {
      if (confirmed) {
        await executeDelete(id);
      }
    });
  } else {
    if (confirm(`Delete document ${doc.file_name}?`)) {
      await executeDelete(id);
    }
  }
};

async function executeDelete(id) {
  try {
    await window.clientDocumentsApi.delete(id, CLIENT_ID);
    if (window.LC?.showToast) window.LC.showToast('Document deleted', 'success');
    await loadDocuments();
  } catch (err) {
    console.error(err);
    if (window.LC?.showToast) window.LC.showToast('Failed to delete document', 'error');
  }
}
