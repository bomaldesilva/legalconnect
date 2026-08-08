const LAWYER_ID = window.LC?.currentUser?.id || 2;
let casesList = [];
let currentFilter = 'All';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
    // Sidebar toggle
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('sidebar--open');
    });

    initCategories();
    setupEventListeners();
    fetchCases();
});

async function fetchCases() {
    try {
        const response = await fetch(`/api/lawyer-cases?lawyer_id=${LAWYER_ID}`);
        if (!response.ok) throw new Error('Failed to fetch cases');
        const data = await response.json();
        casesList = data;
        renderKPIs();
        renderTable();
    } catch (error) {
        console.error('Error fetching cases:', error);
        if (window.LC?.showToast) window.LC.showToast('Failed to load cases', 'error');
    }
}

function setupEventListeners() {
    // Filter chips
    const chips = document.querySelectorAll('.filter-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            chips.forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderTable();
        });
    });

    // Search
    document.getElementById('searchBox')?.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderTable();
    });

    // Modals
    document.getElementById('btnNewCase')?.addEventListener('click', openAddCaseModal);
    document.getElementById('closeAddCaseModal')?.addEventListener('click', closeAddCaseModal);
    document.getElementById('btnCancelAdd')?.addEventListener('click', closeAddCaseModal);
    document.getElementById('addCaseForm')?.addEventListener('submit', handleAddCase);

    // Slide Panel
    document.getElementById('closeCaseDetail')?.addEventListener('click', closeCaseDetail);
}

function initCategories() {
    const select = document.getElementById('caseCategory');
    if (!select) return;
    
    // Simulate API fetch or use window.legalCategories if available
    const categories = window.legalCategories || [
        { id: 1, name: 'Family Law' },
        { id: 2, name: 'Property Law' },
        { id: 3, name: 'Labour Law' },
        { id: 4, name: 'Criminal Law' }
    ];
    
    select.innerHTML = '<option value="">Select Category...</option>';
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.name;
        opt.textContent = cat.name;
        select.appendChild(opt);
    });

    // Default open date to today
    const dateInput = document.getElementById('caseOpenDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
}

function renderKPIs() {
    let open = 0, inProg = 0, closed = 0, archived = 0;
    casesList.forEach(c => {
        if (c.status === 'Open') open++;
        else if (c.status === 'InProgress') inProg++;
        else if (c.status === 'Closed') closed++;
        else if (c.status === 'Archived') archived++;
    });

    document.getElementById('kpiOpen').textContent = open;
    document.getElementById('kpiInProgress').textContent = inProg;
    document.getElementById('kpiClosed').textContent = closed;
    document.getElementById('kpiArchived').textContent = archived;
}

function getStatusBadge(status) {
    const colorMap = {
        'Open': 'teal',
        'InProgress': 'warning',
        'Closed': 'navy',
        'Archived': 'muted'
    };
    const c = colorMap[status] || 'navy';
    const text = status === 'InProgress' ? 'In Progress' : status;
    return window.LC?.badge ? window.LC.badge(text, c) : `<span class="badge badge--${c}">${text}</span>`;
}

function getOutcomeBadge(outcome) {
    const colorMap = {
        'Won': 'success',
        'Lost': 'danger',
        'Settled': 'info',
        'Withdrawn': 'muted',
        'Pending': 'warning'
    };
    const c = colorMap[outcome] || 'navy';
    return window.LC?.badge ? window.LC.badge(outcome, c) : `<span class="badge badge--${c}">${outcome}</span>`;
}

