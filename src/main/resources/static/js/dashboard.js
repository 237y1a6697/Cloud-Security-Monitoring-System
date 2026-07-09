/**
 * SentinelCore SecureOps — Dashboard Controller
 * Handles: session guard, sidebar nav, CRUD for assets, stats, filters, toast
 */

const API = '/api/assets';

/* ------------------------------------------------------------------ */
/*  SESSION GUARD                                                       */
/* ------------------------------------------------------------------ */
const rawSession = localStorage.getItem('sentinel_session');
if (!rawSession) {
    window.location.href = '/';
    throw new Error('No session — redirect to login');
}
const session = JSON.parse(rawSession);

/* ------------------------------------------------------------------ */
/*  DOM READY                                                           */
/* ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {

    /* ── Populate user info ── */
    const displayNameEl = document.getElementById('userDisplayName');
    const roleBadgeEl = document.getElementById('userRoleBadge');
    if (displayNameEl) displayNameEl.textContent = `Op: ${(session.displayName || session.username || 'Operator').toUpperCase()}`;
    if (roleBadgeEl) roleBadgeEl.textContent = session.role || 'USER';

    /* ── Show app ── */
    const appBody = document.getElementById('appBody');
    if (appBody) appBody.style.display = '';

    /* ── Logout ── */
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('sentinel_session');
            window.location.href = '/';
        });
    }

    /* ── Sidebar navigation ── */
    initSidebarNav();

    /* ── PDF Export Button Binding ── */
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', e => {
            e.preventDefault();
            exportToPDF();
        });
    }

    /* ── Load initial page data ── */
    const activePage = document.querySelector('.page-section.active');
    if (activePage) handlePageLoad(activePage.id);
});

/* ------------------------------------------------------------------ */
/*  SIDEBAR NAVIGATION                                                  */
/* ------------------------------------------------------------------ */
function initSidebarNav() {
    const navLinks = document.querySelectorAll('.nav-link[data-page]');
    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const targetPageId = link.getAttribute('data-page');
            switchPage(targetPageId);
        });
    });
}

function switchPage(pageId) {
    /* Hide all pages */
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    /* Show target */
    const target = document.getElementById(pageId);
    if (target) target.classList.add('active');

    /* Update sidebar active state */
    document.querySelectorAll('.nav-item').forEach(li => li.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
    if (activeLink) activeLink.closest('.nav-item').classList.add('active');

    /* Load data for the page */
    handlePageLoad(pageId);
}

function handlePageLoad(pageId) {
    if (pageId === 'page-dashboard') loadDashboardStats();
    if (pageId === 'page-assets') loadAssets();
}

/* ------------------------------------------------------------------ */
/*  UTILS                                                               */
/* ------------------------------------------------------------------ */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `show ${type}`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.className = ''; }, 3200);
}

function statusBadgeClass(status) {
    if (!status) return 'badge-info';
    const s = status.toLowerCase();
    if (s === 'critical') return 'badge-critical';
    if (s === 'warning') return 'badge-warning';
    if (s === 'healthy') return 'badge-info';    /* re-use info colour for Healthy */
    return 'badge-info';
}

function miniBarClass(pct) {
    if (pct >= 80) return 'mini-red';
    if (pct >= 60) return 'mini-orange';
    return 'mini-green';
}

function miniBar(pct) {
    const p = Math.min(100, Math.max(0, Number(pct) || 0));
    return `<span class="mini-bar-wrap"><span class="mini-bar ${miniBarClass(p)}" style="width:${p}%"></span></span>${p}%`;
}

function setProgress(barId, valueId, value) {
    const pct = Math.round(value);
    const bar = document.getElementById(barId);
    const label = document.getElementById(valueId);
    if (!bar || !label) return;
    label.textContent = pct + '%';
    bar.style.width = pct + '%';
    bar.className = 'progress-bar-fill ' + (pct >= 80 ? 'danger' : pct >= 60 ? 'warning' : 'normal');
}

