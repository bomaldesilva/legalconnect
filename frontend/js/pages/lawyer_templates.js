let templatesList = [];
let currentCat = 'All';
let currentSearch = '';

let LAWYER_ID = null;

document.addEventListener('DOMContentLoaded', async () => {
    initSidebar();
    bindEvents();
    
    try {
        const user = await window.authApi.me();
        LAWYER_ID = user.user_id;
        await fetchTemplates();
    } catch (e) {
        console.error("Auth error:", e);
        if (window.LC?.showToast) window.LC.showToast('Authentication failed', 'error');
    }
});

async function fetchTemplates() {
    try {
        const data = await window.request('/templates');
        
        // Map backend data to frontend model
        templatesList = (data || []).map(t => ({
            id: t.id,
            name: t.name || t.template_name,
            category: t.category || t.template_category || 'General',
            desc: t.description || 'No description provided.',
            status: t.status || 'Active'
        }));
        
        renderKPIs();
        renderGrid();
    } catch (error) {
        console.error('Error fetching templates:', error);
        templatesList = [];
        renderKPIs();
        renderGrid();
        // if (window.LC?.showToast) window.LC.showToast('Failed to load templates', 'error');
    }
}

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
            renderGrid();
        });
    }

    const filterChips = document.getElementById('filterChips');
    if (filterChips) {
        filterChips.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-chip')) {
                document.querySelectorAll('#filterChips .filter-chip').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                currentCat = e.target.dataset.cat;
                renderGrid();
            }
        });
    }
}

function renderKPIs() {
    document.getElementById('kpiTotal').textContent = templatesList.length;
    document.getElementById('kpiActive').textContent = templatesList.filter(t => t.status === 'Active').length;
    document.getElementById('kpiInactive').textContent = templatesList.filter(t => t.status === 'Inactive').length;
}

function renderGrid() {
    const grid = document.getElementById('templatesGrid');
    const emptyState = document.getElementById('emptyState');
    const countEl = document.getElementById('resultsCount');
    
    let filtered = templatesList.filter(t => {
        const matchesCat = currentCat === 'All' || t.category === currentCat;
        const matchesSearch = t.name.toLowerCase().includes(currentSearch) || t.desc.toLowerCase().includes(currentSearch);
        return matchesCat && matchesSearch;
    });

    grid.innerHTML = '';
    countEl.textContent = `(${filtered.length})`;
    
    if (filtered.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';

    filtered.forEach(template => {
        const div = document.createElement('div');
        div.className = 'template-card';
        
        div.innerHTML = `
            <div class="template-card__header">
                <span class="tag tag--navy">${template.category}</span>
                <span class="badge badge--success">${template.status}</span>
            </div>
            <h3 class="template-card__title">${template.name}</h3>
            <p class="template-card__desc">${template.desc}</p>
            <div class="template-card__footer">
                <button class="btn btn--primary btn--sm" style="flex:1;" onclick="useTemplate(${template.id})">Use Template</button>
                <button class="btn btn--secondary btn--sm" onclick="previewTemplate(${template.id})">Preview</button>
            </div>
        `;
        grid.appendChild(div);
    });
}

window.useTemplate = function(id) {
    if(window.LC && window.LC.showToast) {
        window.LC.showToast('Module 8 backend pending. Cannot use template yet.', 'warning');
    }
};

window.previewTemplate = function(id) {
    if(window.LC && window.LC.showToast) {
        window.LC.showToast('Module 8 backend pending. Preview unavailable.', 'info');
    }
};

window.openUploadModal = function() {
    document.getElementById('uploadModal').style.display = 'flex';
};

window.closeUploadModal = function() {
    document.getElementById('uploadModal').style.display = 'none';
};

window.submitUpload = function() {
    const form = document.getElementById('uploadForm');
    if(form.checkValidity()) {
        if(window.LC && window.LC.showToast) {
            window.LC.showToast('Module 8 backend pending. Upload not saved.', 'warning');
        }
        closeUploadModal();
        form.reset();
    } else {
        form.reportValidity();
    }
};