function renderTable() {
    const tbody = document.getElementById('casesTableBody');
    if (!tbody) return;

    let filtered = casesList.filter(c => {
        const matchFilter = currentFilter === 'All' || c.status === currentFilter;
        const matchSearch = c.case_title.toLowerCase().includes(searchQuery) || 
                            c.client.toLowerCase().includes(searchQuery) ||
                            (c.category && c.category.toLowerCase().includes(searchQuery));
        return matchFilter && matchSearch;
    });

    document.getElementById('resultsCount').textContent = `${filtered.length} results`;

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        document.getElementById('emptyState').style.display = 'block';
        return;
    }

    document.getElementById('emptyState').style.display = 'none';
    
    let html = '';
    filtered.forEach(c => {
        html += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px;">${c.case_id}</td>
                <td style="padding: 12px; font-weight: 500;">${c.case_title}</td>
                <td style="padding: 12px;">${c.category || 'N/A'}</td>
                <td style="padding: 12px;">${c.client}</td>
                <td style="padding: 12px;">${getStatusBadge(c.status)}</td>
                <td style="padding: 12px;">${getOutcomeBadge(c.outcome)}</td>
                <td style="padding: 12px;">${c.open_date}</td>
                <td style="padding: 12px;">
                    <button class="btn btn--secondary" style="padding: 4px 8px; font-size: 12px;" onclick="openCaseDetail(${c.case_id})">View</button>
                    ${c.status !== 'Closed' && c.status !== 'Archived' ? `<button class="btn btn--secondary" style="padding: 4px 8px; font-size: 12px;" onclick="closeCasePrompt(${c.case_id})">Close</button>` : ''}
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

function openAddCaseModal() {
    document.getElementById('addCaseModal').classList.add('modal--open');
}

function closeAddCaseModal() {
    document.getElementById('addCaseModal').classList.remove('modal--open');
    document.getElementById('addCaseForm').reset();
}

function handleAddCase(e) {
    e.preventDefault();
    if (window.LC?.showToast) {
        window.LC.showToast('Module 7 backend pending. Case not saved.', 'info');
    } else {
        alert('Module 7 backend pending. Case not saved.');
    }
    closeAddCaseModal();
}

function openCaseDetail(id) {
    const caseData = casesList.find(c => c.case_id === id);
    if (!caseData) return;

    const panel = document.getElementById('caseDetailPanel');
    const content = document.getElementById('detailContent');
    
    content.innerHTML = `
        <div style="margin-bottom: 16px;">
            <h4 style="margin:0 0 8px 0; font-size:1.2rem;">${caseData.case_title}</h4>
            <div style="display:flex; gap:8px; margin-bottom: 16px;">
                <span class="tag">${caseData.category}</span>
                ${getStatusBadge(caseData.status)}
                ${getOutcomeBadge(caseData.outcome)}
            </div>
            <p><strong>Client:</strong> ${caseData.client}</p>
            <p><strong>Open Date:</strong> ${caseData.open_date}</p>
        </div>
        <div class="panel" style="padding:16px; margin-bottom:16px;">
            <p style="font-weight:600; margin-bottom:8px;">Description</p>
            <p style="color:#444; font-size:0.95rem; line-height:1.5;">${caseData.description}</p>
        </div>
        <div class="panel" style="padding:16px; margin-bottom:16px;">
            <p style="font-weight:600; margin-bottom:16px;">Timeline & Notes</p>
            <div class="timeline" style="border-left: 2px solid #eee; padding-left: 16px; margin-left: 8px;">
                <!-- Demo Notes -->
                <div style="position: relative; margin-bottom: 16px;">
                    <div style="position: absolute; left: -21px; top: 0; width: 10px; height: 10px; border-radius: 50%; background: var(--teal);"></div>
                    <div style="font-size: 0.85rem; color: #666; margin-bottom: 4px;">Yesterday</div>
                    <div style="background: #f9f9f9; padding: 8px 12px; border-radius: 4px; font-size: 0.95rem;">Client provided requested documents.</div>
                </div>
                <div style="position: relative;">
                    <div style="position: absolute; left: -21px; top: 0; width: 10px; height: 10px; border-radius: 50%; background: #ccc;"></div>
                    <div style="font-size: 0.85rem; color: #666; margin-bottom: 4px;">${caseData.open_date}</div>
                    <div style="background: #f9f9f9; padding: 8px 12px; border-radius: 4px; font-size: 0.95rem;">Case opened. Initial consultation completed.</div>
                </div>
            </div>
        </div>
        <div class="panel" style="padding:16px; margin-bottom:16px;">
            <p style="font-weight:600; margin-bottom:12px;">Documents</p>
            <div class="file-item" style="display:flex; align-items:center; gap:12px; padding:8px; border:1px solid #eee; border-radius:4px;">
                <span style="font-size:1.5rem;">📄</span>
                <div style="flex:1;">
                    <div style="font-size:0.9rem; font-weight:500;">Initial_Filing.pdf</div>
                    <div style="font-size:0.8rem; color:#666;">2.4 MB</div>
                </div>
                <button class="btn btn--secondary" style="padding:4px 8px;">View</button>
            </div>
        </div>
        <div style="display:flex; gap:12px; margin-top: auto;">
            <button class="btn btn--primary" style="flex:1;">Edit Case</button>
            <button class="btn btn--secondary" style="flex:1;" onclick="closeCaseDetail()">Close</button>
        </div>
    `;

    panel.classList.add('slide-panel--open');
}

function closeCaseDetail() {
    document.getElementById('caseDetailPanel').classList.remove('slide-panel--open');
}

window.openCaseDetail = openCaseDetail;

function closeCasePrompt(id) {
    if (window.LC?.openConfirmModal) {
        window.LC.openConfirmModal('Are you sure you want to close this case?', () => {
            closeCaseAPI(id);
        });
    } else {
        if (confirm('Are you sure you want to close this case?')) {
            closeCaseAPI(id);
        }
    }
}

async function closeCaseAPI(id) {
    try {
        const response = await fetch(`/api/lawyer-cases/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'close' })
        });
        
        if (!response.ok) throw new Error('Failed to close case');
        
        if (window.LC?.showToast) window.LC.showToast('Case closed successfully.', 'success');
        fetchCases();
    } catch (error) {
        console.error('Error closing case:', error);
        if (window.LC?.showToast) window.LC.showToast('Failed to close case', 'error');
    }
}
window.closeCasePrompt = closeCasePrompt;
