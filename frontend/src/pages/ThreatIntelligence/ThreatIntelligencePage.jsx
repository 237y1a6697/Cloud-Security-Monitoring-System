import DashboardLayout from '../../layouts/DashboardLayout.jsx';

export default function ThreatIntelligencePage() {
    const feeds = [
        { type: 'critical', text: 'CVE-2026-X44: Zero-day detected in active exploit feed.' },
        { type: 'warning', text: 'IOC Alert: Malicious IP 185.190.140.12 blocklisted.' },
        { type: 'info', text: 'Feed Update: Malware signatures updated successfully.' },
        { type: 'warning', text: 'IOC Alert: Suspicious outbound activity flagged to 94.23.200.4.' },
        { type: 'info', text: 'Security Bulletin: Dynamic patches released for OpenSSL CVE.' }
    ];

    return (
        <DashboardLayout>
            <section className="content-header" style={{ marginBottom: 20 }}>
                <h1>Threat Intelligence <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>Security Intelligence Feeds</span></h1>
            </section>

            <div className="dashboard-mid-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
                {/* Global Attack Map */}
                <div className="panel-card">
                    <h2 className="panel-title">Global Threat Network (Origins)</h2>
                    <div className="world-map-placeholder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, background: 'var(--bg-inset, #0c101b)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 20, position: 'relative' }}>
                        <i className="ph ph-globe-hemisphere-east" style={{ fontSize: '7rem', color: '#3a7bd5', opacity: 0.35, marginBottom: 15 }} />
                        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Live Cyberattack Tracker</p>
                        <div className="world-map-overlay" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 15, width: '100%' }}>
                            {[
                                { from: 'CN (Beijing)', to: 'EU-West-1', style: { color: 'var(--danger-red)' } },
                                { from: 'RU (St. Petersburg)', to: 'US-East-1', style: { color: 'var(--danger-red)' } },
                                { from: 'NL (Amsterdam)', to: 'US-West-2', style: { color: 'var(--warning-amber)' } },
                            ].map((atk, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: 6, fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span><i className="ph ph-shield-warning" style={{ color: atk.style.color, marginRight: 6 }} /> Attack from <strong>{atk.from}</strong></span>
                                    <i className="ph ph-arrow-right" style={{ color: 'var(--text-muted)' }} />
                                    <span>Target <strong>{atk.to}</strong></span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* MITRE ATT&CK */}
                <div className="panel-card">
                    <h2 className="panel-title">MITRE ATT&CK &amp; Technical Feeds</h2>
                    <ul className="threat-feed-list" style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 15 }}>
                        {feeds.map((f, idx) => {
                            const bg = f.type === 'critical' ? 'var(--danger-red)' : f.type === 'warning' ? 'var(--warning-amber)' : 'var(--highlight-blue)';
                            return (
                                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-inset)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                                    <span className={`badge badge-${f.type}`} style={{ background: `${bg}22`, color: bg, border: `1px solid ${bg}55`, padding: '3px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                        {f.type}
                                    </span>
                                    <span style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>{f.text}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </DashboardLayout>
    );
}
