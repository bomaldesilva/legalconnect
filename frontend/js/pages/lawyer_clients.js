// DEMO DATA
const DEMO_CLIENTS = [
    {
        id: 1,
        name: "Demo Client",
        email: "client@legalconnect.lk",
        cases: 2,
        since: "2026-07-30",
        status: "Active"
    },
    {
        id: 2,
        name: "Nimal Perera",
        email: "nimal@example.com",
        cases: 1,
        since: "2026-06-15",
        status: "Active"
    },
    {
        id: 3,
        name: "Kamala Fernando",
        email: "kamala@example.com",
        cases: 3,
        since: "2026-04-01",
        status: "Closed"
    }
];

let currentFilter = 'All';
let currentSearch = '';

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    bindEvents();
    renderKPIs();
    renderTable();
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
    document.getElementById('kpiTotal').textContent = DEMO_CLIENTS.length;
    document.getElementById('kpiActive').textContent = DEMO_CLIENTS.filter(c => c.status === 'Active').length;
    document.getElementById('kpiClosed').textContent = DEMO_CLIENTS.filter(c => c.status === 'Closed').length;
}

function renderTable() {
    const tbody = document.getElementById('clientsTableBody');
    const emptyState = document.getElementById('emptyState');
    
    let filtered = DEMO_CLIENTS.filter(c => {
        const matchesFilter = currentFilter === 'All' || c.status === currentFilter;
        const matchesSearch = c.name.toLowerCase().includes(currentSearch) || c.email.toLowerCase().includes(currentSearch);
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

    filtered.forEach((client, index) => {
        const tr = document.createElement('tr');
        
        let statusClass = client.status === 'Active' ? 'success' : 'neutral';

        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <div style="display:flex; align-items:center; gap:12px;">
                    <div class="avatar avatar--sm avatar--navy">${client.name.charAt(0)}</div>
                    <strong>${window.LC?.escapeHtml(client.name) || client.name}</strong>
                </div>
            </td>
            <td>${window.LC?.escapeHtml(client.email) || client.email}</td>
            <td>${client.cases} case${client.cases > 1 ? 's' : ''}</td>
            <td>${client.since}</td>
            <td><span class="badge badge--${statusClass}">${client.status}</span></td>
            <td>
                <button class="btn btn--secondary btn--sm" onclick="openViewClient(${client.id})">View</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openViewClient(id) {
    const client = DEMO_CLIENTS.find(c => c.id === id);
    if (!client) return;

    const modalBody = document.getElementById('clientModalBody');
    let statusClass = client.status === 'Active' ? 'success' : 'neutral';

    modalBody.innerHTML = `
        <div style="display:flex; align-items:center; gap:16px; margin-bottom: 24px;">
            <div class="avatar avatar--lg avatar--navy">${client.name.charAt(0)}</div>
            <div>
                <h3 style="margin:0;">${client.name}</h3>
                <p style="margin:4px 0 0; color:var(--text-light);">${client.email}</p>
                <div style="margin-top:8px;"><span class="badge badge--${statusClass}">${client.status}</span></div>
            </div>
        </div>
        
        <h4>Case Overview</h4>
        <div class="detail-row" style="margin-bottom:16px;">
            <span class="detail-label">Total Cases</span>
            <span class="detail-value">${client.cases}</span>
        </div>
        <div class="detail-row" style="margin-bottom:16px;">
            <span class="detail-label">Relationship Since</span>
            <span class="detail-value">${client.since}</span>
        </div>

        <h4>Recent Appointments</h4>
        <div class="timeline" style="margin-top:12px;">
            <div class="timeline-item">
                <p style="margin:0;"><strong>Consultation</strong> · 2026-07-28</p>
                <p style="margin:4px 0 0; font-size:13px; color:var(--text-light);">Completed successfully.</p>
            </div>
        </div>
    `;

    document.getElementById('viewClientModal').style.display = 'flex';
}

function closeViewClient() {
    document.getElementById('viewClientModal').style.display = 'none';
}

window.openViewClient = openViewClient;
window.closeViewClient = closeViewClient;
