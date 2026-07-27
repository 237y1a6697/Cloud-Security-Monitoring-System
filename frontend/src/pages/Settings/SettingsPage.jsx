import { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useToast } from '../../components/common/Toast/Toast.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Swal from 'sweetalert2';

export default function SettingsPage() {
    const showToast = useToast();
    const { hasRole } = useAuth();
    const [activeTab, setActiveTab] = useState('general');

    // Tab 1: General settings
    const [retention, setRetention] = useState('90 Days');
    const [debugLevel, setDebugLevel] = useState('INFO');
    const [simSpeed, setSimSpeed] = useState('Fast (2s)');

    // Tab 2: Password Policy checklist states
    const [minLength, setMinLength] = useState(12);
    const [requireUpper, setRequireUpper] = useState(true);
    const [requireSpecial, setRequireSpecial] = useState(true);
    const [passwordExpiry, setPasswordExpiry] = useState(90);
    const [lockoutAttempts, setLockoutAttempts] = useState(5);

    // Tab 3: SIEM Correlation Rules states
    const [rules, setRules] = useState([
        { id: 'RULE-01', name: 'Brute-force Scanner Detected', type: 'Auth', threshold: '10 failed attempts within 1 min', enabled: true },
        { id: 'RULE-02', name: 'Unusual Outbound Transmit Volume', type: 'Network', threshold: 'Over 5GB exported in 10 mins', enabled: true },
        { id: 'RULE-03', name: 'Stale SSH Key Logon Attempt', type: 'Privilege', threshold: 'Ingress on retired developer user', enabled: false },
        { id: 'RULE-04', name: 'Multi-Region Admin Concurrency', type: 'Access', threshold: 'Logins from different locations in < 15 mins', enabled: true }
    ]);

    // Tab 4: Backups states
    const [autoBackupFreq, setAutoBackupFreq] = useState('Daily');
    const [backupS3Bucket, setBackupS3Bucket] = useState('s3://sentinelstore-vault-prod');
    const [backups, setBackups] = useState([
        { id: 'BKP-789', timestamp: '2026-07-25 04:00:23', size: '1.42 GB', status: 'Success' },
        { id: 'BKP-788', timestamp: '2026-07-24 04:00:15', size: '1.41 GB', status: 'Success' }
    ]);
    const [backingUp, setBackingUp] = useState(false);

    // Enforce ADMIN or SUPER_ADMIN role guard inside component
    const isAuthorized = hasRole('ROLE_ADMIN') || hasRole('ROLE_SUPER_ADMIN');

    function handleSaveGeneral() {
        if (!isAuthorized) {
            Swal.fire('Access Denied', 'Only administrators can update system settings.', 'error');
            return;
        }
        showToast('General system configurations saved successfully.', 'success');
    }

    function handleSavePasswordPolicy() {
        if (!isAuthorized) {
            Swal.fire('Access Denied', 'Only administrators can configure authentication policies.', 'error');
            return;
        }
        showToast('Password security policies updated in AD system.', 'success');
    }

    const toggleRule = (id) => {
        if (!isAuthorized) {
            Swal.fire('Access Denied', 'Only administrators can toggle SIEM correlation rules.', 'error');
            return;
        }
        setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
        showToast('SIEM rule state updated.', 'info');
    };

    const runImmediateBackup = () => {
        if (!isAuthorized) {
            Swal.fire('Access Denied', 'Only administrators can execute manual database backups.', 'error');
            return;
        }
        setBackingUp(true);
        showToast('Staging PostgreSQL database locks and copying write-ahead logs...');

        setTimeout(() => {
            const newBackup = {
                id: `BKP-${Math.floor(100 + Math.random() * 900)}`,
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                size: '1.43 GB',
                status: 'Success'
            };
            setBackups([newBackup, ...backups]);
            setBackingUp(false);
            showToast('AES-256 database backup created and synced to secure S3 storage!', 'success');
        }, 2200);
    };

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
            <style>{`
                .settings-tab-list {
                    display: flex;
                    gap: 15px;
                    border-bottom: 2px solid var(--border-color);
                    margin-bottom: 25px;
                    padding-bottom: 2px;
                }
                .settings-tab {
                    background: transparent;
                    border: none;
                    color: var(--text-muted);
                    padding: 8px 16px;
                    font-size: 0.86rem;
                    font-weight: 600;
                    cursor: pointer;
                    position: relative;
                }
                .settings-tab.active {
                    color: var(--highlight-blue);
                }
                .settings-tab.active::after {
                    content: '';
                    position: absolute;
                    bottom: -4px;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: var(--highlight-blue);
                }
                .policy-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 0;
                    border-bottom: 1px solid var(--border-color);
                }
                .policy-rule-input {
                    padding: 6px 10px;
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    background: var(--bg-inset);
                    color: var(--text-primary);
                    width: 70px;
                    text-align: center;
                }
                .siem-rule-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: var(--bg-inset);
                    border: 1px solid var(--border-color);
                    padding: 12px 16px;
                    border-radius: 6px;
                }
            `}</style>

            <section className="content-header" style={{ marginBottom: 20 }}>
                <h1>Enterprise Settings &amp; Integration <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>System configuration</span></h1>
            </section>

            <div className="panel-card" style={{ maxWidth: 900, margin: '0 auto' }}>
                {/* Navigation Tabs */}
                <div className="settings-tab-list">
                    <button className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
                        General Admin
                    </button>
                    <button className={`settings-tab ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>
                        Password Policy
                    </button>
                    <button className={`settings-tab ${activeTab === 'siem' ? 'active' : ''}`} onClick={() => setActiveTab('siem')}>
                        SIEM Correlation
                    </button>
                    <button className={`settings-tab ${activeTab === 'backup' ? 'active' : ''}`} onClick={() => setActiveTab('backup')}>
                        Data Backups
                    </button>
                </div>

                {/* Tab 1: General */}
                {activeTab === 'general' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.2s ease' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>Global Core Directives</h3>

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

                        <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: 0 }} />

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

                        <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: 0 }} />

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

                        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn" style={{ width: 'auto', padding: '10px 24px' }} onClick={handleSaveGeneral}>
                                Save Configuration
                            </button>
                        </div>
                    </div>
                )}

                {/* Tab 2: Password Policy Checklist */}
                {activeTab === 'password' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15, animation: 'fadeIn 0.2s ease' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>Interactive Password Security Rules</h3>
                        <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>Establish active identity authentication validation requirements enforced on user registries/changes.</p>

                        <div className="policy-item">
                            <div>
                                <strong style={{ color: 'var(--text-primary)' }}>Minimum Password Length</strong>
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Require user passwords to satisfy a minimal length</div>
                            </div>
                            <input
                                type="number"
                                className="policy-rule-input"
                                value={minLength}
                                onChange={(e) => setMinLength(parseInt(e.target.value) || 8)}
                            />
                        </div>

                        <div className="policy-item">
                            <div>
                                <strong style={{ color: 'var(--text-primary)' }}>Require Uppercase Character</strong>
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Enforce at least one A-Z character in passwords</div>
                            </div>
                            <input
                                type="checkbox"
                                checked={requireUpper}
                                onChange={(e) => setRequireUpper(e.target.checked)}
                                style={{ width: 18, height: 18 }}
                            />
                        </div>

                        <div className="policy-item">
                            <div>
                                <strong style={{ color: 'var(--text-primary)' }}>Require Special Cryptographic Symbol</strong>
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Enforce symbols such as !, @, #, $, % inside validation</div>
                            </div>
                            <input
                                type="checkbox"
                                checked={requireSpecial}
                                onChange={(e) => setRequireSpecial(e.target.checked)}
                                style={{ width: 18, height: 18 }}
                            />
                        </div>

                        <div className="policy-item">
                            <div>
                                <strong style={{ color: 'var(--text-primary)' }}>Force Refresh Interval (Days)</strong>
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Days until users must execute a credential rollover change</div>
                            </div>
                            <input
                                type="number"
                                className="policy-rule-input"
                                value={passwordExpiry}
                                onChange={(e) => setPasswordExpiry(parseInt(e.target.value) || 90)}
                            />
                        </div>

                        <div className="policy-item">
                            <div>
                                <strong style={{ color: 'var(--text-primary)' }}>Auth Lockout Max Failed Attempts</strong>
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Consecutive failures before domain locker triggers</div>
                            </div>
                            <input
                                type="number"
                                className="policy-rule-input"
                                value={lockoutAttempts}
                                onChange={(e) => setLockoutAttempts(parseInt(e.target.value) || 5)}
                            />
                        </div>

                        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn" style={{ width: 'auto', padding: '10px 24px' }} onClick={handleSavePasswordPolicy}>
                                Save Access Policy
                            </button>
                        </div>
                    </div>
                )}

                {/* Tab 3: SIEM Correlation Rules */}
                {activeTab === 'siem' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15, animation: 'fadeIn 0.2s ease' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>Incident Correlation &amp; Alert Rules</h3>
                        <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>Manage the system rules that trigger incident alerts inside the SOAR dashboard feed.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {rules.map((rule) => (
                                <div key={rule.id} className="siem-rule-row">
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <code style={{ fontSize: '0.72rem', background: 'var(--bg-card)', padding: '2px 6px', borderRadius: 4 }}>{rule.id}</code>
                                            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{rule.name}</span>
                                            <span className={`status-badge active`} style={{ fontSize: '0.64rem', padding: '1px 5px' }}>{rule.type}</span>
                                        </div>
                                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                                            Trigger: {rule.threshold}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.74rem', color: rule.enabled ? 'var(--success-green)' : 'var(--text-muted)', fontWeight: 600 }}>
                                            {rule.enabled ? 'ACTIVE RUNNING' : 'DISABLED'}
                                        </span>
                                        <input
                                            type="checkbox"
                                            checked={rule.enabled}
                                            onChange={() => toggleRule(rule.id)}
                                            style={{ width: 36, height: 18, cursor: 'pointer' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tab 4: Backups tab */}
                {activeTab === 'backup' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15, animation: 'fadeIn 0.2s ease' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>Database Backup Archival</h3>
                        <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>Protect systems config telemetry. Sync compressed archives directly to localized or AWS S3 vaults.</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Scheduled Frequency</label>
                                <select
                                    value={autoBackupFreq}
                                    onChange={e => setAutoBackupFreq(e.target.value)}
                                    style={{ width: '100%', padding: 8, fontSize: '0.8rem', background: 'var(--bg-inset)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 6 }}
                                >
                                    <option>Hourly</option>
                                    <option>Daily</option>
                                    <option>Weekly</option>
                                    <option>Disabled</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: 4 }}>S3 Vault URI</label>
                                <input
                                    type="text"
                                    value={backupS3Bucket}
                                    onChange={e => setBackupS3Bucket(e.target.value)}
                                    style={{ width: '100%', padding: 8, fontSize: '0.8rem', background: 'var(--bg-inset)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 6 }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 10 }}>
                            <button className="btn" style={{ width: 'auto', padding: '10px 20px' }} onClick={runImmediateBackup} disabled={backingUp}>
                                {backingUp ? <><i className="ph ph-spinner spinner" style={{ marginRight: 6 }} /> Archiving DB...</> : 'Backup Database Now'}
                            </button>
                        </div>

                        <div style={{ marginTop: 15 }}>
                            <h4 style={{ fontSize: '0.84rem', color: 'var(--text-primary)', marginBottom: 8 }}><i className="ph ph-list" style={{ marginRight: 6 }} /> Archive History Logs</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {backups.map((b) => (
                                    <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-inset)', border: '1px solid var(--border-color)', padding: 10, borderRadius: 6, fontSize: '0.78rem' }}>
                                        <div>
                                            <span style={{ fontWeight: 600 }}>{b.id}</span>
                                            <span style={{ color: 'var(--text-secondary)', marginLeft: 15 }}>{b.timestamp}</span>
                                        </div>
                                        <div>
                                            <span style={{ marginRight: 15 }}>Size: <strong>{b.size}</strong></span>
                                            <span className="status-badge active" style={{ fontSize: '0.64rem', padding: '2px 6px' }}>{b.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                )}

            </div>
        </DashboardLayout>
    );
}
