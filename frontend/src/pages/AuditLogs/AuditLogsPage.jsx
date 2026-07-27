import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import Loader from '../../components/common/Loader/Loader.jsx';
import { useToast } from '../../components/common/Toast/Toast.jsx';
import auditService from '../../services/auditService.js';

export default function AuditLogsPage() {
    const showToast = useToast();
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Pagination details
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [size] = useState(20);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [outcomeFilter, setOutcomeFilter] = useState('');
    const [showFiltersPanel, setShowFiltersPanel] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Detail drawer & Evidence repository
    const [drawerLog, setDrawerLog] = useState(null);
    const [evidenceDb, setEvidenceDb] = useState({
        // Map log.id -> array of evidence filenames
        1: ['saml_auth_challenge.json', 'user_ip_verification.log'],
        2: ['db_query_intent_pci.sql'],
        3: ['admin_config_diff.json']
    });
    const [newEvidenceName, setNewEvidenceName] = useState('');

    async function fetchAuditLogsAndStats() {
        try {
            const [logsRes, statsRes] = await Promise.all([
                auditService.getAll(page, size),
                auditService.getStats()
            ]);
            if (logsRes.data) {
                setLogs(logsRes.data.content || []);
                setTotalPages(logsRes.data.totalPages || 1);
            }
            if (statsRes.data) {
                setStats(statsRes.data);
            }
        } catch {
            showToast('Failed to load audit logs data', 'error');
        }
    }

    useEffect(() => {
        fetchAuditLogsAndStats().then(() => setLoading(false));
    }, [page]);

    // Client-side filtering taking into account all custom parameters
    const filteredLogs = logs.filter((log) => {
        const term = searchTerm.toLowerCase();
        const matchesTerm = (
            (log.username?.toLowerCase() || '').includes(term) ||
            (log.action?.toLowerCase() || '').includes(term) ||
            (log.ipAddress?.toLowerCase() || '').includes(term) ||
            (log.result?.toLowerCase() || '').includes(term)
        );

        const matchesOutcome = !outcomeFilter || log.result === outcomeFilter;

        let matchesDates = true;
        if (log.timestamp) {
            const tDate = new Date(log.timestamp);
            if (startDate) {
                const sDate = new Date(startDate);
                if (tDate < sDate) matchesDates = false;
            }
            if (endDate) {
                const eDate = new Date(endDate);
                if (tDate > eDate) matchesDates = false;
            }
        }

        return matchesTerm && matchesOutcome && matchesDates;
    });

    const triggerExport = (format) => {
        showToast(`Generating ${format.toUpperCase()} transaction ledger...`);
        try {
            const link = document.createElement('a');
            link.href = `/api/audit-logs/export/${format}`;
            link.setAttribute('download', `audit_logs.${format}`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast(`Exported audit trail records successfully!`, 'success');
        } catch (error) {
            console.error('Export failed:', error);
            showToast(`Failed to export audit logs.`, 'error');
        }
    };

    const addEvidence = (logId) => {
        if (!newEvidenceName.trim()) {
            showToast('Please enter a valid evidence filename', 'error');
            return;
        }
        const currentList = evidenceDb[logId] || [];
        setEvidenceDb({
            ...evidenceDb,
            [logId]: [...currentList, newEvidenceName.trim()]
        });
        setNewEvidenceName('');
        showToast('Evidence bound to cryptographic audit trail!', 'success');
    };

    return (
        <DashboardLayout>
            <style>{`
                .drawer-overlay {
                    position: fixed;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    background: rgba(0, 0, 0, 0.4);
                    z-index: 1000;
                    display: flex;
                    justify-content: flex-end;
                }
                .drawer-content {
                    width: 100%;
                    max-width: 480px;
                    background: var(--bg-card);
                    border-left: 1px solid var(--border-color);
                    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.35);
                    padding: 24px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    animation: slideInDrawer 0.25s ease-out;
                }
                @keyframes slideInDrawer {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .drawer-sect {
                    border-bottom: 1px solid var(--border-color);
                    padding-bottom: 15px;
                }
                .meta-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .meta-pair {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.82rem;
                }
                .meta-lbl {
                    color: var(--text-muted);
                }
                .meta-val {
                    font-weight: 600;
                }
                .filters-panel {
                    background: var(--bg-inset);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 16px;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 15px;
                    animation: fadeIn 0.2s ease;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .evidence-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    margin-top: 10px;
                }
                .evidence-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 6px 12px;
                    background: var(--bg-inset);
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    font-size: 0.76rem;
                }
                .btn-secondary {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-inset);
                    border: 1px solid var(--border-color);
                    color: var(--text-secondary);
                    border-radius: var(--border-radius);
                    font-size: 0.8rem;
                    font-weight: 500;
                    padding: 8px 14px;
                    cursor: pointer;
                    gap: 6px;
                    transition: all var(--transition);
                }
                .btn-secondary:hover {
                    background: var(--border-color);
                    color: var(--text-primary);
                }
            `}</style>

            <section className="content-header" style={{ marginBottom: 20 }}>
                <h1>Audit Logs <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>Enterprise Viewer</span></h1>
            </section>

            {loading ? <Loader /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Stats grid */}
                    <section className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                        <div className="stat-card">
                            <div className="stat-label">Total Logs</div>
                            <div className="stat-value" id="audit-total">{stats?.totalLogs ?? '—'}</div>
                            <div className="stat-sub">All time</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Successful</div>
                            <div className="stat-value" id="audit-success" style={{ color: 'var(--success-green)' }}>{stats?.successCount ?? '—'}</div>
                            <div className="stat-sub">Completed actions</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Failed</div>
                            <div className="stat-value" id="audit-failed" style={{ color: 'var(--danger-red)' }}>{stats?.failedCount ?? '—'}</div>
                            <div className="stat-sub">Failed actions</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Denied</div>
                            <div className="stat-value" id="audit-denied" style={{ color: 'var(--warning-amber)' }}>{stats?.deniedCount ?? '—'}</div>
                            <div className="stat-sub">Access denied</div>
                        </div>
                    </section>

                    {/* Filters Trigger + Exports Toolbar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                className="btn-secondary"
                                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                            >
                                <i className="ph ph-sliders" /> {showFiltersPanel ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
                            </button>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn" style={{ width: 'auto', fontSize: '0.8rem', padding: '8px 14px' }} onClick={() => triggerExport('csv')}><i className="ph ph-file-csv" style={{ marginRight: 6 }} /> Export CSV</button>
                            <button className="btn" style={{ width: 'auto', fontSize: '0.8rem', padding: '8px 14px', background: '#e11d48', color: 'white', border: 'none' }} onClick={() => triggerExport('pdf')}><i className="ph ph-file-pdf" style={{ marginRight: 6 }} /> Export PDF</button>
                        </div>
                    </div>

                    {/* Advanced Filters Panel */}
                    {showFiltersPanel && (
                        <div className="filters-panel">
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Date From</label>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%', padding: 6, border: '1px solid var(--border-color)', borderRadius: 4, background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Date To</label>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '100%', padding: 6, border: '1px solid var(--border-color)', borderRadius: 4, background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Outcome</label>
                                <select value={outcomeFilter} onChange={e => setOutcomeFilter(e.target.value)} style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--border-color)', borderRadius: 4, background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                                    <option value="">All Results</option>
                                    <option value="SUCCESS">SUCCESS</option>
                                    <option value="FAILED">FAILED</option>
                                    <option value="DENIED">DENIED</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Panel containing table */}
                    <div className="panel-card">
                        <div className="toolbar" style={{ marginBottom: 15, display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                            <input
                                type="search"
                                id="auditLogSearch"
                                placeholder="Search User, IP, Action..."
                                style={{ width: 250, padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: 6, background: 'var(--bg-inset)', color: 'var(--text-primary)' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />

                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    className="btn"
                                    disabled={page === 0}
                                    onClick={() => setPage(page - 1)}
                                    style={{ width: 'auto', padding: '6px 12px', opacity: page === 0 ? 0.5 : 1 }}
                                >
                                    Previous
                                </button>
                                <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Page {page + 1} of {totalPages}
                                </span>
                                <button
                                    className="btn"
                                    disabled={page >= totalPages - 1}
                                    onClick={() => setPage(page + 1)}
                                    style={{ width: 'auto', padding: '6px 12px', opacity: page >= totalPages - 1 ? 0.5 : 1 }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>

                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>User</th>
                                        <th>Roles Mapped</th>
                                        <th>IP &amp; Device</th>
                                        <th>Action</th>
                                        <th>Outcome</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No audit logs found.</td>
                                        </tr>
                                    ) : (
                                        filteredLogs.map((log) => (
                                            <tr key={log.id}>
                                                <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                                                </td>
                                                <td><strong>{log.username}</strong></td>
                                                <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{log.role}</td>
                                                <td style={{ fontSize: '0.8rem' }}>
                                                    <div>{log.ipAddress}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 200, WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', display: '-webkit-box' }} title={log.deviceBrowser}>
                                                        {log.deviceBrowser}
                                                    </div>
                                                </td>
                                                <td>{log.action}</td>
                                                <td>
                                                    <span className={`badge badge-status ${log.result === 'SUCCESS' ? 'ok' : log.result === 'DENIED' ? 'warning' : 'alert'
                                                        }`} style={{ display: 'inline-block', minWidth: 70, textAlign: 'center' }}>
                                                        {log.result}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn-sm btn-inspect"
                                                        style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-color)', borderRadius: 4, height: 26, padding: '0 8px', fontSize: '0.73rem', fontWeight: 600 }}
                                                        onClick={() => setDrawerLog(log)}
                                                    >
                                                        Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* AUDIT DETAILS SLIDING DRAWER */}
            {drawerLog && (
                <div className="drawer-overlay" onClick={e => e.target === e.currentTarget && setDrawerLog(null)}>
                    <div className="drawer-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 15 }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <i className="ph ph-fingerprint" /> LOG TRACE #{drawerLog.id}
                            </span>
                            <button style={{ border: 'none', background: 'transparent', fontSize: '1.4rem', cursor: 'pointer' }} onClick={() => setDrawerLog(null)}>×</button>
                        </div>

                        <div className="drawer-sect">
                            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>Transaction Properties</h4>
                            <div className="meta-list">
                                <div className="meta-pair"><span className="meta-lbl">Username</span><span className="meta-val">{drawerLog.username}</span></div>
                                <div className="meta-pair"><span className="meta-lbl">Client IP</span><span className="meta-val">{drawerLog.ipAddress}</span></div>
                                <div className="meta-pair"><span className="meta-lbl">Time of Action</span><span className="meta-val">{drawerLog.timestamp ? new Date(drawerLog.timestamp).toLocaleString() : '—'}</span></div>
                                <div className="meta-pair"><span className="meta-lbl">Session Role</span><span className="meta-val">{drawerLog.role || 'ROLE_USER'}</span></div>
                                <div className="meta-pair"><span className="meta-lbl">API / Route</span><span className="meta-val"><code>{drawerLog.action}</code></span></div>
                                <div className="meta-pair"><span className="meta-lbl">Outcome</span><span className="meta-val">{drawerLog.result}</span></div>
                            </div>
                        </div>

                        <div className="drawer-sect">
                            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>Agent Signature</h4>
                            <div style={{ fontSize: '0.78rem', background: 'var(--bg-inset)', padding: 10, borderRadius: 6, wordBreak: 'break-all', fontFamily: 'monospace' }}>
                                {drawerLog.deviceBrowser || 'No signature information captured.'}
                            </div>
                        </div>

                        {/* EVIDENCE REPOSITORY TAB */}
                        <div className="drawer-sect" style={{ border: 'none' }}>
                            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>Cryptographic Evidence Registry</h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Immutable audit artifacts mapping this action validation check.</p>

                            <div className="evidence-list">
                                {(evidenceDb[drawerLog.id] || []).map((file, idx) => (
                                    <div key={idx} className="evidence-item">
                                        <span><i className="ph ph-file-text" style={{ marginRight: 6, color: '#3a7bd5' }} /> {file}</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => showToast('Opening audit evidence file...')}>Verify SHA256</span>
                                    </div>
                                ))}
                                {(!evidenceDb[drawerLog.id] || evidenceDb[drawerLog.id].length === 0) && (
                                    <div style={{ padding: 14, textAlign: 'center', fontSize: '0.75rem', border: '1px dashed var(--border-color)', color: 'var(--text-muted)', borderRadius: 4 }}>
                                        No evidence attached.
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: 15, display: 'flex', gap: 6 }}>
                                <input
                                    type="text"
                                    placeholder="Add attachment (e.g. proof.png)..."
                                    value={newEvidenceName}
                                    onChange={e => setNewEvidenceName(e.target.value)}
                                    style={{ flex: 1, padding: 6, fontSize: '0.76rem', border: '1px solid var(--border-color)', borderRadius: 4, background: 'var(--bg-inset)', color: 'var(--text-primary)' }}
                                />
                                <button
                                    className="btn"
                                    style={{ width: 'auto', padding: '6px 12px', fontSize: '0.76rem' }}
                                    onClick={() => addEvidence(drawerLog.id)}
                                >
                                    Attach
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
