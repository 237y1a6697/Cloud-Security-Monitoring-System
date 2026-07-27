import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useToast } from '../../components/common/Toast/Toast.jsx';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import Swal from 'sweetalert2';

// Seed data
const MITRE_TACTICS = [
    {
        tactic: 'Initial Access',
        techniques: [
            { id: 'T1566', name: 'Phishing', desc: 'Adversaries may send phishing messages to gain access to victim systems.', mitigation: 'Deploy SPF/DKIM validation, run phishing simulations, scan attachment extensions.' },
            { id: 'T1189', name: 'Drive-by Compromise', desc: 'Web-based exploits targeting browser vulnerabilities.', mitigation: 'Enforce browser isolation policies, patch endpoint web browser systems.' },
            { id: 'T1190', name: 'Exploit Public-Facing App', desc: 'Take advantage of software vulnerabilities on internet-facing servers.', mitigation: 'Deploy WAF (Web Application Firewall), isolate DMZ assets, perform routine external penetration test.' }
        ]
    },
    {
        tactic: 'Execution',
        techniques: [
            { id: 'T1059', name: 'Command & Scripting Interpreter', desc: 'Use of interpreters like PowerShell or Bash to execute commands.', mitigation: 'Enable Script Block Logging, constrain language mode in PowerShell.' },
            { id: 'T1204', name: 'User Execution', desc: 'Trick users into running malicious payloads.', mitigation: 'Implement application control, disable macros in MS Office by default.' },
            { id: 'T1047', name: 'WMI execution', desc: 'Use Windows Management Instrumentation to execute files.', mitigation: 'Restrict remote WMI access via Registry or Group Policy.' }
        ]
    },
    {
        tactic: 'Persistence',
        techniques: [
            { id: 'T1547', name: 'Boot/Logon Autostart Registry', desc: 'Register programs to run automatically on system boot.', mitigation: 'Audit registry keys (Run/RunOnce), sanitize registry privileges.' },
            { id: 'T1078', name: 'Valid Accounts', desc: 'Gain persistence using valid system/domain credentials.', mitigation: 'Enforce MFA for all domain logons, implement credential rotation schedule.' },
            { id: 'T1543', name: 'Create/Modify System Process', desc: 'Create new system daemons/services for persistent execution.', mitigation: 'Monitor new daemon creations, restrict daemon registrations to local administrators.' }
        ]
    },
    {
        tactic: 'Defense Evasion',
        techniques: [
            { id: 'T1140', name: 'Deobfuscate/Decode Files', desc: 'Decode hidden scripts to defeat static analysis markers.', mitigation: 'Implement inline runtime memory scanning, enforce EDR heuristics.' },
            { id: 'T1562', name: 'Impair Defenses', desc: 'Disable security agents (antivirus, logging).', mitigation: 'Enable tamper-prevention settings on agent configurations, centralize logs immediately.' },
            { id: 'T1036', name: 'Masquerading', desc: 'Disguise malware to look like legitimate operating system tools.', mitigation: 'Enforce binary signature verification, profile binary locations.' }
        ]
    },
    {
        tactic: 'Credential Access',
        techniques: [
            { id: 'T1110', name: 'Brute Force', desc: 'Systematic attempts to guess passwords.', mitigation: 'Implement lockouts, georestrict login routes, monitor high-velocity logins.' },
            { id: 'T1003', name: 'OS Credential Dumping', desc: 'Extract plain-text hashes from memory (e.g. LSASS).', mitigation: 'Enable Windows credential guard, restrict SeDebugPrivilege authority.' },
            { id: 'T1558', name: 'Steal/Forge Kerberos Tickets', desc: 'Kerberoasting attacks targeting active directory tickets.', mitigation: 'Enforce complex service account passwords, alert on unusual ticket request patterns.' }
        ]
    },
    {
        tactic: 'Command & Control',
        techniques: [
            { id: 'T1071', name: 'Application Layer Protocol', desc: 'C2 communication masquerading as standard HTTPS/DNS traffic.', mitigation: 'Deploy network protocol analysis proxies, inspect TLS handshakes.' },
            { id: 'T1090', name: 'Proxy Connection Redirect', desc: 'Utilize proxies or TOR nodes to anonymize outbound traffic routing.', mitigation: 'Block known TOR entrance/exit nodes, restrict non-standard proxy headers.' },
            { id: 'T1573', name: 'Encrypted Channel', desc: 'Encrypt network payload routing to bypass pattern detection.', mitigation: 'Implement SSL decryption proxies, establish network behavior models.' }
        ]
    }
];

