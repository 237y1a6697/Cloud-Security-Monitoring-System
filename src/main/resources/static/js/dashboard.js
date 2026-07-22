/**
 * SentinelCore SecureOps — Dashboard Controller
 * Handles: session guard, sidebar nav, CRUD for assets, stats, filters, toast
 */

const API = '/api/assets';

/* ------------------------------------------------------------------ */
/*  DOM READY                                                           */
/* ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {

    /* ── Populate user info ── */
    const displayNameEl = document.getElementById('userDisplayName');
    const roleBadgeEl = document.getElementById('userRoleBadge');
    if (displayNameEl && window.CURRENT_USER) {
        displayNameEl.textContent = `Op: ${window.CURRENT_USER.toUpperCase()}`;
    }
    if (roleBadgeEl && window.USER_PERMISSIONS) {
        roleBadgeEl.textContent = window.USER_PERMISSIONS.join(', ');
    }

    /* ── Show app ── */
    const appBody = document.getElementById('appBody');
    if (appBody) appBody.style.display = '';

    /* ── Logout ── */
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('sentinel_session');
        });
    }

    /* ── Sidebar navigation ── */
    initSidebarNav();

    /* ── Sidebar Toggle ── */
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const appSidebar = document.getElementById('appSidebar');
    if (sidebarToggleBtn && appSidebar) {
        sidebarToggleBtn.addEventListener('click', () => {
            appSidebar.classList.toggle('collapsed');
        });
    }

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

    if (pageId === 'page-dashboard') {
        loadDashboardStats();
    }

    if (pageId === 'page-assets') {
        loadAssets();
    }

    if (pageId === 'page-incidents') {
        loadIncidents();
    }

    if (pageId === 'page-audit') {
        loadAuditLogs();
    }

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
/*  SYSTEM HEALTH CHART (Dummy Data)                                    */
/* ------------------------------------------------------------------ */
let _systemHealthChartInstance = null;

