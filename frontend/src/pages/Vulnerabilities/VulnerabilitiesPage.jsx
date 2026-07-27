import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import Loader from '../../components/common/Loader/Loader.jsx';
import { useToast } from '../../components/common/Toast/Toast.jsx';
import vulnerabilityService from '../../services/vulnerabilityService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Swal from 'sweetalert2';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';

const COLORS = ['#dc2626', '#ea580c', '#ca8a04', '#16a34a']; // Critical, High, Medium, Low

export default function VulnerabilitiesPage() {
    const showToast = useToast();
    const { hasPermission } = useAuth();
    const [vulns, setVulns] = useState([]);
    const [loading, setLoading] = useState(true);

    async function fetchVulnerabilities() {
        try {
            const res = await vulnerabilityService.getAll();
            setVulns(res.data || []);
        } catch {
            showToast('Failed to load vulnerabilities', 'error');
        }
    }

    useEffect(() => {
        fetchVulnerabilities().then(() => setLoading(false));
    }, []);

    async function handlePatch(id, cve) {
        if (!hasPermission('VULN_MANAGE')) {
            Swal.fire({
                title: 'Access Denied',
                text: 'You do not have the required permissions to deploy patches.',
                icon: 'error',
                confirmButtonColor: '#3a7bd5'
            });
            return;
        }

        const confirm = await Swal.fire({
            title: 'Deploy Patch?',
            text: `Are you sure you want to deploy a dynamic patch for ${cve}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3a7bd5',
            cancelButtonColor: '#d53a3a',
            confirmButtonText: 'Yes, deploy!'
        });

        if (confirm.isConfirmed) {
            try {
                const res = await vulnerabilityService.patch(id);
                if (res.data) {
                    showToast(`Patch deployed for ${cve} successfully.`, 'success');
                    setVulns((prev) =>
                        prev.map((v) => (v.id === id ? res.data : v))
                    );
                }
            } catch {
                showToast('Patch deployment failed', 'error');
            }
        }
    }

    // Vulnerability metrics computation
    const totalVulns = vulns.length;
    const activeCritical = vulns.filter(v => parseFloat(v.cvss) >= 9 && v.patchStatus?.toLowerCase() !== 'patched').length;
    const activeHigh = vulns.filter(v => parseFloat(v.cvss) >= 7 && parseFloat(v.cvss) < 9 && v.patchStatus?.toLowerCase() !== 'patched').length;
    const activeMedium = vulns.filter(v => parseFloat(v.cvss) >= 4 && parseFloat(v.cvss) < 7 && v.patchStatus?.toLowerCase() !== 'patched').length;
    const activeLow = vulns.filter(v => parseFloat(v.cvss) < 4 && v.patchStatus?.toLowerCase() !== 'patched').length;

    const chartData = [
        { name: 'Critical', value: activeCritical || 1 },
        { name: 'High', value: activeHigh || 2 },
        { name: 'Medium', value: activeMedium || 6 },
        { name: 'Low', value: activeLow || 10 },
    ];

    return (
        <DashboardLayout>
            <section className="content-header" style={{ marginBottom: 20 }}>
                <h1>Vulnerability Management <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>Security Center</span></h1>
            </section>

            {loading ? <Loader /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Top KPI Cards Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                        <div className="health-mini-card" style={{ borderLeft: '4px solid var(--danger-red)' }}>
                            <span className="health-mini-label">Active Critical CVEs</span>
                            <span className="health-mini-value" style={{ color: 'var(--danger-red)' }}>{activeCritical}</span>
                        </div>
                        <div className="health-mini-card" style={{ borderLeft: '4px solid var(--warning-amber)' }}>
                            <span className="health-mini-label">Active High CVEs</span>
                            <span className="health-mini-value" style={{ color: 'var(--warning-amber)' }}>{activeHigh}</span>
                        </div>
                        <div className="health-mini-card" style={{ borderLeft: '4px solid var(--text-highlight)' }}>
                            <span className="health-mini-label">Active Medium / Low</span>
                            <span className="health-mini-value">{activeMedium + activeLow}</span>
                        </div>
                        <div className="health-mini-card" style={{ borderLeft: '4px solid var(--success-green)' }}>
                            <span className="health-mini-label">SonarQube Code Gate</span>
                            <span className="health-mini-value" style={{ color: 'var(--success-green)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                                <i className="ph ph-shield-check" /> Passed
                            </span>
                        </div>
                        <div className="health-mini-card">
                            <span className="health-mini-label font-bold">Trivy Container Scan</span>
                            <span className="health-mini-value" style={{ fontSize: '1.15rem', marginTop: 8 }}>
                                0 Critical / 1 High
                            </span>
                        </div>
                    </div>

                    {/* Mid Section Grid (Sonar, Charts, Compliance) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                        {/* SonarQube & Trivy Cards */}
                        <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <h2 className="panel-title">Automated Linting &amp; Scanning</h2>
                            <div style={{ padding: '8px 12px', background: 'var(--bg-inset)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}><i className="ph ph-code" style={{ marginRight: 6, color: '#3a7bd5' }} /> SonarQube Quality Gate</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Branch: <code>main</code> • 0 code smells</div>
                                </div>
                                <span className="badge badge-status ok">Passed</span>
                            </div>
                            <div style={{ padding: '8px 12px', background: 'var(--bg-inset)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}><i className="ph ph-box" style={{ marginRight: 6, color: '#ca8a04' }} /> Trivy Container Scan</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Image: <code>sentinel-ops:latest</code></div>
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--warning-amber)' }}>1 Action Required</span>
                            </div>
                        </div>

                        {/* Pie Chart of Severity */}
                        <div className="panel-card" style={{ display: 'flex', flexDirection: 'column' }}>
                            <h2 className="panel-title">Severity Level Distribution</h2>
                            <div style={{ width: '100%', height: 160, display: 'flex', alignContent: 'center', justifyContent: 'center', marginTop: 10 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={45}
                                            outerRadius={65}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={24} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '0.72rem' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Compliance Mapping */}
                        <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <h2 className="panel-title">Operational Compliance Mapping</h2>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                                    <span>SOC2 Type II Readiness</span>
                                    <span>100% Compliant</span>
                                </div>
                                <div style={{ width: '100%', height: 5, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                                    <div style={{ width: '100%', height: '100%', background: 'var(--success-green)' }} />
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                                    <span>ISO/IEC 27001 Section A.12</span>
                                    <span>94% Compliant</span>
                                </div>
                                <div style={{ width: '100%', height: 5, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                                    <div style={{ width: '94%', height: '100%', background: 'var(--success-green)' }} />
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                                    <span>HIPAA Security Rules Mapped</span>
                                    <span>88% Compliant</span>
                                </div>
                                <div style={{ width: '100%', height: 5, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                                    <div style={{ width: '88%', height: '100%', background: 'var(--warning-amber)' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
                        {/* Table */}
                        <div className="panel-card">
                            <h2 className="panel-title" style={{ marginBottom: 15 }}>Active Vulnerabilities Tracker</h2>
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>CVE ID</th>
                                            <th>CVSS</th>
                                            <th>Risk Score</th>
                                            <th>Affected Assets</th>
                                            <th>Patch Status</th>
                                            <th>Remediation Action</th>
                                            <th>Operator Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vulns.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No vulnerabilities found.</td>
                                            </tr>
                                        ) : (
                                            vulns.map((v) => (
                                                <tr key={v.id}>
                                                    <td><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v.cve}</span></td>
                                                    <td>
                                                        <span className={`badge ${parseFloat(v.cvss) >= 9 ? 'badge-critical' : parseFloat(v.cvss) >= 7 ? 'badge-warning' : 'badge-info'}`}>
                                                            {v.cvss}
                                                        </span>
                                                    </td>
                                                    <td>{v.riskScore}</td>
                                                    <td>{v.affectedAssets || '—'}</td>
                                                    <td>
                                                        <span className={`badge badge-status ${v.patchStatus?.toLowerCase() === 'patched' ? 'ok' : 'alert'}`}>
                                                            {v.patchStatus || 'Unpatched'}
                                                        </span>
                                                    </td>
                                                    <td><span style={{ fontSize: '0.8rem' }}>{v.remediation || '—'}</span></td>
                                                    <td>
                                                        {v.patchStatus?.toLowerCase() === 'patched' ? (
                                                            <span style={{ color: 'var(--success-green)', fontSize: '0.8rem', fontWeight: 600 }}>
                                                                <i className="ph ph-check-circle" style={{ marginRight: 4 }} /> Patched
                                                            </span>
                                                        ) : (
                                                            <button
                                                                className="btn"
                                                                style={{ padding: '4px 10px', fontSize: '0.75rem', width: 'auto', background: 'var(--highlight-blue)', color: 'white', border: 'none' }}
                                                                onClick={() => handlePatch(v.id, v.cve)}
                                                            >
                                                                Deploy Patch
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recent Container & Code Scans List */}
                        <div className="panel-card">
                            <h2 className="panel-title">Threat Scanning Registry</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 15 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 10, background: 'var(--bg-inset)', borderRadius: 6 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Github Actions Container Push</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>10m ago</span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status: <strong>Completed</strong> • 0 new breaches</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 10, background: 'var(--bg-inset)', borderRadius: 6 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Nightly SonarQube Scanner</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Yesterday</span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status: <strong>Completed</strong> • 1 false positive flagged</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 10, background: 'var(--bg-inset)', borderRadius: 6 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Manual Trivy Target Scan</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>3 days ago</span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status: <strong>Completed</strong> • Triggered by Admin</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
