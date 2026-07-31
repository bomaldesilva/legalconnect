// DEMO DATA
const DEMO_TEMPLATES = [
    {
        id: 1,
        name: "Divorce Petition Form",
        category: "Family Law",
        desc: "Standard form for initiating divorce proceedings with necessary disclaimers and information fields.",
        status: "Active"
    },
    {
        id: 2,
        name: "Child Custody Agreement",
        category: "Family Law",
        desc: "Agreement template detailing joint or sole custody arrangements and visitation schedules.",
        status: "Active"
    },
    {
        id: 3,
        name: "Land Deed Transfer",
        category: "Property Law",
        desc: "Official deed transfer document for changing property ownership between parties.",
        status: "Active"
    },
    {
        id: 4,
        name: "Property Sale Agreement",
        category: "Property Law",
        desc: "Binding agreement for the sale of residential or commercial properties.",
        status: "Active"
    },
    {
        id: 5,
        name: "Bail Application",
        category: "Criminal Law",
        desc: "Standard application format for requesting bail in magistrate or high courts.",
        status: "Active"
    },
    {
        id: 6,
        name: "Employment Contract",
        category: "Labour Law",
        desc: "General employment agreement covering terms, conditions, and non-disclosure clauses.",
        status: "Active"
    }
];

let currentCat = 'All';
let currentSearch = '';

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    bindEvents();
    renderKPIs();
    renderGrid();
    
    // In a real app, we would load categories from API
    // loadCategories();
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
    document.getElementById('kpiTotal').textContent = DEMO_TEMPLATES.length;
    document.getElementById('kpiActive').textContent = DEMO_TEMPLATES.filter(t => t.status === 'Active').length;
    document.getElementById('kpiInactive').textContent = DEMO_TEMPLATES.filter(t => t.status === 'Inactive').length;
}

function renderGrid() {
    const grid = document.getElementById('templatesGrid');
    const emptyState = document.getElementById('emptyState');
    const countEl = document.getElementById('resultsCount');
    
    let filtered = DEMO_TEMPLATES.filter(t => {
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