function renderSystemHealthChart() {
    const canvas = document.getElementById('systemHealthChart');
    if (!canvas) return;

    // Destroy existing chart if it exists
    if (_systemHealthChartInstance) {
        _systemHealthChartInstance.destroy();
        _systemHealthChartInstance = null;
    }

    // Generate dummy data for the last 24 hours
    const labels = [];
    const cpuData = [];
    const memoryData = [];
    const networkData = [];
    const diskData = [];

    const now = new Date();
    for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        labels.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

        // Generate realistic-looking dummy data with some variation
        cpuData.push(Math.max(10, Math.min(90, 40 + Math.sin(i * 0.5) * 20 + (Math.random() - 0.5) * 15)));
        memoryData.push(Math.max(20, Math.min(85, 50 + Math.cos(i * 0.3) * 15 + (Math.random() - 0.5) * 10)));
        networkData.push(Math.max(5, Math.min(70, 30 + Math.sin(i * 0.7) * 25 + (Math.random() - 0.5) * 20)));
        diskData.push(Math.max(15, Math.min(95, 60 + Math.cos(i * 0.4) * 10 + (Math.random() - 0.5) * 5)));
    }

    _systemHealthChartInstance = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'CPU Usage (%)',
                    data: cpuData,
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4
                },
                {
                    label: 'Memory Usage (%)',
                    data: memoryData,
                    borderColor: '#4ecdc4',
                    backgroundColor: 'rgba(78, 205, 196, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4
                },
                {
                    label: 'Network I/O (%)',
                    data: networkData,
                    borderColor: '#ffe66d',
                    backgroundColor: 'rgba(255, 230, 109, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4
                },
                {
                    label: 'Disk Usage (%)',
                    data: diskData,
                    borderColor: '#a8e6cf',
                    backgroundColor: 'rgba(168, 230, 207, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    labels: { color: '#ffffff', font: { size: 11 } },
                    position: 'top'
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#888888', font: { size: 10 }, maxTicksLimit: 8 }
                },
                y: {
                    min: 0,
                    max: 100,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#888888', font: { size: 10 }, stepSize: 20 }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

/* ------------------------------------------------------------------ */
/*  DASHBOARD STATS                                                     */
/* ------------------------------------------------------------------ */
let _statusChartInstance = null;
let _severityChartInstance = null;
let _trendChartInstance = null;

async function renderDashboardCharts() {
    // SECTION 2: Incident Status (Doughnut Chart)
    try {
        const resStatus = await fetch('/api/incidents/dashboard');
        const dataStatus = await resStatus.json();
        const counts = dataStatus.statusCounts || [];

        const hasStatusData = counts.length > 0 && counts.some(c => c.count > 0);
        const canvas = document.getElementById('incidentStatusChart');
        const emptyEl = document.getElementById('chart-status-empty');

        if (_statusChartInstance) {
            _statusChartInstance.destroy();
            _statusChartInstance = null;
        }

        if (!hasStatusData) {
            if (canvas) canvas.style.display = 'none';
            if (emptyEl) emptyEl.style.display = 'block';
        } else {
            if (canvas) canvas.style.display = 'block';
            if (emptyEl) emptyEl.style.display = 'none';

            const statusMap = { 'Open': 0, 'Investigating': 0, 'Resolved': 0, 'Closed': 0 };
            counts.forEach(c => {
                if (c.status in statusMap) statusMap[c.status] = c.count;
            });

            if (canvas) {
                _statusChartInstance = new Chart(canvas, {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(statusMap),
                        datasets: [{
                            data: Object.values(statusMap),
                            backgroundColor: ['#ff4d4d', '#ff9900', '#2eb82e', '#999999'],
                            borderWidth: 1,
                            borderColor: 'var(--border-color)'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                labels: { color: '#ffffff' }
                            }
                        }
                    }
                });
            }
        }
    } catch (e) {
        console.error('Status chart error:', e);
    }

    // SECTION 3: Incident Severity Chart
    try {
        const resSeverity = await fetch('/api/dashboard/incidents/severity');
        const dataSev = await resSeverity.json();
        const counts = dataSev.severityCounts || [];

        const hasSevData = counts.length > 0 && counts.some(c => c.count > 0);
        const canvas = document.getElementById('incidentSeverityChart');
        const emptyEl = document.getElementById('chart-severity-empty');

        if (_severityChartInstance) {
            _severityChartInstance.destroy();
            _severityChartInstance = null;
        }

        if (!hasSevData) {
            if (canvas) canvas.style.display = 'none';
            if (emptyEl) emptyEl.style.display = 'block';
        } else {
            if (canvas) canvas.style.display = 'block';
            if (emptyEl) emptyEl.style.display = 'none';

            const sevMap = { 'Critical': 0, 'High': 0, 'Medium': 0, 'Low': 0 };
            counts.forEach(c => {
                if (c.severity in sevMap) sevMap[c.severity] = c.count;
            });

            if (canvas) {
                _severityChartInstance = new Chart(canvas, {
                    type: 'bar',
                    data: {
                        labels: Object.keys(sevMap),
                        datasets: [{
                            label: 'Severity Level Count',
                            data: Object.values(sevMap),
                            backgroundColor: ['#ff4d4d', '#ffaa00', '#ffff00', '#99e699'],
                            borderWidth: 1,
                            borderColor: 'var(--border-color)'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                            x: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                        },
                        plugins: {
                            legend: { display: false }
                        }
                    }
                });
            }
        }
    } catch (e) {
        console.error('Severity chart error:', e);
    }

    // SECTION 4: Incident Trend Chart
    try {
        const resTrend = await fetch('/api/dashboard/incidents/trend');
        const dataTrend = await resTrend.json();
        const points = dataTrend.trendPoints || [];

        const hasTrendData = points.length > 0;
        const canvas = document.getElementById('incidentTrendChart');
        const emptyEl = document.getElementById('chart-trend-empty');

        if (_trendChartInstance) {
            _trendChartInstance.destroy();
            _trendChartInstance = null;
        }

        if (!hasTrendData) {
            if (canvas) canvas.style.display = 'none';
            if (emptyEl) emptyEl.style.display = 'block';
        } else {
            if (canvas) canvas.style.display = 'block';
            if (emptyEl) emptyEl.style.display = 'none';

            const labels = [];
            const dataVal = [];
            points.forEach(p => {
                const d = new Date(p.date);
                labels.push(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
                dataVal.push(p.count);
            });

            if (canvas) {
                _trendChartInstance = new Chart(canvas, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Incidents Logged',
                            data: dataVal,
                            borderColor: '#3a7bd5',
                            backgroundColor: 'rgba(58, 123, 213, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                            x: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                        },
                        plugins: {
                            legend: { labels: { color: '#ffffff' } }
                        }
                    }
                });
            }
        }
    } catch (e) {
        console.error('Trend chart error:', e);
    }
}

