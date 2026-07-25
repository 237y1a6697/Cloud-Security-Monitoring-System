import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import Loader from '../../components/common/Loader/Loader.jsx';
import { useToast } from '../../components/common/Toast/Toast.jsx';
import complianceService from '../../services/complianceService.js';

export default function CompliancePage() {
    const showToast = useToast();
    const [standards, setStandards] = useState([]);
    const [controls, setControls] = useState([]);
    const [loading, setLoading] = useState(true);

    async function fetchComplianceData() {
        try {
            const [standardsRes, controlsRes] = await Promise.all([
                complianceService.getStandards(),
                complianceService.getControls()
            ]);
            setStandards(standardsRes.data || []);
            setControls(controlsRes.data || []);
        } catch {
            showToast('Failed to fetch compliance center data', 'error');
        }
    }

    useEffect(() => {
        fetchComplianceData().then(() => setLoading(false));
    }, []);

    return (
        <DashboardLayout>
            <section className="content-header" style={{ marginBottom: 20 }}>
                <h1>Compliance Center <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>Regulatory alignment</span></h1>
            </section>

            {loading ? <Loader /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Regulatory Standards Cards */}
                    <section className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                        {standards.map((std) => (
                            <div key={std.id} className="stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 130 }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <span className="stat-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{std.name}</span>
                                        <span className={`badge badge-status ${std.status === 'Compliant' ? 'ok' : 'warning'}`} style={{ border: 'none', padding: '2px 8px' }}>
                                            {std.status}
                                        </span>
                                    </div>
                                    <div className="stat-value" style={{ fontSize: '1.8rem', margin: '6px 0' }}>{std.score}%</div>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                                        <span>Checks Passed</span>
                                        <span>{std.passed} / {std.total}</span>
                                    </div>
                                    <div style={{ width: '100%', height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{ width: `${std.score}%`, height: '100%', background: std.status === 'Compliant' ? 'var(--success-green)' : 'var(--warning-amber)', borderRadius: 3 }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </section>

                    {/* Controls table */}
                    <div className="panel-card">
                        <h2 className="panel-title" style={{ marginBottom: 15 }}>Mapped Regulatory Policy Control Checks</h2>
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Control ID</th>
                                        <th>Framework</th>
                                        <th>Control Name</th>
                                        <th>Status</th>
                                        <th>Audited By</th>
                                        <th>Checked Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {controls.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No compliance controls checks found.</td>
                                        </tr>
                                    ) : (
                                        controls.map((c) => (
                                            <tr key={c.id}>
                                                <td><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.id}</span></td>
                                                <td>{c.framework}</td>
                                                <td>{c.control}</td>
                                                <td>
                                                    <span className={`badge badge-status ${c.status === 'PASS' ? 'ok' : 'warning'}`}>
                                                        {c.status}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.checkedBy}</td>
                                                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.lastAudited}</td>
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
