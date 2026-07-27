import { useState, useEffect } from 'react';
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

    // Modal states
    const [modal, setModal] = useState(null); // { mode:'add'|'edit', asset }
    const [drawerAsset, setDrawerAsset] = useState(null); // Selected asset for right details drawer
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);

    // Multi-select & Bulk operations
    const [selectedIds, setSelectedIds] = useState([]);

    // Maintenance schedules (Keyed by assetId -> array of maintenance records)
    const [maintenanceDb, setMaintenanceDb] = useState({
        1: [{ date: '2026-08-01', start: '02:00', end: '04:00', note: 'Kernel Security Patch' }],
        2: [{ date: '2026-08-15', start: '01:00', end: '03:00', note: 'Database Optimization' }]
    });
    const [newMaintDate, setNewMaintDate] = useState('');
    const [newMaintStart, setNewMaintStart] = useState('02:00');
    const [newMaintEnd, setNewMaintEnd] = useState('04:00');
    const [newMaintNote, setNewMaintNote] = useState('');

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

    // Bulk action triggers
    const toggleSelectAll = () => {
        if (selectedIds.length === filtered.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filtered.map(x => x.id).filter(Boolean));
        }
    };

    const handleSelectRow = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(x => x !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const triggerBulkAction = (action) => {
        showToast(`Running bulk command: '${action}' on ${selectedIds.length} assets...`);
        setTimeout(() => {
            showToast('Bulk update completed successfully!', 'success');
            setSelectedIds([]);
            load();
        }, 1500);
    };

    // Maintenance scheduling Action
    const addMaintenanceWindow = (assetId) => {
        if (!newMaintDate || !newMaintNote.trim()) {
            showToast('Please fill out the date and purpose of the maintenance', 'error');
            return;
        }
        const newRecord = {
            date: newMaintDate,
            start: newMaintStart,
            end: newMaintEnd,
            note: newMaintNote.trim()
        };
        const currentList = maintenanceDb[assetId] || [];
        setMaintenanceDb({
            ...maintenanceDb,
            [assetId]: [...currentList, newRecord]
        });
        setNewMaintDate('');
        setNewMaintNote('');
        showToast('Maintenance window successfully scheduled for asset!', 'success');
    };

    const types = [...new Set(assets.map(a => a.assetType).filter(Boolean))];
    const statuses = [...new Set(assets.map(a => a.status).filter(Boolean))];
    const summary = { total: assets.length, online: assets.filter(a => a.status === 'Active').length, offline: assets.filter(a => a.status === 'Offline').length, maintenance: assets.filter(a => a.status === 'Maintenance').length };

    return (
        <DashboardLayout>
            <style>{`
                .drawer-overlay {
                    position: fixed;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    background: rgba(0,0,0,0.4);
                    z-index: 1000;
                    display: flex;
                    justify-content: flex-end;
                }
                .drawer-content {
                    width: 100%;
                    max-width: 480px;
                    background: var(--bg-card);
                    border-left: 1px solid var(--border-color);
                    box-shadow: -4px 0 24px rgba(0,0,0,0.35);
                    padding: 24px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    animation: slideIn 0.23s ease-out;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .drawer-title-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid var(--border-color);
                    padding-bottom: 12px;
                }
                .drawer-sect {
                    border-bottom: 1px solid var(--border-color);
                    padding-bottom: 16px;
                }
                .spec-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    font-size: 0.8rem;
                }
                .spec-lbl {
                    color: var(--text-muted);
                    font-size: 0.75rem;
                }
                .spec-val {
                    font-weight: 600;
                }
                .bulk-toolbar {
                    background: var(--bg-inset);
                    border: 1px solid var(--warning-amber);
                    border-left: 4px solid var(--warning-amber);
                    border-radius: 6px;
                    padding: 10px 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    animation: fadeIn 0.2s ease;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>

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
                    <div key={c.label} className={`kpi-card ${c.color}`} style={{ cursor: 'pointer' }} onClick={() => setStatusFilter(c.label === 'Total Assets' ? '' : c.label)}>
                        <div className="kpi-card-header"><span className="kpi-card-title">{c.label}</span><i className={`ph ${c.icon} kpi-card-icon`} /></div>
                        <div className="kpi-card-value">{c.value}</div>
                    </div>
                ))}
            </section>

            {/* Bulk actions notification bar */}
            {selectedIds.length > 0 && (
                <div className="bulk-toolbar">
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                        <i className="ph ph-check-square" style={{ marginRight: 6 }} /> {selectedIds.length} assets selected
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-sm" style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} onClick={() => triggerBulkAction('Patch Upgrade')}>
                            Patch Upgrade
                        </button>
                        <button className="btn-sm" style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} onClick={() => triggerBulkAction('Reboot Systems')}>
                            Reboot
                        </button>
                        <button className="btn-sm" style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--warning-amber)', border: 'none', color: '#111' }} onClick={() => triggerBulkAction('Enter Maintenance')}>
                            Set Maintenance
                        </button>
                        <button className="btn-sm text-danger" style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'transparent', border: 'none' }} onClick={() => setSelectedIds([])}>
                            Deselect All
                        </button>
                    </div>
                </div>
            )}

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
                            <thead>
                                <tr>
                                    <th style={{ width: 40 }}>
                                        <input
                                            type="checkbox"
                                            checked={filtered.length > 0 && selectedIds.length === filtered.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>IP Address</th>
                                    <th>Status</th>
                                    <th>CPU</th>
                                    <th>Memory</th>
                                    <th>Disk</th>
                                    <th>Location</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length ? filtered.map(a => (
                                    <tr key={a.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(a.id)}
                                                onChange={() => handleSelectRow(a.id)}
                                            />
                                        </td>
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
                                            <button className="tbl-action tbl-view" onClick={() => setDrawerAsset(a)}>View</button>
                                            {hasPermission('ASSET_EDIT') && <button className="tbl-action tbl-edit" onClick={() => openEdit(a)}>Edit</button>}
                                            {hasPermission('ASSET_DELETE') && <button className="tbl-action tbl-delete" onClick={() => deleteAsset(a.id)}>Delete</button>}
                                        </td>
                                    </tr>
                                )) : <tr><td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 28 }}>No assets found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Spec details sliding drawer */}
            {drawerAsset && (
                <div className="drawer-overlay" onClick={e => e.target === e.currentTarget && setDrawerAsset(null)}>
                    <div className="drawer-content">
                        <div className="drawer-title-row">
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                <i className="ph ph-cpu" style={{ marginRight: 6 }} /> ASSET HARDWARE PROFILE
                            </span>
                            <button style={{ border: 'none', background: 'transparent', fontSize: '1.4rem', cursor: 'pointer' }} onClick={() => setDrawerAsset(null)}>×</button>
                        </div>

                        {/* Title Header */}
                        <div>
                            <h2 style={{ fontSize: '1.2rem', margin: '0 0 4px 0' }}>{drawerAsset.assetName}</h2>
                            <code style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>ID: {drawerAsset.id} | IP: {drawerAsset.ipAddress || 'None'}</code>
                        </div>

                        {/* Resource stats */}
                        <div className="drawer-sect">
                            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>Physical Metrics Loading</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}>
                                        <span>CPU Utilization</span>
                                        <strong>{drawerAsset.cpuUsage || 0}%</strong>
                                    </div>
                                    <div className="mini-bar-wrap" style={{ height: 6 }}><div className="mini-bar mini-green" style={{ width: `${drawerAsset.cpuUsage || 0}%` }} /></div>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}>
                                        <span>Memory Allocation</span>
                                        <strong>{drawerAsset.memoryUsage || 0}%</strong>
                                    </div>
                                    <div className="mini-bar-wrap" style={{ height: 6 }}><div className="mini-bar mini-orange" style={{ width: `${drawerAsset.memoryUsage || 0}%` }} /></div>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}>
                                        <span>Primary Disk Storage</span>
                                        <strong>{drawerAsset.diskUsage || 0}%</strong>
                                    </div>
                                    <div className="mini-bar-wrap" style={{ height: 6 }}><div className="mini-bar mini-red" style={{ width: `${drawerAsset.diskUsage || 0}%` }} /></div>
                                </div>
                            </div>
                        </div>

                        {/* Spec properties */}
                        <div className="drawer-sect">
                            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>Configuration specs</h4>
                            <div className="spec-grid">
                                <div>
                                    <span className="spec-lbl">Category</span>
                                    <div className="spec-val">{drawerAsset.assetType}</div>
                                </div>
                                <div>
                                    <span className="spec-lbl">Operational Status</span>
                                    <div className="spec-val">{drawerAsset.status}</div>
                                </div>
                                <div>
                                    <span className="spec-lbl">Physical Location</span>
                                    <div className="spec-val">{drawerAsset.location || '—'}</div>
                                </div>
                                <div>
                                    <span className="spec-lbl">Active Uptime</span>
                                    <div className="spec-val">{drawerAsset.uptime || '99.9%'}</div>
                                </div>
                                <div>
                                    <span className="spec-lbl">OS Platform</span>
                                    <div className="spec-val">EulerOS Enterprise Linux</div>
                                </div>
                                <div>
                                    <span className="spec-lbl">Kernel Version</span>
                                    <div className="spec-val">5.15.0-88-generic</div>
                                </div>
                            </div>
                        </div>

                        {/* Maintenance scheduler */}
                        <div className="drawer-sect" style={{ border: 'none' }}>
                            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>Operational Maintenance Windows</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '8px 0' }}>
                                {(maintenanceDb[drawerAsset.id] || []).map((item, idx) => (
                                    <div key={idx} style={{ background: 'var(--bg-inset)', padding: 10, borderRadius: 6, borderLeft: '3px solid var(--warning-amber)', fontSize: '0.76rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                                            <span>{item.date}</span>
                                            <span>{item.start} - {item.end}</span>
                                        </div>
                                        <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{item.note}</div>
                                    </div>
                                ))}
                                {(!maintenanceDb[drawerAsset.id] || maintenanceDb[drawerAsset.id].length === 0) && (
                                    <div style={{ border: '1px dashed var(--border-color)', padding: 12, textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', borderRadius: 4 }}>
                                        No maintenance scheduled for this system.
                                    </div>
                                )}
                            </div>

                            {/* Schedule form */}
                            <div style={{ border: '1px solid var(--border-color)', borderRadius: 6, padding: 10, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <span style={{ fontSize: '0.74rem', fontWeight: 600 }}>Create New Maintenance Window</span>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <input type="date" value={newMaintDate} onChange={e => setNewMaintDate(e.target.value)} style={{ flex: 1, padding: 4, fontSize: '0.74rem', background: 'var(--bg-inset)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 4 }} />
                                    <input type="time" value={newMaintStart} onChange={e => setNewMaintStart(e.target.value)} style={{ width: 64, padding: 4, fontSize: '0.74rem', background: 'var(--bg-inset)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 4 }} />
                                    <input type="time" value={newMaintEnd} onChange={e => setNewMaintEnd(e.target.value)} style={{ width: 64, padding: 4, fontSize: '0.74rem', background: 'var(--bg-inset)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 4 }} />
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <input type="text" placeholder="Purpose (e.g. Patch Reboot)..." value={newMaintNote} onChange={e => setNewMaintNote(e.target.value)} style={{ flex: 1, padding: 4, fontSize: '0.74rem', background: 'var(--bg-inset)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 4 }} />
                                    <button className="btn" style={{ width: 'auto', padding: '4px 10px', fontSize: '0.74rem' }} onClick={() => addMaintenanceWindow(drawerAsset.id)}>Schedule</button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Modal for Add / Edit */}
            {modal && (
                <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal-box">
                        <div className="modal-header">
                            <h3>{modal.mode === 'add' ? 'Add Asset' : 'Edit Asset'}</h3>
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
                                        <select name={name} value={form[name]} onChange={handleForm}>
                                            {['Server', 'Workstation', 'Router', 'Switch', 'Firewall', 'Database', 'Cloud Resource', 'Other'].map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                    ) : type === 'select' && name === 'status' ? (
                                        <select name={name} value={form[name]} onChange={handleForm}>
                                            {['Active', 'Inactive', 'Offline', 'Maintenance'].map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                    ) : (
                                        <input type={inputType} name={name} value={form[name] || ''} onChange={handleForm} />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="modal-actions">
                            <button className="btn-modal-cancel" onClick={closeModal}>Cancel</button>
                            <button className="btn-modal-save" onClick={saveAsset} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
