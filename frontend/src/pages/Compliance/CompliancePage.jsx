import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import Loader from '../../components/common/Loader/Loader.jsx';
import { useToast } from '../../components/common/Toast/Toast.jsx';
import complianceService from '../../services/complianceService.js';
import '../../styles/compliance.css'; // New premium styles

export default function CompliancePage() {
    const showToast = useToast();
    const [standards, setStandards] = useState([]);
    const [controls, setControls] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filtering state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

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

    // Filter controls based on search and status
    const filteredControls = useMemo(() => {
        return controls.filter(c => {
            const matchesSearch = c.control.toLowerCase().includes(searchTerm.toLowerCase()) || c.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [controls, searchTerm, statusFilter]);

    return (
        <DashboardLayout>
            <section className="compliance-header">
                <h1 className="compliance-title">
                    Compliance Center
                    <span className="compliance-subtitle">Regulatory alignment</span>
                </h1>
            </section>

            {loading ? <Loader /> : (
                <div>
                    {/* Regulatory Standards Cards */}
                    <section className="compliance-grid">
                        {standards.map((std) => {
                            const isCompliant = std.status === 'Compliant';
                            const cardClass = isCompliant ? 'compliant' : 'warning';

                            return (
                                <div key={std.id} className={`compliance-card ${cardClass}`}>
                                    <div className="card-header-flex">
                                        <span className="standard-name">{std.name}</span>
                                        <span className={`status-badge ${cardClass}`}>
                                            {std.status}
                                        </span>
                                    </div>
                                    <div className="score-display">{std.score}%</div>
                                    <div className="progress-section">
                                        <div className="progress-stats">
                                            <span>Checks Passed</span>
                                            <span>{std.passed} / {std.total}</span>
                                        </div>
                                        <div className="progress-track">
                                            <div
                                                className={`progress-fill ${cardClass}`}
                                                style={{ width: `${std.score}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </section>

                    {/* Controls table */}
                    <div className="controls-panel">
                        <div className="panel-header-flex">
                            <h2 className="controls-title">Mapped Regulatory Policy Control Checks</h2>
                            <div className="filter-bar">
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Search controls..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                <select
                                    className="select-input"
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                >
                                    <option value="ALL">All Statuses</option>
                                    <option value="PASS">Pass</option>
                                    <option value="FAIL">Fail</option>
                                    <option value="WARNING">Warning</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="modern-table">
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
                                    {filteredControls.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                                                No compliance controls found matching your criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredControls.map((c) => (
                                            <tr key={c.id}>
                                                <td><span className="control-id">{c.id}</span></td>
                                                <td><span className="secondary-text">{c.framework}</span></td>
                                                <td><span className="control-name">{c.control}</span></td>
                                                <td>
                                                    <span className={`badge ${c.status ? c.status.toLowerCase() : 'fail'}`}>
                                                        {c.status}
                                                    </span>
                                                </td>
                                                <td><span className="secondary-text">{c.checkedBy}</span></td>
                                                <td><span className="secondary-text">{c.lastAudited}</span></td>
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
