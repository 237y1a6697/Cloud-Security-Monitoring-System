import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid
} from 'recharts';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import Loader from '../../components/common/Loader/Loader.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import dashboardService from '../../services/dashboardService.js';

/* ── Colours ── */
const STATUS_COLORS = { Open: '#ef4444', Investigating: '#f97316', Resolved: '#22c55e', Closed: '#6b7280' };
const SEVERITY_COLORS = { Critical: '#dc2626', High: '#ea580c', Medium: '#ca8a04', Low: '#16a34a' };
const CHART_COLORS = ['#3a7bd5', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4'];

function statusBadge(status) {
    const cls = {
        Open: 'status-badge open', Investigating: 'status-badge investigating',
        Resolved: 'status-badge resolved', Closed: 'status-badge closed',
    };
    return <span className={cls[status] || 'status-badge'}>{status}</span>;
}

function severityBadge(sev) {
    const colors = { Critical: '#dc2626', High: '#ea580c', Medium: '#ca8a04', Low: '#16a34a' };
    const bg = colors[sev] || '#6b7280';
    return <span style={{ background: `${bg}22`, color: bg, border: `1px solid ${bg}55`, padding: '2px 8px', borderRadius: 40, fontSize: '0.73rem', fontWeight: 600 }}>{sev}</span>;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [statusChart, setStatus] = useState([]);
    const [severityChart, setSeverity] = useState([]);
    const [trendChart, setTrend] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [statsRes, statusRes, sevRes, trendRes, incRes, alertRes, auditRes] = await Promise.all([
                    dashboardService.getStats(),
                    dashboardService.getIncidentStatusChart(),
                    dashboardService.getIncidentSeverityChart(),
                    dashboardService.getIncidentTrend(),
                    dashboardService.getRecentIncidents(),
                    dashboardService.getRecentAlerts(),
                    dashboardService.getRecentAuditLogs(),
                ]);
                setStats(statsRes.data);
                setStatus((statusRes.data?.statusCounts || []).map((s) => ({ name: s.status, value: s.count })));
                setSeverity((sevRes.data?.severityCounts || []).map((s) => ({ name: s.severity, value: s.count })));
                setTrend((trendRes.data?.trendPoints || []).map((t) => ({ date: t.date?.substring(5), count: t.count })));
                setIncidents(incRes.data || []);
                setAlerts(alertRes.data || []);
                setAuditLogs(auditRes.data || []);
            } catch (e) {
                console.error('Dashboard load error:', e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const kpiCards = [
        { color: 'blue', label: 'Total Assets', value: stats?.totalAssets, sub: 'Devices registered', icon: 'ph-desktop', valueColor: '' },
        { color: 'orange', label: 'Active Incidents', value: stats?.activeIncidents, sub: 'Open + Investigating', icon: 'ph-shield-warning', valueColor: 'var(--warning-amber)' },
        { color: 'red', label: 'Critical Incidents', value: stats?.criticalIncidents, sub: 'Triage required', icon: 'ph-shield-warning', valueColor: 'var(--danger-red)' },
        { color: 'purple', label: 'Open Vulnerabilities', value: stats?.openVulnerabilities, sub: 'Unresolved CVSE', icon: 'ph-bug', valueColor: '#9b5de5' },
        { color: 'yellow', label: 'Active Alerts', value: stats?.activeAlerts, sub: 'System triggers', icon: 'ph-bell', valueColor: 'var(--warning-amber)' },
        { color: 'green', label: 'Registered Users', value: stats?.registeredUsers, sub: 'Access enabled', icon: 'ph-users', valueColor: 'var(--success-green)' },
    ];

    return (
        <DashboardLayout>
            {/* Header */}
            <section className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15, marginBottom: 20 }}>
                <h1>SentinelCore SOC Dashboard</h1>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', background: 'var(--bg-inset)', padding: '8px 15px', borderRadius: 6, border: '1px solid var(--border-color)' }}>
                    <i className="ph ph-user" style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    <strong>User:</strong> {user?.username || 'Viewer'} &nbsp;|&nbsp;
                    <strong>Role:</strong> {user?.role || 'VIEWER'} &nbsp;|&nbsp;
                    <strong>Last Login:</strong> {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                </div>
            </section>

            {loading ? <Loader /> : (
                <>
                    {/* KPI Cards */}
                    <section className="kpi-grid" style={{ marginBottom: 12 }}>
                        {kpiCards.map((c) => (
                            <div key={c.label} className={`kpi-card ${c.color}`}>
                                <div className="kpi-card-header">
                                    <span className="kpi-card-title">{c.label}</span>
                                    <i className={`ph ${c.icon} kpi-card-icon`} />
                                </div>
                                <div className="kpi-card-value" style={c.valueColor ? { color: c.valueColor } : {}}>
                                    {c.value ?? '—'}
                                </div>
                                <div className="kpi-card-subtitle">{c.sub}</div>
                                <div className="kpi-card-updated">Updated just now</div>
                            </div>
                        ))}
                    </section>

                    {/* Charts Row */}
                    {(statusChart.length > 0 || severityChart.length > 0 || trendChart.length > 0) && (
                        <section className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
                            {/* Incident Status Pie */}
                            <div className="panel-card">
                                <h2 className="panel-title">Incident Status <span className="panel-subtitle">By state</span></h2>
                                {statusChart.length ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie data={statusChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                                {statusChart.map((entry, i) => (
                                                    <Cell key={i} fill={STATUS_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No data</p>}
                            </div>

                            {/* Incident Severity Bar */}
                            <div className="panel-card">
                                <h2 className="panel-title">Incident Severity <span className="panel-subtitle">By level</span></h2>
                                {severityChart.length ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={severityChart}>
                                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip />
                                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                {severityChart.map((entry, i) => (
                                                    <Cell key={i} fill={SEVERITY_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No data</p>}
                            </div>

                            {/* 30-Day Trend Line */}
                            <div className="panel-card">
                                <h2 className="panel-title">Incident Trend <span className="panel-subtitle">Last 30 days</span></h2>
                                {trendChart.length ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <LineChart data={trendChart}>
                                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="count" stroke="#3a7bd5" strokeWidth={2} dot={{ r: 3 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No data</p>}
                            </div>
                        </section>
                    )}

                    {/* Tables Row */}
                    <section className="tables-grid">
                        {/* Recent Incidents */}
                        <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                    <h2 className="panel-title" style={{ margin: 0 }}>Recent Incidents <span className="panel-subtitle">Latest DB records</span></h2>
                                    <a href="#" onClick={(e) => { e.preventDefault(); navigate('/incidents'); }} style={{ fontSize: '0.8rem', color: '#3a7bd5', textDecoration: 'none' }}>View All</a>
                                </div>
                                <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                                    <table className="data-table">
                                        <thead><tr><th>ID</th><th>Title</th><th>Severity</th><th>Status</th><th>Team</th><th>Created</th></tr></thead>
                                        <tbody>
                                            {incidents.length ? incidents.map((inc) => (
                                                <tr key={inc.id}>
                                                    <td>INC-{inc.id}</td>
                                                    <td>{inc.title}</td>
                                                    <td>{severityBadge(inc.severity)}</td>
                                                    <td>{statusBadge(inc.status)}</td>
                                                    <td>{inc.assignedTeam || '—'}</td>
                                                    <td>{inc.createdAt ? new Date(inc.createdAt).toLocaleDateString() : '—'}</td>
                                                </tr>
                                            )) : <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No incidents found</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 15, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                <span>Showing latest {incidents.length} records</span>
                            </div>
                        </div>

                        {/* Recent Alerts */}
                        <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                    <h2 className="panel-title" style={{ margin: 0 }}>Recent Alerts <span className="panel-subtitle">Latest PostgreSQL signals</span></h2>
                                    <a href="#" onClick={(e) => { e.preventDefault(); navigate('/assets'); }} style={{ fontSize: '0.8rem', color: '#3a7bd5', textDecoration: 'none' }}>View All</a>
                                </div>
                                <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                                    <table className="data-table">
                                        <thead><tr><th>Alert ID</th><th>Title</th><th>Severity</th><th>Source</th><th>Time</th></tr></thead>
                                        <tbody>
                                            {alerts.length ? alerts.map((a) => (
                                                <tr key={a.id}>
                                                    <td>#{a.id}</td>
                                                    <td>{a.title}</td>
                                                    <td>{severityBadge(a.severity)}</td>
                                                    <td>{a.source || '—'}</td>
                                                    <td>{a.timestamp ? new Date(a.timestamp).toLocaleString() : '—'}</td>
                                                </tr>
                                            )) : <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No alerts detected</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 15 }}>Showing latest {alerts.length} alerts</div>
                        </div>

                        {/* Recent Audit Logs */}
                        <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                    <h2 className="panel-title" style={{ margin: 0 }}>Recent Audit Logs <span className="panel-subtitle">System actions history</span></h2>
                                    <a href="#" onClick={(e) => { e.preventDefault(); navigate('/audit-logs'); }} style={{ fontSize: '0.8rem', color: '#3a7bd5', textDecoration: 'none' }}>View All</a>
                                </div>
                                <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                                    <table className="data-table">
                                        <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Result</th></tr></thead>
                                        <tbody>
                                            {auditLogs.length ? auditLogs.map((log, i) => (
                                                <tr key={i}>
                                                    <td>{log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}</td>
                                                    <td>{log.username}</td>
                                                    <td>{log.action}</td>
                                                    <td>
                                                        <span style={{ color: log.result === 'SUCCESS' ? 'var(--success-green)' : 'var(--danger-red)', fontWeight: 600, fontSize: '0.8rem' }}>
                                                            {log.result}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )) : <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No audit logs available</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 15 }}>Showing latest {auditLogs.length} audits</div>
                        </div>
                    </section>
                </>
            )}
        </DashboardLayout>
    );
}
