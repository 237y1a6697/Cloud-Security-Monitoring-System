import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import Loader from '../../components/common/Loader/Loader.jsx';
import { useToast } from '../../components/common/Toast/Toast.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import incidentService from '../../services/incidentService.js';
import Swal from 'sweetalert2';

const EMPTY = { title: '', description: '', severity: 'Medium', status: 'Open', assignedTeam: '', affectedAsset: '' };

function severityBadge(sev) {
    const colors = { Critical: '#dc2626', High: '#ea580c', Medium: '#ca8a04', Low: '#16a34a' };
    const bg = colors[sev] || '#6b7280';
    return <span style={{ background: `${bg}22`, color: bg, border: `1px solid ${bg}55`, padding: '2px 8px', borderRadius: 40, fontSize: '0.73rem', fontWeight: 600 }}>{sev}</span>;
}

function statusBadge(status) {
    const cls = { Open: 'status-badge open', Investigating: 'status-badge investigating', Resolved: 'status-badge resolved', Closed: 'status-badge closed' };
    return <span className={cls[status] || 'status-badge'}>{status}</span>;
}

function SLATimer({ incident }) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!incident || incident.status === 'Resolved' || incident.status === 'Closed') {
            setTimeLeft('Complied');
            return;
        }

        const limits = { Critical: 1, High: 4, Medium: 24, Low: 72 };
        const limitHrs = limits[incident.severity] || 24;
        const createdTime = incident.createdAt ? new Date(incident.createdAt).getTime() : Date.now();
        const limitTime = createdTime + limitHrs * 60 * 60 * 1000;

        const updateTimer = () => {
            const diff = limitTime - Date.now();
            if (diff <= 0) {
                setTimeLeft('SLA Breached');
            } else {
                const hrs = Math.floor(diff / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(
                    `${hrs.toString().padStart(2, '0')}:${mins
                        .toString()
                        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
                );
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [incident]);

    const isBreached = timeLeft === 'SLA Breached';
    const isComplied = timeLeft === 'Complied';

    let color = 'var(--text-secondary)';
    if (isBreached) color = 'var(--danger-red)';
    else if (isComplied) color = 'var(--success-green)';
    else color = 'var(--warning-amber)';

    return <strong style={{ color }}>{timeLeft}</strong>;
}

export default function IncidentsPage() {
    const { hasPermission } = useAuth();
    const showToast = useToast();
    const [incidents, setIncidents] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatus] = useState('');
    const [sevFilter, setSev] = useState('');
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [drawerIncident, setDrawerIncident] = useState(null);

    async function load() {
        setLoading(true);
        try {
            const res = await incidentService.getAll();
            setIncidents(res.data || []);
        } catch { showToast('Failed to load incidents', 'error'); }
        finally { setLoading(false); }
    }

    useEffect(() => { load(); }, []);

    useEffect(() => {
        let a = incidents;
        if (search) a = a.filter(x => x.title?.toLowerCase().includes(search.toLowerCase()));
        if (statusFilter) a = a.filter(x => x.status === statusFilter);
        if (sevFilter) a = a.filter(x => x.severity === sevFilter);
        setFiltered(a);
    }, [incidents, search, statusFilter, sevFilter]);

    function openAdd() { setForm(EMPTY); setModal({ mode: 'add' }); }
    function openEdit(i) { setForm({ ...i }); setModal({ mode: 'edit', inc: i }); }
    function closeModal() { setModal(null); }
    function handleForm(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

    async function saveIncident() {
        setSaving(true);
        try {
            if (modal.mode === 'add') { await incidentService.create(form); showToast('Incident created!'); }
            else { await incidentService.update(modal.inc.id, form); showToast('Incident updated!'); }
            closeModal(); load();
        } catch (e) { showToast(e.response?.data?.message || 'Save failed', 'error'); }
        finally { setSaving(false); }
    }

    async function deleteIncident(id) {
        const r = await Swal.fire({ title: 'Delete Incident?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#c62828', confirmButtonText: 'Delete' });
        if (!r.isConfirmed) return;
        try { await incidentService.delete(id); showToast('Incident deleted!'); load(); }
        catch { showToast('Delete failed', 'error'); }
    }

    async function updateIncidentStatus(inc, newStatus) {
        try {
            await incidentService.update(inc.id, {
                ...inc,
                status: newStatus
            });
            showToast(`Incident status set to ${newStatus}!`, 'success');
            setIncidents(prev => prev.map(x => x.id === inc.id ? { ...x, status: newStatus } : x));
            setDrawerIncident(prev => prev && prev.id === inc.id ? { ...prev, status: newStatus } : prev);
        } catch {
            showToast('Failed to update status', 'error');
        }
    }

    const summary = {
        open: incidents.filter(i => i.status === 'Open').length,
        investigating: incidents.filter(i => i.status === 'Investigating').length,
        resolved: incidents.filter(i => i.status === 'Resolved').length,
        critical: incidents.filter(i => i.severity === 'Critical').length,
    };

    // Helper to determine status workflow highlight
    const getWorkflowStepStatus = (status, step) => {
        const order = ['Open', 'Investigating', 'Resolved', 'Closed'];
        const currentIdx = order.indexOf(status);
        const stepIdx = order.indexOf(step);

        if (currentIdx === -1) return 'pending';
        if (currentIdx === stepIdx) return 'active';
        if (currentIdx > stepIdx) return 'completed';
        return 'pending';
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
                .workflow-timeline {
                    display: flex;
                    justify-content: space-between;
                    margin: 15px 0;
                    position: relative;
                    padding: 0 10px;
                }
                .workflow-timeline::before {
                    content: '';
                    position: absolute;
                    top: 14px;
                    left: 20px;
                    right: 20px;
                    height: 2px;
                    background: var(--border-color);
                    z-index: 1;
                }
                .workflow-step {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    z-index: 2;
                    font-size: 0.68rem;
                    width: 25%;
                }
                .step-dot {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: var(--bg-inset);
                    border: 2px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    margin-bottom: 4px;
                    color: var(--text-muted);
                    font-size: 0.8rem;
                }
                .workflow-step.active .step-dot {
                    background: var(--highlight-blue);
                    border-color: var(--highlight-blue);
                    color: white;
                }
                .workflow-step.completed .step-dot {
                    background: var(--success-green);
                    border-color: var(--success-green);
                    color: white;
                }
                .drawer-sect {
                    border-bottom: 1px solid var(--border-color);
                    padding-bottom: 15px;
                }
                .drawer-title {
                    font-size: 1.15rem;
                    font-weight: 700;
                    margin-bottom: 6px;
                }
                .meta-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin-top: 10px;
                }
                .meta-item label {
                    font-size: 0.72rem;
                    color: var(--text-muted);
                    display: block;
                    margin-bottom: 2px;
                }
                .meta-item span {
                    font-size: 0.85rem;
                    font-weight: 600;
                }
                .quick-actions-bar {
                    display: flex;
                    gap: 8px;
                    margin-top: 12px;
                }
                .quick-btn {
                    flex: 1;
                    padding: 8px;
                    font-size: 0.78rem;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    text-align: center;
                    border: 1px solid var(--border-color);
                    background: var(--bg-inset);
                }
                .quick-btn.primary {
                    background: var(--highlight-blue);
                    border-color: var(--highlight-blue);
                    color: white;
                }
                .quick-btn.success {
                    background: var(--success-green);
                    border-color: var(--success-green);
                    color: white;
                }
            `}</style>

            <section className="content-header" style={{ marginBottom: 20 }}>
                <h1>Incident Management <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>Security Events</span></h1>
            </section>

            <section className="kpi-grid" style={{ marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16 }}>
                {[
                    { label: 'Open', value: summary.open, color: 'orange', icon: 'ph-shield-warning' },
                    { label: 'Investigating', value: summary.investigating, color: 'yellow', icon: 'ph-magnifying-glass' },
                    { label: 'Resolved', value: summary.resolved, color: 'green', icon: 'ph-check-circle' },
                    { label: 'Critical', value: summary.critical, color: 'red', icon: 'ph-skull' },
                    { label: 'Avg MTTR', value: '18.4 min', color: 'blue', icon: 'ph-clock-countdown' },
                    { label: 'SLA compliance', value: '98.6%', color: 'indigo', icon: 'ph-percent' },
                ].map(c => (
                    <div key={c.label} className={`kpi-card ${c.color}`}>
                        <div className="kpi-card-header"><span className="kpi-card-title">{c.label}</span><i className={`ph ${c.icon} kpi-card-icon`} /></div>
                        <div className="kpi-card-value">{c.value}</div>
                    </div>
                ))}
            </section>

            <div className="panel-card">
                <div className="toolbar">
                    <input type="search" placeholder="Search incidents…" value={search} onChange={e => setSearch(e.target.value)} />
                    <select value={statusFilter} onChange={e => setStatus(e.target.value)}>
                        <option value="">All Statuses</option>
                        {['Open', 'Investigating', 'Resolved', 'Closed'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={sevFilter} onChange={e => setSev(e.target.value)}>
                        <option value="">All Severities</option>
                        {['Critical', 'High', 'Medium', 'Low'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {hasPermission('INCIDENT_CREATE') && <button className="btn-add" onClick={openAdd}>+ New Incident</button>}
                </div>

                {loading ? <Loader /> : (
                    <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead><tr><th>ID</th><th>Title</th><th>Severity</th><th>Status</th><th>Assigned Team</th><th>Affected Asset</th><th>Created</th><th>Actions</th></tr></thead>
                            <tbody>
                                {filtered.length ? filtered.map(inc => (
                                    <tr key={inc.id}>
                                        <td>INC-{inc.id}</td>
                                        <td onClick={() => setDrawerIncident(inc)} style={{ cursor: 'pointer', color: 'var(--highlight-blue)', fontWeight: 600 }}>
                                            {inc.title}
                                        </td>
                                        <td>{severityBadge(inc.severity)}</td>
                                        <td>{statusBadge(inc.status)}</td>
                                        <td>{inc.assignedTeam || '—'}</td>
                                        <td>{inc.affectedAsset || '—'}</td>
                                        <td>{inc.createdAt ? new Date(inc.createdAt).toLocaleDateString() : '—'}</td>
                                        <td>
                                            <div className="action-btns">
                                                <button className="btn-sm btn-inspect" style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-color)', borderRadius: 4, height: 26, padding: '0 8px', fontSize: '0.73rem', fontWeight: 600 }} onClick={() => setDrawerIncident(inc)}>Inspect</button>
                                                {hasPermission('INCIDENT_MANAGE') && <button className="btn-sm btn-edit" onClick={() => openEdit(inc)}>Edit</button>}
                                                {hasPermission('INCIDENT_DELETE') && <button className="btn-sm btn-delete" onClick={() => deleteIncident(inc.id)}>Delete</button>}
                                                {!hasPermission('INCIDENT_MANAGE') && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Read-only</span>}
                                            </div>
                                        </td>
                                    </tr>
                                )) : <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 28 }}>No incidents found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* DETAILS SLIDING DRAWER */}
            {drawerIncident && (
                <div className="drawer-overlay" onClick={e => e.target === e.currentTarget && setDrawerIncident(null)}>
                    <div className="drawer-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 15 }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>INC-{drawerIncident.id}</span>
                            <button style={{ border: 'none', background: 'transparent', fontSize: '1.4rem', cursor: 'pointer' }} onClick={() => setDrawerIncident(null)}>×</button>
                        </div>

                        <div className="drawer-sect">
                            <div className="drawer-title">{drawerIncident.title}</div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
                                {severityBadge(drawerIncident.severity)}
                                {statusBadge(drawerIncident.status)}
                            </div>
                        </div>

                        <div className="drawer-sect">
                            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>Incident Description</h4>
                            <p style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>{drawerIncident.description || 'No description provided.'}</p>
                        </div>

                        <div className="drawer-sect">
                            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>SLA Timeline countdown</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-inset)', padding: '10px 14px', borderRadius: 6 }}>
                                <span style={{ fontSize: '0.8rem' }}>Resolve Deadline:</span>
                                <SLATimer incident={drawerIncident} />
                            </div>
                        </div>

                        <div className="drawer-sect">
                            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>Workflow Progress</h4>
                            <div className="workflow-timeline">
                                {[
                                    { step: 'Open', label: 'Detect', num: 1 },
                                    { step: 'Investigating', label: 'Analyze', num: 2 },
                                    { step: 'Resolved', label: 'Contain', num: 3 },
                                    { step: 'Closed', label: 'Recover', num: 4 }
                                ].map(st => {
                                    const stepCls = getWorkflowStepStatus(drawerIncident.status, st.step);
                                    return (
                                        <div key={st.step} className={`workflow-step ${stepCls}`}>
                                            <div className="step-dot">{st.num}</div>
                                            <span>{st.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="drawer-sect" style={{ border: 'none' }}>
                            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>Operational Properties</h4>
                            <div className="meta-grid">
                                <div className="meta-item"><label>Assigned Team</label><span>{drawerIncident.assignedTeam || '—'}</span></div>
                                <div className="meta-item"><label>Affected Asset</label><span>{drawerIncident.affectedAsset || '—'}</span></div>
                                <div className="meta-item"><label>Reported Date</label><span>{drawerIncident.createdAt ? new Date(drawerIncident.createdAt).toLocaleString() : '—'}</span></div>
                                <div className="meta-item"><label>Owner Operator</label><span>SOC Level 2</span></div>
                            </div>

                            {hasPermission('INCIDENT_MANAGE') && (
                                <div style={{ marginTop: 24 }}>
                                    <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>Quick Dispatch Actions</h4>
                                    <div className="quick-actions-bar">
                                        {drawerIncident.status === 'Open' && (
                                            <button className="quick-btn primary" onClick={() => updateIncidentStatus(drawerIncident, 'Investigating')}>Acknowledge</button>
                                        )}
                                        {drawerIncident.status !== 'Resolved' && drawerIncident.status !== 'Closed' && (
                                            <button className="quick-btn success" onClick={() => updateIncidentStatus(drawerIncident, 'Resolved')}>Resolve Incident</button>
                                        )}
                                        {drawerIncident.status === 'Resolved' && (
                                            <button className="quick-btn" onClick={() => updateIncidentStatus(drawerIncident, 'Closed')}>Archive / Close</button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {modal && (
                <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal-box">
                        <div className="modal-header">
                            <h3>{modal.mode === 'add' ? 'New Incident' : 'Edit Incident'}</h3>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>
                        <div className="modal-grid">
                            <div className="modal-field full"><label>Title</label><input name="title" value={form.title} onChange={handleForm} /></div>
                            <div className="modal-field full"><label>Description</label><input name="description" value={form.description || ''} onChange={handleForm} /></div>
                            <div className="modal-field"><label>Severity</label><select name="severity" value={form.severity} onChange={handleForm}>{['Critical', 'High', 'Medium', 'Low'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                            <div className="modal-field"><label>Status</label><select name="status" value={form.status} onChange={handleForm}>{['Open', 'Investigating', 'Resolved', 'Closed'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                            <div className="modal-field"><label>Assigned Team</label><input name="assignedTeam" value={form.assignedTeam || ''} onChange={handleForm} /></div>
                            <div className="modal-field"><label>Affected Asset</label><input name="affectedAsset" value={form.affectedAsset || ''} onChange={handleForm} /></div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-modal-cancel" onClick={closeModal}>Cancel</button>
                            <button className="btn-modal-save" onClick={saveIncident} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
