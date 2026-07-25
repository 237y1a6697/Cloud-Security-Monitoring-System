import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import Loader from '../../components/common/Loader/Loader.jsx';
import { useToast } from '../../components/common/Toast/Toast.jsx';
import vulnerabilityService from '../../services/vulnerabilityService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Swal from 'sweetalert2';

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
                    // Update local state
                    setVulns((prev) =>
                        prev.map((v) => (v.id === id ? res.data : v))
                    );
                }
            } catch {
                showToast('Patch deployment failed', 'error');
            }
        }
    }

    return (
        <DashboardLayout>
            <section className="content-header" style={{ marginBottom: 20 }}>
                <h1>Vulnerability Management <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>Security Center</span></h1>
            </section>

            {loading ? <Loader /> : (
                <div className="panel-card">
                    <h2 className="panel-title" style={{ marginBottom: 15 }}>Active Vulnerabilities Tracker</h2>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>CVE</th>
                                    <th>CVSS</th>
                                    <th>Risk Score</th>
                                    <th>Affected Assets</th>
                                    <th>Patch Status</th>
                                    <th>Remediation</th>
                                    <th>Action</th>
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
                                            <td>{v.remediation || '—'}</td>
                                            <td>
                                                {v.patchStatus?.toLowerCase() === 'patched' ? (
                                                    <span style={{ color: 'var(--success-green)', fontSize: '0.8rem', fontWeight: 600 }}>
                                                        <i className="ph ph-check-circle" style={{ marginRight: 4 }} /> Remediated
                                                    </span>
                                                ) : (
                                                    <button
                                                        className="btn"
                                                        style={{ padding: '4px 10px', fontSize: '0.75rem', width: 'auto' }}
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
            )}
        </DashboardLayout>
    );
}