export default function ThreatIntelligencePage() {
    const showToast = useToast();
    const [selectedTech, setSelectedTech] = useState(null);

    // Blacklisted IP list state
    const [blacklist, setBlacklist] = useState([
        { ip: '185.190.140.12', reason: 'Active C2 Botnet Beaconing', level: 'Critical', added: '2026-07-20' },
        { ip: '94.23.200.4', reason: 'SMTP Spam/Brute-force Scanner', level: 'High', added: '2026-07-22' },
        { ip: '198.51.100.45', reason: 'SSH Tunneling Port Scan Agent', level: 'Medium', added: '2026-07-24' }
    ]);
    const [newIp, setNewIp] = useState('');
    const [newReason, setNewReason] = useState('');
    const [newLevel, setNewLevel] = useState('High');

    // Geo attacks feed state
    const [attacks, setAttacks] = useState([
        { id: 1, origin: 'St. Petersburg, RU', target: 'Auth-Node-East', port: '22 (SSH)', event: 'Massive credential brute force', time: '1s ago' },
        { id: 2, origin: 'Beijing, CN', target: 'CMDB-Core-Server', port: '443 (HTTPS)', event: 'SQL Injection attempted', time: '4s ago' },
        { id: 3, origin: 'Amsterdam, NL', target: 'DevOps-Kubernetes', port: '6443 (APIServer)', event: 'Kubeflow dashboard probe', time: '12s ago' }
    ]);

    // Attack chart data (last 8 hours)
    const chartData = [
        { hour: '08:00', attacks: 120, blocked: 120 },
        { hour: '10:00', attacks: 240, blocked: 239 },
        { hour: '12:00', attacks: 310, blocked: 310 },
        { hour: '14:00', attacks: 180, blocked: 180 },
        { hour: '16:00', attacks: 420, blocked: 418 },
        { hour: '18:00', attacks: 380, blocked: 380 },
        { hour: '20:00', attacks: 490, blocked: 490 },
        { hour: '22:00', attacks: 512, blocked: 512 }
    ];

    // Simulating dynamic attacks feed ticking
    useEffect(() => {
        const interval = setInterval(() => {
            const countries = ['Sofia, BG', 'Seoul, KR', 'Dublin, IE', 'Frankfurt, DE', 'Mumbai, IN', 'São Paulo, BR'];
            const targets = ['SecOps-Router', 'API-Gateway', 'Database-Replica-0', 'Web-Portal-Prod'];
            const ports = ['80 (HTTP)', '3389 (RDP)', '5432 (Postgres)', '9092 (Kafka)'];
            const causes = ['LFI Probe', 'RDP Auth flood', 'Port enumeration scan', 'Deserialization vulnerability attempt'];

            const newAttack = {
                id: Date.now(),
                origin: countries[Math.floor(Math.random() * countries.length)],
                target: targets[Math.floor(Math.random() * targets.length)],
                port: ports[Math.floor(Math.random() * ports.length)],
                event: causes[Math.floor(Math.random() * causes.length)],
                time: 'Just now'
            };

            setAttacks(prev => [newAttack, ...prev.slice(0, 4)]);
        }, 6000);

        return () => clearInterval(interval);
    }, []);

    const handleAddIp = (e) => {
        e.preventDefault();
        const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
        if (!newIp || !ipRegex.test(newIp)) {
            showToast('Please enter a valid IPv4 address', 'error');
            return;
        }
        if (!newReason.trim()) {
            showToast('Please enter an action reason for blocklisting', 'error');
            return;
        }

        const record = {
            ip: newIp,
            reason: newReason.trim(),
            level: newLevel,
            added: new Date().toISOString().split('T')[0]
        };

        setBlacklist([...blacklist, record]);
        setNewIp('');
        setNewReason('');
        showToast('Rule deployed: IP permanently routed to blackhole null interface!', 'success');
    };

    const handleRevokeIp = (ipAddress) => {
        Swal.fire({
            title: 'Revoke IP Blacklist?',
            text: `This will permit normal ingress traffic from ${ipAddress}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3a7bd5',
            confirmButtonText: 'Revoke Block'
        }).then(result => {
            if (result.isConfirmed) {
                setBlacklist(blacklist.filter(x => x.ip !== ipAddress));
                showToast(`Dynamic filter for ${ipAddress} revoked.`, 'info');
            }
        });
    };

    return (
        <DashboardLayout>
            <style>{`
                .mitre-tactic-col {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    background: var(--bg-inset);
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    padding: 10px;
                }
                .mitre-tech-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    padding: 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.76rem;
                    line-height: 1.3;
                    transition: all 0.2s ease;
                }
                .mitre-tech-card:hover {
                    border-color: var(--highlight-blue);
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }
                .mitre-tech-card.active {
                    border-color: var(--danger-red);
                    background: rgba(220, 38, 38, 0.08);
                }
                .ip-registry-table th, .ip-registry-table td {
                    padding: 10px;
                    font-size: 0.8rem;
                }
            `}</style>

            <section className="content-header" style={{ marginBottom: 20 }}>
                <h1>Threat Intelligence <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>Security Intelligence Feeds</span></h1>
            </section>

            {/* Interactive MITRE ATT&CK Matrix & Live Attacks timeline */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 2fr) minmax(300px, 1fr)', gap: 20, marginBottom: 20 }}>

                {/* MITRE ATT&CK Column */}
                <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                    <div>
                        <h2 className="panel-title"><i className="ph ph-grid" style={{ marginRight: 6 }} /> MITRE ATT&CK Matrix Navigator</h2>
                        <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Select technical techniques to access live control system mitigations</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                        {MITRE_TACTICS.map((tact, idx) => (
                            <div key={idx} className="mitre-tactic-col">
                                <strong style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: 6 }}>{tact.tactic}</strong>
                                {tact.techniques.map((tech) => (
                                    <div
                                        key={tech.id}
                                        className={`mitre-tech-card ${selectedTech?.id === tech.id ? 'active' : ''}`}
                                        onClick={() => setSelectedTech(tech)}
                                    >
                                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontWeight: 600 }}>{tech.id}</div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tech.name}</div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Technique detail panel */}
                    {selectedTech ? (
                        <div style={{ background: 'rgba(58, 123, 213, 0.05)', border: '1px solid var(--highlight-blue)', padding: 14, borderRadius: 8, fontSize: '0.8rem', animation: 'fadeIn 0.2s ease' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <strong style={{ fontSize: '0.88rem', color: 'var(--highlight-blue)' }}>{selectedTech.id}: {selectedTech.name}</strong>
                                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setSelectedTech(null)}>Clear x</span>
                            </div>
                            <p style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>{selectedTech.desc}</p>
                            <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: 8 }}>
                                <strong style={{ color: 'var(--warning-amber)', display: 'block', marginBottom: 4, fontSize: '0.74rem' }}>Mitigation Blueprint</strong>
                                <span style={{ color: 'var(--text-secondary)' }}>{selectedTech.mitigation}</span>
                            </div>
                        </div>
                    ) : (
                        <div style={{ border: '1px dashed var(--border-color)', padding: 20, borderRadius: 8, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            Select a MITRE ATT&CK technique from the navigator matrix to load mitigations.
                        </div>
                    )}

                </div>

                {/* Cyber attack Geo-Timeline */}
                <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                    <h2 className="panel-title"><i className="ph ph-activity" style={{ marginRight: 6 }} /> Active Attack Vector Timeline</h2>

                    <div style={{ height: 130 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorAttacks" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--danger-red)" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="var(--danger-red)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="hour" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                                <Tooltip contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                                <Area type="monotone" dataKey="attacks" stroke="var(--danger-red)" strokeWidth={2} fillOpacity={1} fill="url(#colorAttacks)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', maxHeight: 220 }}>
                        {attacks.map((a) => (
                            <div key={a.id} style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-inset)', padding: 10, borderRadius: 6, borderLeft: '3px solid var(--danger-red)', fontSize: '0.78rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                                    <span style={{ color: 'var(--text-primary)' }}><i className="ph ph-triangle-warning" style={{ color: 'var(--danger-red)', marginRight: 4 }} /> {a.origin}</span>
                                    <span style={{ color: 'var(--text-muted)' }}>{a.time}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginTop: 4 }}>
                                    <span>Target: {a.target} (Port {a.port})</span>
                                    <strong style={{ color: 'var(--text-primary)' }}>{a.event}</strong>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Blacklisted IP Registry */}
            <div className="panel-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                    <h2 className="panel-title"><i className="ph ph-shield-slash" style={{ marginRight: 6 }} /> Active Blacklisted IP Registry</h2>
                    <form onSubmit={handleAddIp} style={{ display: 'flex', gap: 8 }}>
                        <input
                            type="text"
                            placeholder="Enter IP (e.g. 192.0.2.1)"
                            value={newIp}
                            onChange={e => setNewIp(e.target.value)}
                            style={{ padding: '6px 8px', fontSize: '0.78rem', background: 'var(--bg-inset)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 4 }}
                        />
                        <input
                            type="text"
                            placeholder="Reason for blocklist..."
                            value={newReason}
                            onChange={e => setNewReason(e.target.value)}
                            style={{ padding: '6px 8px', fontSize: '0.78rem', background: 'var(--bg-inset)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 4, width: 200 }}
                        />
                        <select
                            value={newLevel}
                            onChange={e => setNewLevel(e.target.value)}
                            style={{ padding: '6px 8px', fontSize: '0.78rem', background: 'var(--bg-inset)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 4 }}
                        >
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                        </select>
                        <button type="submit" className="btn" style={{ width: 'auto', padding: '0 12px', fontSize: '0.78rem' }}>+ Add IP</button>
                    </form>
                </div>

                <div className="table-wrapper">
                    <table className="data-table ip-registry-table">
                        <thead>
                            <tr>
                                <th>Blacklisted IP Address</th>
                                <th>Reason / Incident Origin</th>
                                <th>Severity Threat Level</th>
                                <th>Registry Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {blacklist.map((item, idx) => (
                                <tr key={idx}>
                                    <td><code style={{ fontSize: '0.86rem' }}>{item.ip}</code></td>
                                    <td>{item.reason}</td>
                                    <td>
                                        <span className={`status-badge ${item.level === 'Critical' ? 'offline' : item.level === 'High' ? 'maintenance' : 'active'}`}>
                                            {item.level}
                                        </span>
                                    </td>
                                    <td>{item.added}</td>
                                    <td>
                                        <button className="tbl-action tbl-delete" onClick={() => handleRevokeIp(item.ip)}>Remove Block</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </DashboardLayout>
    );
}
