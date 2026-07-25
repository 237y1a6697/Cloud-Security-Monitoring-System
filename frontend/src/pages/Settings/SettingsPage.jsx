import { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useToast } from '../../components/common/Toast/Toast.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Swal from 'sweetalert2';

export default function SettingsPage() {
    const showToast = useToast();
    const { hasRole } = useAuth();
    const [retention, setRetention] = useState('90 Days');
    const [debugLevel, setDebugLevel] = useState('INFO');
    const [simSpeed, setSimSpeed] = useState('Fast (2s)');

    // Enforce ADMIN or SUPER_ADMIN role guard inside component
    const isAuthorized = hasRole('ROLE_ADMIN') || hasRole('ROLE_SUPER_ADMIN');

    function handleSave() {
        if (!isAuthorized) {
            Swal.fire('Access Denied', 'Only administrators can update system settings.', 'error');
            return;
        }
        showToast('Settings saved successfully.', 'success');
    }

    if (!isAuthorized) {
        return (
            <DashboardLayout>
                <section className="content-header" style={{ marginBottom: 20 }}>
                    <h1>System Settings</h1>
                </section>
                <div className="panel-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <i className="ph ph-shield-warning" style={{ fontSize: '3rem', color: 'var(--danger-red)', marginBottom: 15 }} />
                    <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Access Denied</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>You do not have the required administrative role to view or modify general system settings.</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <section className="content-header" style={{ marginBottom: 20 }}>
                <h1>Enterprise Settings &amp; Integration <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>System configuration</span></h1>
            </section>

            <div className="panel-card" style={{ maxWidth: 800, margin: '20px auto' }}>
                <h2 className="panel-title" style={{ marginBottom: 20 }}>General System Configuration</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <strong style={{ color: 'var(--text-primary)' }}>Audit Log Retention</strong>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Configure keeping audit trail logs database entries</div>
                        </div>
                        <select
                            style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 6, background: 'var(--bg-inset)', color: 'var(--text-primary)', outline: 'none' }}
                            value={retention}
                            onChange={(e) => setRetention(e.target.value)}
                        >
                            <option>90 Days</option>
                            <option>180 Days</option>
                            <option>365 Days</option>
                            <option>Forever</option>
                        </select>
                    </div>

                    <hr style={{ border: 0, borderTop: '1px solid var(--border-color)' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <strong style={{ color: 'var(--text-primary)' }}>Debug Level Monitoring</strong>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Adjust log verbosity levels on stdout stream</div>
                        </div>
                        <select
                            style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 6, background: 'var(--bg-inset)', color: 'var(--text-primary)', outline: 'none' }}
                            value={debugLevel}
                            onChange={(e) => setDebugLevel(e.target.value)}
                        >
                            <option>INFO</option>
                            <option>DEBUG</option>
                            <option>TRACE</option>
                            <option>ERROR</option>
                        </select>
                    </div>

                    <hr style={{ border: 0, borderTop: '1px solid var(--border-color)' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <strong style={{ color: 'var(--text-primary)' }}>Telemetry Simulator Speed</strong>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Changes system health metrics refresh rate</div>
                        </div>
                        <select
                            style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 6, background: 'var(--bg-inset)', color: 'var(--text-primary)', outline: 'none' }}
                            value={simSpeed}
                            onChange={(e) => setSimSpeed(e.target.value)}
                        >
                            <option>Fast (2s)</option>
                            <option>Medium (5s)</option>
                            <option>Slow (10s)</option>
                        </select>
                    </div>

                    <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            className="btn"
                            style={{ width: 'auto', padding: '10px 24px' }}
                            onClick={handleSave}
                        >
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