/* ------------------------------------------------------------------ */
/*  DASHBOARD STATS                                                     */
/* ------------------------------------------------------------------ */
async function loadDashboardStats() {
    try {
        const res = await fetch(API);
        const assets = await res.json();

        const total = assets.length;
        const healthy = assets.filter(a => a.status === 'Healthy').length;
        const warning = assets.filter(a => a.status === 'Warning').length;
        const critical = assets.filter(a => a.status === 'Critical').length;
        const issues = warning + critical;

        /* Stat cards */
        setText('db-total', total);
        setText('db-healthy', healthy);
        setText('db-issues', issues);

        /* Infrastructure health row */
        setText('inf-total', total);
        setText('inf-healthy', healthy);
        setText('inf-warning', warning);
        setText('inf-critical', critical);

        /* Progress bars (averages) */
        if (total > 0) {
            const avg = key => Math.round(assets.reduce((s, a) => s + (Number(a[key]) || 0), 0) / total);
            setTimeout(() => {
                setProgress('metric-cpu-bar', 'metric-cpu-value', avg('cpuUsage'));
                setProgress('metric-memory-bar', 'metric-memory-value', avg('memoryUsage'));
                setProgress('metric-disk-bar', 'metric-disk-value', avg('diskUsage'));
                setProgress('metric-network-bar', 'metric-network-value', avg('networkUsage'));
            }, 100);
        }
    } catch (err) {
        console.error('Dashboard stats error:', err);
    }
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

/* ------------------------------------------------------------------ */
/*  ASSETS CRUD                                                         */
/* ------------------------------------------------------------------ */

/* --- Global cache for filters --- */
let _allAssets = [];

async function loadAssets() {
    try {
        const res = await fetch(API);
        _allAssets = await res.json();
        renderAssetsTable(_allAssets);
        updateAssetSummaryCards(_allAssets);
    } catch (err) {
        console.error('Load assets error:', err);
        const tb = document.getElementById('assetsTbody');
        if (tb) tb.innerHTML = '<tr class="loading-row"><td colspan="11">Failed to load assets. Is the backend running?</td></tr>';
    }
}

function updateAssetSummaryCards(assets) {
    const healthy = assets.filter(a => a.status === 'Healthy').length;
    const warning = assets.filter(a => a.status === 'Warning').length;
    const critical = assets.filter(a => a.status === 'Critical').length;
    setText('as-total', assets.length);
    setText('as-healthy', healthy);
    setText('as-warning', warning);
    setText('as-critical', critical);
}

function renderAssetsTable(assets) {
    const tbody = document.getElementById('assetsTbody');
    if (!tbody) return;

    if (!assets.length) {
        tbody.innerHTML = '<tr class="loading-row"><td colspan="11">No assets found.</td></tr>';
        return;
    }

    tbody.innerHTML = assets.map(a => `
    <tr>
      <td>${a.id}</td>
      <td><strong>${escHtml(a.assetName || '—')}</strong></td>
      <td>${escHtml(a.assetType || '—')}</td>
      <td><span class="badge ${statusBadgeClass(a.status)}">${escHtml(a.status || '—')}</span></td>
      <td>${miniBar(a.cpuUsage)}</td>
      <td>${miniBar(a.memoryUsage)}</td>
      <td>${miniBar(a.diskUsage)}</td>
      <td>${miniBar(a.networkUsage)}</td>
      <td>${a.uptime != null ? Number(a.uptime).toFixed(1) : '—'}</td>
      <td>${escHtml(a.location || '—')}</td>
      <td>
        <button class="tbl-action tbl-edit"   onclick="openEditModal(${a.id})">Edit</button>
        <button class="tbl-action tbl-delete" onclick="deleteAsset(${a.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/* Client-side filter (no extra API calls) */
function filterAssets() {
    const search = (document.getElementById('assetSearch')?.value || '').toLowerCase();
    const status = (document.getElementById('assetStatusFilter')?.value || '').toLowerCase();
    const type = (document.getElementById('assetTypeFilter')?.value || '').toLowerCase();

    const filtered = _allAssets.filter(a => {
        const matchName = !search || (a.assetName || '').toLowerCase().includes(search);
        const matchStatus = !status || (a.status || '').toLowerCase() === status;
        const matchType = !type || (a.assetType || '').toLowerCase() === type;
        return matchName && matchStatus && matchType;
    });

    renderAssetsTable(filtered);
}

/* ------------------------------------------------------------------ */
/*  MODAL — ADD / EDIT                                                  */
/* ------------------------------------------------------------------ */
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Asset';
    document.getElementById('modalAssetId').value = '';
    document.getElementById('m-assetName').value = '';
    document.getElementById('m-assetType').value = '';
    document.getElementById('m-status').value = '';
    document.getElementById('m-cpu').value = '';
    document.getElementById('m-memory').value = '';
    document.getElementById('m-disk').value = '';
    document.getElementById('m-network').value = '';
    document.getElementById('m-uptime').value = '';
    document.getElementById('m-location').value = '';
    document.getElementById('assetModal').classList.add('open');
}

function openEditModal(id) {
    const asset = _allAssets.find(a => a.id === id);
    if (!asset) { showToast('Asset not found.', 'error'); return; }

    document.getElementById('modalTitle').textContent = 'Edit Asset';
    document.getElementById('modalAssetId').value = asset.id;
    document.getElementById('m-assetName').value = asset.assetName || '';
    document.getElementById('m-assetType').value = asset.assetType || '';
    document.getElementById('m-status').value = asset.status || '';
    document.getElementById('m-cpu').value = asset.cpuUsage ?? '';
    document.getElementById('m-memory').value = asset.memoryUsage ?? '';
    document.getElementById('m-disk').value = asset.diskUsage ?? '';
    document.getElementById('m-network').value = asset.networkUsage ?? '';
    document.getElementById('m-uptime').value = asset.uptime ?? '';
    document.getElementById('m-location').value = asset.location || '';
    document.getElementById('assetModal').classList.add('open');
}

function closeModal() {
    document.getElementById('assetModal').classList.remove('open');
}

/* Close modal when clicking overlay background */
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('assetModal');
    if (overlay) {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) closeModal();
        });
    }
});

async function saveAsset() {
    const idVal = document.getElementById('modalAssetId').value;
    const name = document.getElementById('m-assetName').value.trim();
    const type = document.getElementById('m-assetType').value;
    const stat = document.getElementById('m-status').value;

    if (!name || !type || !stat) {
        showToast('Please fill in Name, Type and Status.', 'error');
        return;
    }

    const payload = {
        assetName: name,
        assetType: type,
        status: stat,
        cpuUsage: Number(document.getElementById('m-cpu').value) || 0,
        memoryUsage: Number(document.getElementById('m-memory').value) || 0,
        diskUsage: Number(document.getElementById('m-disk').value) || 0,
        networkUsage: Number(document.getElementById('m-network').value) || 0,
        uptime: parseFloat(document.getElementById('m-uptime').value) || 0,
        location: document.getElementById('m-location').value.trim()
    };

    try {
        const isEdit = !!idVal;
        const url = isEdit ? `${API}/${idVal}` : API;
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(await res.text());

        closeModal();
        showToast(isEdit ? 'Asset updated successfully.' : 'Asset added successfully.');
        await loadAssets();

        /* Also refresh dashboard stats if dashboard tab is active */
        if (document.getElementById('page-dashboard')?.classList.contains('active')) {
            loadDashboardStats();
        }
    } catch (err) {
        showToast('Error saving asset: ' + err.message, 'error');
        console.error(err);
    }
}

async function deleteAsset(id) {
    if (!confirm('Delete this asset? This cannot be undone.')) return;

    try {
        const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(await res.text());
        showToast('Asset deleted.');
        await loadAssets();
    } catch (err) {
        showToast('Error deleting asset: ' + err.message, 'error');
        console.error(err);
    }
}

/* ------------------------------------------------------------------ */
/*  PDF EXPORT CONTROLLER                                               */
/* ------------------------------------------------------------------ */
function exportToPDF() {
    const activeSection = document.querySelector('.page-section.active');
    if (!activeSection) {
        showToast('No active portal view to export.', 'error');
        return;
    }

    showToast('Generating Vector PDF Audit Report...', 'info');

    const opt = {
        margin: [12, 12, 12, 12],
        filename: `SentinelCore_SecureOps_${activeSection.id}_Report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(activeSection).save().then(() => {
            showToast('PDF Exported Successfully.');
        }).catch(err => {
            console.error('PDF Exporting Error:', err);
            showToast('PDF compilation failed. Triggering default print...', 'error');
            window.print();
        });
    } else {
        showToast('PDF Service unavailable. Opening system print dialog...', 'warning');
        window.print();
    }
}

window.exportToPDF = exportToPDF;