async function renderDashboardTables() {
    // SECTION 5: Recent Incidents table
    try {
        const res = await fetch('/api/dashboard/incidents/recent');
        if (!res.ok) throw new Error('API error recent incidents');
        const incidents = await res.json();
        const tbody = document.getElementById('db-recent-incidents-body');
        if (tbody) {
            if (incidents.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No incidents found</td></tr>';
            } else {
                tbody.innerHTML = incidents.map(i => `
                    <tr>
                        <td>${escHtml(i.incidentId || '—')}</td>
                        <td><strong>${escHtml(i.title || '—')}</strong></td>
                        <td><span class="badge ${statusBadgeClass(i.severity)}">${escHtml(i.severity || '—')}</span></td>
                        <td><span class="badge badge-status">${escHtml(i.status || '—')}</span></td>
                        <td>${escHtml(i.assignedTeam || '—')}</td>
                        <td>${i.createdAt ? new Date(i.createdAt).toLocaleString() : '—'}</td>
                    </tr>
                `).join('');
            }
        }
    } catch (e) {
        console.error(e);
    }

    // SECTION 6: Recent Alerts table
    try {
        const res = await fetch('/api/dashboard/alerts/recent');
        if (!res.ok) throw new Error('API error recent alerts');
        const alerts = await res.json();
        const tbody = document.getElementById('db-recent-alerts-body');
        if (tbody) {
            if (alerts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No alerts detected</td></tr>';
            } else {
                tbody.innerHTML = alerts.map(a => `
                    <tr>
                        <td>${escHtml(a.id || '—')}</td>
                        <td><strong>${escHtml(a.title || '—')}</strong></td>
                        <td><span class="badge ${statusBadgeClass(a.severity)}">${escHtml(a.severity || '—')}</span></td>
                        <td>${escHtml(a.source || '—')}</td>
                        <td>${a.timestamp ? new Date(a.timestamp).toLocaleString() : '—'}</td>
                    </tr>
                `).join('');
            }
        }
    } catch (e) {
        console.error(e);
    }

    // SECTION 7: Audit Logs table
    try {
        const res = await fetch('/api/dashboard/audit-logs/recent');
        if (!res.ok) throw new Error('API error recent audit logs');
        const logs = await res.json();
        const tbody = document.getElementById('db-recent-audit-logs-body');
        if (tbody) {
            if (logs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No audit logs available</td></tr>';
            } else {
                tbody.innerHTML = logs.map(l => `
                    <tr>
                        <td>${l.timestamp ? new Date(l.timestamp).toLocaleString() : '—'}</td>
                        <td><strong>${escHtml(l.username || '—')}</strong></td>
                        <td>${escHtml(l.action || '—')}</td>
                        <td><span class="badge ${l.result === 'SUCCESS' ? 'badge-status ok' : 'badge-status critical'}">${escHtml(l.result || '—')}</span></td>
                    </tr>
                `).join('');
            }
        }
    } catch (e) {
        console.error(e);
    }
}

