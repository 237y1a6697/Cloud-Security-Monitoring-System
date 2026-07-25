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

    // Client-side quick filter on current page contents
    const filteredLogs = logs.filter((log) => {
        const term = searchTerm.toLowerCase();
        return (
            (log.username?.toLowerCase() || '').includes(term) ||
            (log.action?.toLowerCase() || '').includes(term) ||
            (log.ipAddress?.toLowerCase() || '').includes(term) ||
            (log.result?.toLowerCase() || '').includes(term)
        );
    });

    return (
        <DashboardLayout>
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
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No audit logs found.</td>
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
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
