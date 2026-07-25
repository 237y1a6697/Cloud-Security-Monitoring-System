import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import Loader from '../../components/common/Loader/Loader.jsx';
import { useToast } from '../../components/common/Toast/Toast.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import assetService from '../../services/assetService.js';
import Swal from 'sweetalert2';

const EMPTY = { assetName: '', assetType: 'Server', status: 'Active', ipAddress: '', location: '', uptime: '', cpuUsage: '', memoryUsage: '', diskUsage: '', networkUsage: '' };

function miniBar(pct) {
    const p = parseFloat(pct) || 0;
    const cls = p >= 80 ? 'mini-red' : p >= 60 ? 'mini-orange' : 'mini-green';
    return <><div className="mini-bar-wrap"><div className={`mini-bar ${cls}`} style={{ width: `${p}%` }} /></div>{p}%</>;
}

export default function AssetsPage() {
    const { hasPermission } = useAuth();
    const showToast = useToast();
    const [assets, setAssets] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setType] = useState('');
    const [statusFilter, setStatus] = useState('');
    const [modal, setModal] = useState(null); // { mode:'add'|'edit'|'view', asset }
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);

    async function load() {
        setLoading(true);
        try {
            const res = await assetService.getAll();
            setAssets(res.data || []);
            setFiltered(res.data || []);
        } catch { showToast('Failed to load assets', 'error'); }
        finally { setLoading(false); }
    }

    useEffect(() => { load(); }, []);

    useEffect(() => {
        let a = assets;
        if (search) a = a.filter(x => x.assetName?.toLowerCase().includes(search.toLowerCase()) || x.ipAddress?.includes(search));
        if (typeFilter) a = a.filter(x => x.assetType === typeFilter);
        if (statusFilter) a = a.filter(x => x.status === statusFilter);
        setFiltered(a);
    }, [assets, search, typeFilter, statusFilter]);

    function openAdd() { setForm(EMPTY); setModal({ mode: 'add' }); }
    function openEdit(a) { setForm({ ...a }); setModal({ mode: 'edit', asset: a }); }
    function openView(a) { setForm({ ...a }); setModal({ mode: 'view', asset: a }); }
    function closeModal() { setModal(null); }

    function handleForm(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

    async function saveAsset() {
        setSaving(true);
        try {
            if (modal.mode === 'add') {
                await assetService.create(form);
                showToast('Asset created successfully!');
            } else {
                await assetService.update(modal.asset.id, form);
                showToast('Asset updated successfully!');
            }
            closeModal(); load();
        } catch (e) {
            showToast(e.response?.data?.message || 'Save failed', 'error');
        } finally { setSaving(false); }
    }

    async function deleteAsset(id) {
        const result = await Swal.fire({ title: 'Delete Asset?', text: 'This action cannot be undone.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#c62828', confirmButtonText: 'Delete' });
        if (!result.isConfirmed) return;
        try {
            await assetService.delete(id);
            showToast('Asset deleted!');
            load();
        } catch { showToast('Delete failed', 'error'); }
    }

    const types = [...new Set(assets.map(a => a.assetType).filter(Boolean))];
    const statuses = [...new Set(assets.map(a => a.status).filter(Boolean))];
    const summary = { total: assets.length, online: assets.filter(a => a.status === 'Active').length, offline: assets.filter(a => a.status === 'Offline').length, maintenance: assets.filter(a => a.status === 'Maintenance').length };

    const viewOnly = modal?.mode === 'view';
    const isAdd = modal?.mode === 'add';

    return (
        <DashboardLayout>
            <section className="content-header" style={{ marginBottom: 20 }}>
                <h1>Asset Management <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>CMDB Inventory</span></h1>
            </section>

            {/* Summary cards */}
            <section className="kpi-grid" style={{ marginBottom: 20 }}>
                {[
                    { label: 'Total Assets', value: summary.total, color: 'blue', icon: 'ph-hard-drives' },
                    { label: 'Online', value: summary.online, color: 'green', icon: 'ph-check-circle' },
                    { label: 'Offline', value: summary.offline, color: 'red', icon: 'ph-x-circle' },
                    { label: 'Maintenance', value: summary.maintenance, color: 'orange', icon: 'ph-wrench' },
                ].map(c => (
                    <div key={c.label} className={`kpi-card ${c.color}`}>
                        <div className="kpi-card-header"><span className="kpi-card-title">{c.label}</span><i className={`ph ${c.icon} kpi-card-icon`} /></div>
                        <div className="kpi-card-value">{c.value}</div>
                    </div>
                ))}
            </section>

            {/* Toolbar */}
            <div className="panel-card">
                <div className="toolbar">
                    <input type="search" placeholder="Search by name or IP…" value={search} onChange={e => setSearch(e.target.value)} />
                    <select value={typeFilter} onChange={e => setType(e.target.value)}><option value="">All Types</option>{types.map(t => <option key={t} value={t}>{t}</option>)}</select>
                    <select value={statusFilter} onChange={e => setStatus(e.target.value)}><option value="">All Statuses</option>{statuses.map(s => <option key={s} value={s}>{s}</option>)}</select>
                    {hasPermission('ASSET_CREATE') && <button className="btn-add" onClick={openAdd}>+ Add Asset</button>}
                </div>

                {loading ? <Loader /> : (
                    <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead><tr><th>Name</th><th>Type</th><th>IP Address</th><th>Status</th><th>CPU</th><th>Memory</th><th>Disk</th><th>Location</th><th>Actions</th></tr></thead>
                            <tbody>
                                {filtered.length ? filtered.map(a => (
                                    <tr key={a.id}>
                                        <td><strong>{a.assetName}</strong></td>
                                        <td>{a.assetType}</td>
                                        <td><code style={{ fontSize: '0.82rem' }}>{a.ipAddress || '—'}</code></td>
                                        <td>
                                            <span className={`status-badge ${a.status?.toLowerCase()}`}>{a.status}</span>
                                        </td>
                                        <td>{miniBar(a.cpuUsage)}</td>
                                        <td>{miniBar(a.memoryUsage)}</td>
                                        <td>{miniBar(a.diskUsage)}</td>
                                        <td>{a.location || '—'}</td>
                                        <td>
                                            <button className="tbl-action tbl-view" onClick={() => openView(a)}>View</button>
                                            {hasPermission('ASSET_EDIT') && <button className="tbl-action tbl-edit" onClick={() => openEdit(a)}>Edit</button>}
                                            {hasPermission('ASSET_DELETE') && <button className="tbl-action tbl-delete" onClick={() => deleteAsset(a.id)}>Delete</button>}
                                        </td>
                                    </tr>
                                )) : <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 28 }}>No assets found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {modal && (
                <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal-box">
                        <div className="modal-header">
                            <h3>{isAdd ? 'Add Asset' : viewOnly ? 'Asset Details' : 'Edit Asset'}</h3>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>
                        <div className="modal-grid">
                            {[
                                ['assetName', 'Asset Name', 'text', 'text'], ['assetType', 'Type', 'select', null],
                                ['ipAddress', 'IP Address', 'text', 'text'], ['status', 'Status', 'select', null],
                                ['cpuUsage', 'CPU %', 'number', 'number'], ['memoryUsage', 'Memory %', 'number', 'number'],
                                ['diskUsage', 'Disk %', 'number', 'number'], ['networkUsage', 'Network %', 'number', 'number'],
                                ['location', 'Location', 'text', 'text'], ['uptime', 'Uptime', 'text', 'text'],
                            ].map(([name, label, type, inputType]) => (
                                <div className="modal-field" key={name}>
                                    <label>{label}</label>
                                    {type === 'select' && name === 'assetType' ? (
                                        <select name={name} value={form[name]} onChange={handleForm} disabled={viewOnly}>
                                            {['Server', 'Workstation', 'Router', 'Switch', 'Firewall', 'Database', 'Cloud Resource', 'Other'].map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                    ) : type === 'select' && name === 'status' ? (
                                        <select name={name} value={form[name]} onChange={handleForm} disabled={viewOnly}>
                                            {['Active', 'Inactive', 'Offline', 'Maintenance'].map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                    ) : (
                                        <input type={inputType} name={name} value={form[name] || ''} onChange={handleForm} disabled={viewOnly} />
                                    )}
                                </div>
                            ))}
                        </div>
                        {!viewOnly && (
                            <div className="modal-actions">
                                <button className="btn-modal-cancel" onClick={closeModal}>Cancel</button>
                                <button className="btn-modal-save" onClick={saveAsset} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
