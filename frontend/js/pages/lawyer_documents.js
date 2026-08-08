let LAWYER_ID = null;
let docsList = [];
let currentFilter = 'All';
let currentSearch = '';
let pendingFiles = [];

document.addEventListener('DOMContentLoaded', async () => {
    initSidebar();
    bindEvents();
    initDropzone();
    
    try {
        const user = await window.authApi.me();
        LAWYER_ID = user.user_id;
        await fetchDocuments();
    } catch (e) {
        console.error("Auth error:", e);
        if (window.LC?.showToast) window.LC.showToast('Authentication failed', 'error');
    }
});

async function fetchDocuments() {
    try {
        const data = await window.request(`/lawyer-documents?lawyer_id=${LAWYER_ID}`);
        
        // Map backend API data to the fields the frontend expects
        docsList = (data || []).map(doc => ({
            id: doc.document_id || doc.id,
            name: doc.file_name || doc.name,
            type: doc.file_type || doc.type || 'Document',
            case: doc.case_title || doc.case_name || 'General',
            uploadedBy: "Me", // Mocked for now since backend doesn't resolve uploader name easily yet
            date: doc.uploaded_at || doc.uploaded,
            status: "Uploaded" // Defaulting since document_status might be null in old records
        }));
        
        renderKPIs();
        renderTable();
    } catch (error) {
        console.error('Error fetching documents:', error);
        docsList = [];
        renderKPIs();
        renderTable();
        // if (window.LC?.showToast) window.LC.showToast('Failed to load documents', 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    bindEvents();
    renderKPIs();
    renderTable();
    initDropzone();
});

function initSidebar() {
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('sidebar--open');
    });
}

function bindEvents() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            renderTable();
        });
    }

    const filterChips = document.getElementById('filterChips');
    if (filterChips) {
        filterChips.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-chip')) {
                document.querySelectorAll('#filterChips .filter-chip').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                currentFilter = e.target.dataset.status;
                renderTable();
            }
        });
    }
}

function renderKPIs() {
    document.getElementById('kpiTotal').textContent = docsList.length;
    document.getElementById('kpiPending').textContent = docsList.filter(d => d.status === 'Pending Review' || d.status === 'Uploaded').length;
    document.getElementById('kpiApproved').textContent = docsList.filter(d => d.status === 'Approved').length;
}

function getFileIcon(type) {
    if (type === 'PDF' || type === 'application/pdf') return '<span style="color:var(--danger)">📄</span>';
    if (type === 'DOCX' || type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return '<span style="color:var(--info)">📝</span>';
    if (type === 'JPG' || type === 'PNG' || type === 'image/jpeg' || type === 'image/png') return '<span style="color:var(--success)">🖼️</span>';
    return '📄';
}

function renderTable() {
    const tbody = document.getElementById('docsTableBody');
    const emptyState = document.getElementById('emptyState');
    
    let filtered = docsList.filter(d => {
        const matchesFilter = currentFilter === 'All' || d.status === currentFilter || (currentFilter === 'Uploaded' && d.status === 'Pending Review');
        const matchesSearch = d.name.toLowerCase().includes(currentSearch) || d.case.toLowerCase().includes(currentSearch);
        return matchesFilter && matchesSearch;
    });

    tbody.innerHTML = '';
    
    if (filtered.length === 0) {
        tbody.parentElement.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    tbody.parentElement.style.display = 'table';
    emptyState.style.display = 'none';

    filtered.forEach((doc, index) => {
        const tr = document.createElement('tr');
        
        let statusClass = 'neutral';
        if (doc.status === 'Approved') statusClass = 'success';
        else if (doc.status === 'Uploaded' || doc.status === 'Pending Review') statusClass = 'warning';
        else if (doc.status === 'Rejected') statusClass = 'danger';

        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <div style="display:flex; align-items:center; gap:8px;">
                    ${getFileIcon(doc.type)}
                    <strong>${window.LC?.escapeHtml(doc.name) || doc.name}</strong>
                </div>
            </td>
            <td><span class="badge badge--neutral">${doc.case}</span></td>
            <td>${doc.uploadedBy}</td>
            <td>${doc.date}</td>
            <td><span class="badge badge--${statusClass}">${doc.status}</span></td>
            <td>
                <button class="btn btn--secondary btn--sm" onclick="window.LC?.showToast('Download preview not available in demo')">View</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function initDropzone() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');

    if(!dropzone) return;

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFiles(e.dataTransfer.files);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            handleFiles(fileInput.files);
        }
    });
}

function handleFiles(files) {
    for(let i=0; i<files.length; i++) {
        pendingFiles.push(files[i]);
    }
    renderPendingFiles();
}

function renderPendingFiles() {
    const container = document.getElementById('pendingFiles');
    container.innerHTML = '';
    
    pendingFiles.forEach((f, idx) => {
        const div = document.createElement('div');
        div.className = 'file-item';
        
        let ext = f.name.split('.').pop().toUpperCase();
        
        div.innerHTML = `
            <div class="file-item__icon">${getFileIcon(ext)}</div>
            <div class="file-item__details">
                <p class="file-item__name">${f.name}</p>
                <p class="file-item__meta">${(f.size/1024).toFixed(1)} KB</p>
            </div>
            <button class="btn btn--secondary btn--sm" onclick="removePendingFile(${idx}); event.stopPropagation();">X</button>
        `;
        container.appendChild(div);
    });
}

window.removePendingFile = function(index) {
    pendingFiles.splice(index, 1);
    renderPendingFiles();
};

window.uploadPendingFiles = async function() {
    if (pendingFiles.length === 0) {
        if(window.LC && window.LC.showToast) window.LC.showToast('Please select files first', 'warning');
        return;
    }
    
    try {
        for (let file of pendingFiles) {
            const formData = new FormData();
            formData.append('document', file);
            formData.append('lawyer_id', LAWYER_ID);
            
            const basePath = window.LEGALCONNECT_API_BASE_URL || `${window.location.origin}/legalconnect/backend/public/api`;
            const response = await fetch(`${basePath}/lawyer-documents`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) throw new Error('Upload failed');
        }
        
        if(window.LC && window.LC.showToast) {
            window.LC.showToast('Documents uploaded successfully', 'success');
        }
        
        pendingFiles = [];
        renderPendingFiles();
        fetchDocuments();
    } catch (err) {
        console.error('Upload Error:', err);
        if(window.LC && window.LC.showToast) {
            window.LC.showToast('Error uploading documents', 'error');
        }
    }
};