async function loadDashboardStats() {
    try {
        const res = await fetch('/api/dashboard/stats');
        if (!res.ok) throw new Error('Failed to fetch stats');
        const stats = await res.json();

        animateCounter('stats-total-assets', stats.totalAssets);
        animateCounter('stats-active-incidents', stats.activeIncidents);
        animateCounter('stats-critical-incidents', stats.criticalIncidents);
        animateCounter('stats-open-vulnerabilities', stats.openVulnerabilities);
        animateCounter('stats-active-alerts', stats.activeAlerts);
        animateCounter('stats-registered-users', stats.registeredUsers);

        // SECTION 9: System Health - Render dummy line chart
        renderSystemHealthChart();

        await renderDashboardTables();
    } catch (err) {
        console.error('Dashboard stats error:', err);
    }
}

function animateCounter(id, targetVal) {
    const el = document.getElementById(id);
    if (!el) return;

    if (typeof gsap !== 'undefined') {
        let cont = { val: 0 };
        gsap.to(cont, {
            val: targetVal,
            duration: 1.5,
            ease: "power2.out",
            onUpdate: function () {
                el.textContent = Math.floor(cont.val).toLocaleString();
            }
        });
    } else {
        el.textContent = targetVal.toLocaleString();
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
        <button class="tbl-action tbl-view" onclick="openViewModal(${a.id})">👁 View</button>
        <button class="tbl-action tbl-edit" onclick="openEditModal(${a.id})">✏ Edit</button>
        <button class="tbl-action tbl-delete" onclick="deleteAsset(${a.id})">🗑 Delete</button>
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
/*  MODAL — ADD / EDIT / VIEW                                           */
/* ------------------------------------------------------------------ */
function setModalFieldsDisabled(disabled) {
    const fields = ['m-assetName', 'm-assetType', 'm-status', 'm-cpu', 'm-memory', 'm-disk', 'm-network', 'm-uptime', 'm-location'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = disabled;
    });
}

function openAddModal() {
    setModalFieldsDisabled(false);
    const saveBtn = document.querySelector('.btn-modal-save');
    if (saveBtn) saveBtn.style.display = '';

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

    setModalFieldsDisabled(false);
    const saveBtn = document.querySelector('.btn-modal-save');
    if (saveBtn) saveBtn.style.display = '';

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

function openViewModal(id) {
    const asset = _allAssets.find(a => a.id === id);
    if (!asset) { showToast('Asset not found.', 'error'); return; }

    document.getElementById('modalTitle').textContent = 'View Asset';
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

    setModalFieldsDisabled(true);
    const saveBtn = document.querySelector('.btn-modal-save');
    if (saveBtn) saveBtn.style.display = 'none';

    document.getElementById('assetModal').classList.add('open');
}

function closeModal() {
    document.getElementById('assetModal').classList.remove('open');
    setModalFieldsDisabled(false);
    const saveBtn = document.querySelector('.btn-modal-save');
    if (saveBtn) saveBtn.style.display = '';
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

// ── SOC Dashboard Live Telemetry Initialization ──
function initLiveTelemetry() {
    setInterval(() => {
        if (!document.getElementById('page-dashboard').classList.contains('active')) return;

        const cpu = 40 + Math.floor(Math.random() * 8);
        const mem = 65 + Math.floor(Math.random() * 5);
        const disk = 84;
        const net = (1.1 + (Math.random() * 0.3)).toFixed(1);
        const lat = 40 + Math.floor(Math.random() * 15);

        document.getElementById('rt-cpu').textContent = cpu + '%';
        document.getElementById('rt-mem').textContent = mem + '%';
        document.getElementById('rt-disk').textContent = disk + '%';
        document.getElementById('rt-net').textContent = net + ' GB/s';
        document.getElementById('rt-latency').textContent = lat + 'ms';

        if (window.liveChart) {
            window.liveChart.data.datasets[0].data.push(cpu);
            window.liveChart.data.datasets[0].data.shift();
            window.liveChart.update('none');
        }
    }, 2000);
}

function initLiveChart() {
    const ctx = document.getElementById('liveCpuChart');
    if (!ctx) return;

    let initialData = Array(20).fill(0).map(() => 40 + Math.floor(Math.random() * 8));

    window.liveChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(20).fill(''),
            datasets: [{
                label: 'CPU Usage %',
                data: initialData,
                borderColor: '#3a7bd5',
                backgroundColor: 'rgba(58, 123, 213, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 400,
                easing: 'linear'
            },
            scales: {
                y: { min: 0, max: 100, display: true },
                x: { display: false }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// ── AI Panel Interactivity ──
document.addEventListener('DOMContentLoaded', () => {
    const aiToggleBtn = document.getElementById('aiToggleBtn');
    const aiPanel = document.getElementById('aiPanel');
    const aiCloseBtn = document.getElementById('aiCloseBtn');

    // Initially collapse if requested by standard behavior
    if (aiPanel) aiPanel.classList.add('collapsed');

    if (aiToggleBtn && aiPanel) {
        aiToggleBtn.addEventListener('click', () => {
            aiPanel.classList.toggle('collapsed');
        });
    }

    if (aiCloseBtn && aiPanel) {
        aiCloseBtn.addEventListener('click', () => {
            aiPanel.classList.add('collapsed');
        });
    }
});

/* ------------------------------------------------------------------ */
/*  USERS CRUD                                                        */
/* ------------------------------------------------------------------ */
async function loadUsers() {
    try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('API Error or Unauthorized');
        const users = await res.json();
        const tbody = document.getElementById('usersTbody');
        if (!tbody) return;

        if (!users.length) {
            tbody.innerHTML = '<tr><td colspan="5">No users found.</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(u => `
        <tr>
          <td>${u.id}</td>
          <td><strong>${escHtml(u.username || '')}</strong></td>
          <td>${escHtml(u.email || '-')}</td>
          <td><span class="badge ${u.enabled ? 'badge-status ok' : 'badge-status critical'}">${u.enabled ? 'Active' : 'Disabled'}</span></td>
          <td>
            ${(window.USER_PERMISSIONS || []).includes('USER_MANAGE') ? `<button class="tbl-action" style="color:var(--error-red);" onclick="deleteUser(${u.id})">Delete</button>` : ''}
          </td>
        </tr>
      `).join('');
    } catch (err) {
        console.error('Failed to load users:', err);
    }
}

async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast ? showToast('User deleted successfully.') : alert('User deleted.');
            loadUsers();
        } else {
            alert('Failed to delete user: ' + await res.text());
        }
    } catch (err) { console.error(err); }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.USER_PERMISSIONS && window.USER_PERMISSIONS.includes('USER_MANAGE')) {
        loadUsers();
    }
});

// ================= INCIDENT MANAGEMENT =================
let incidentDeleteTarget = null;

async function loadIncidents() {
    try {
        const tbody = document.getElementById("incidentTableBody");
        if (!tbody) return;
        tbody.innerHTML = `<tr><td colspan="6" class="loading-overlay"><span class="spinner"></span>Loading incidents…</td></tr>`;

        const response = await fetch("/api/incidents");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const incidents = await response.json();

        tbody.innerHTML = "";
        if (!incidents || incidents.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:18px;">No incidents found</td></tr>`;
            return;
        }

        incidents.forEach(incident => {
            const created = incident.createdAt ? new Date(incident.createdAt).toLocaleString() : "-";
            const severity = incident.severity || "-";
            const title = incident.title || "-";
            const assignedTo = incident.assignedTo || "-";
            const status = incident.status || "-";
            const incId = incident.incidentId ?? ("INC-" + incident.id);

            // severity color
            const sevColor = { Critical: 'var(--danger-red)', High: 'var(--warning-amber)', Medium: '#e6c229', Low: 'var(--success-green)' }[severity] || 'var(--text-secondary)';

            tbody.innerHTML += `
<tr>
  <td style="font-size:0.8rem; color:var(--text-muted);">${incId}</td>
  <td><span style="font-weight:700; color:${sevColor};">${severity}</span></td>
  <td style="font-size:0.82rem;">${created}</td>
  <td>${title}</td>
  <td>${assignedTo}</td>
  <td>
    <span class="badge badge-status ${status.toLowerCase()}" style="margin-right:6px;">${status}</span>
    <div class="action-btns" style="display:inline-flex;gap:4px;">
      <button class="btn-sm btn-edit" onclick="openIncidentModal(${incident.id})">Edit</button>
      <button class="btn-sm btn-delete" onclick="confirmDeleteIncident(${incident.id})">Delete</button>
    </div>
  </td>
</tr>`;
        });

        // Update the header stat cards dynamically
        const open = incidents.filter(i => i.status === 'Open' && (i.severity === 'Critical')).length;
        const investigating = incidents.filter(i => i.status === 'Investigating').length;
        const resolved = incidents.filter(i => i.status === 'Resolved').length;
        const openCritEl = document.querySelector('#page-incidents .stat-card.alert-card .stat-value');
        const investEl = document.querySelector('#page-incidents .stats-grid .stat-card:nth-child(2) .stat-value');
        const resolvedEl = document.querySelector('#page-incidents .stats-grid .stat-card:nth-child(3) .stat-value');
        if (openCritEl) openCritEl.textContent = open;
        if (investEl) investEl.textContent = investigating;
        if (resolvedEl) resolvedEl.textContent = resolved;

    } catch (error) {
        console.error("loadIncidents error:", error);
        const tbody = document.getElementById("incidentTableBody");
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--danger-red);">Failed to load incidents — ${error.message}</td></tr>`;
            showToast("Failed to load incidents", "error");
        }
    }
}

function openIncidentModal(incidentId = null) {
    const modal = document.getElementById("incidentModal");
    const title = document.getElementById("incidentModalTitle");
    const btn = document.getElementById("btnSaveIncident");
    if (!modal) return;
    if (incidentId) {
        title.textContent = "Edit Incident";
        btn.textContent = "Update Incident";
        loadIncidentIntoForm(incidentId);
    } else {
        title.textContent = "New Incident";
        btn.textContent = "Save Incident";
        clearIncidentForm();
        modal.classList.add("open");
    }
}

async function loadIncidentIntoForm(incidentId) {
    try {
        const response = await fetch(`/api/incidents/${incidentId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const incident = await response.json();
        document.getElementById("incidentId").value = incident.id || "";
        document.getElementById("m-incidentTitle").value = incident.title || "";
        document.getElementById("m-incidentDescription").value = incident.description || "";
        document.getElementById("m-incidentSeverity").value = incident.severity || "";
        document.getElementById("m-incidentStatus").value = incident.status || "";
        document.getElementById("m-incidentTeam").value = incident.assignedTeam || "";
        document.getElementById("m-incidentAssignedTo").value = incident.assignedTo || "";
        document.getElementById("m-incidentSla").value = incident.slaHours ?? "";
        if (incident.resolvedAt) {
            const dt = new Date(incident.resolvedAt);
            const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            document.getElementById("m-incidentResolvedAt").value = local;
        } else {
            document.getElementById("m-incidentResolvedAt").value = "";
        }
        document.getElementById("incidentModal").classList.add("open");
    } catch (error) {
        console.error(error);
        showToast("Failed to load incident details", "error");
    }
}

function closeIncidentModal() {
    const modal = document.getElementById("incidentModal");
    if (modal) modal.classList.remove("open");
}

async function saveIncident() {
    const id = document.getElementById("incidentId").value;
    const payload = {
        title: document.getElementById("m-incidentTitle").value.trim(),
        description: document.getElementById("m-incidentDescription").value.trim(),
        severity: document.getElementById("m-incidentSeverity").value,
        status: document.getElementById("m-incidentStatus").value,
        assignedTeam: document.getElementById("m-incidentTeam").value.trim(),
        assignedTo: document.getElementById("m-incidentAssignedTo").value.trim(),
        slaHours: document.getElementById("m-incidentSla").value ? Number(document.getElementById("m-incidentSla").value) : null,
        resolvedAt: document.getElementById("m-incidentResolvedAt").value || null,
    };
    if (!payload.title || !payload.severity || !payload.status) {
        showToast("Please fill in all required fields", "error");
        return;
    }
    const btn = document.getElementById("btnSaveIncident");
    setButtonLoading(btn, true);
    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/incidents/${id}` : '/api/incidents';
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || `HTTP ${response.status}`);
        }
        showToast(id ? "Incident updated successfully" : "Incident created successfully", "success");
        closeIncidentModal();
        await loadIncidents();
    } catch (error) {
        console.error(error);
        showToast(error.message || "Failed to save incident", "error");
    } finally {
        setButtonLoading(btn, false);
    }
}

function confirmDeleteIncident(incidentId) {
    incidentDeleteTarget = incidentId;
    const modal = document.getElementById("deleteConfirmModal");
    if (modal) modal.classList.add("open");
}

function closeDeleteModal() {
    incidentDeleteTarget = null;
    const modal = document.getElementById("deleteConfirmModal");
    if (modal) modal.classList.remove("open");
}

async function deleteIncident() {
    if (!incidentDeleteTarget) return;
    const btn = document.getElementById("btnConfirmDelete");
    setButtonLoading(btn, true);
    try {
        const response = await fetch(`/api/incidents/${incidentDeleteTarget}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        showToast("Incident deleted successfully", "success");
        closeDeleteModal();
        await loadIncidents();
    } catch (error) {
        console.error(error);
        showToast(error.message || "Failed to delete incident", "error");
    } finally {
        setButtonLoading(btn, false);
    }
}

function clearIncidentForm() {
    document.getElementById("incidentId").value = "";
    document.getElementById("m-incidentTitle").value = "";
    document.getElementById("m-incidentDescription").value = "";
    document.getElementById("m-incidentSeverity").value = "";
    document.getElementById("m-incidentStatus").value = "";
    document.getElementById("m-incidentTeam").value = "";
    document.getElementById("m-incidentAssignedTo").value = "";
    document.getElementById("m-incidentSla").value = "";
    document.getElementById("m-incidentResolvedAt").value = "";
}

function filterIncidents() {
    const search = (document.getElementById("incidentSearch").value || "").toLowerCase();
    const severity = document.getElementById("incidentSeverityFilter").value;
    const status = document.getElementById("incidentStatusFilter").value;
    const rows = document.querySelectorAll("#incidentTableBody tr");
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const matchSearch = text.includes(search);
        const matchSeverity = severity ? text.includes(severity.toLowerCase()) : true;
        const matchStatus = status ? text.includes(status.toLowerCase()) : true;
        row.style.display = matchSearch && matchSeverity && matchStatus ? "" : "none";
    });
}

function setButtonLoading(button, loading) {
    if (!button) return;
    if (loading) {
        button.dataset.originalText = button.textContent;
        button.textContent = "Saving…";
        button.classList.add("btn-loading");
    } else {
        button.textContent = button.dataset.originalText || button.textContent;
        button.classList.remove("btn-loading");
    }
}

// Wire up delete confirmation button
document.addEventListener("DOMContentLoaded", function () {
    const confirmBtn = document.getElementById("btnConfirmDelete");
    if (confirmBtn) {
        confirmBtn.addEventListener("click", deleteIncident);
    }
});
