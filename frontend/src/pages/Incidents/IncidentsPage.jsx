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

    const summary = {
        open: incidents.filter(i => i.status === 'Open').length,
        investigating: incidents.filter(i => i.status === 'Investigating').length,
        resolved: incidents.filter(i => i.status === 'Resolved').length,
        critical: incidents.filter(i => i.severity === 'Critical').length,
    };

    return (
        <DashboardLayout>
            <section className="content-header" style={{ marginBottom: 20 }}>
                <h1>Incident Management <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>Security Events</span></h1>
            </section>

            <section className="kpi-grid" style={{ marginBottom: 20 }}>
                {[
                    { label: 'Open', value: summary.open, color: 'orange', icon: 'ph-shield-warning' },
                    { label: 'Investigating', value: summary.investigating, color: 'yellow', icon: 'ph-magnifying-glass' },
                    { label: 'Resolved', value: summary.resolved, color: 'green', icon: 'ph-check-circle' },
                    { label: 'Critical', value: summary.critical, color: 'red', icon: 'ph-skull' },
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
                                        <td>{inc.title}</td>
                                        <td>{severityBadge(inc.severity)}</td>
                                        <td>{statusBadge(inc.status)}</td>
                                        <td>{inc.assignedTeam || '—'}</td>
                                        <td>{inc.affectedAsset || '—'}</td>
                                        <td>{inc.createdAt ? new Date(inc.createdAt).toLocaleDateString() : '—'}</td>
                                        <td>
                                            <div className="action-btns">
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
