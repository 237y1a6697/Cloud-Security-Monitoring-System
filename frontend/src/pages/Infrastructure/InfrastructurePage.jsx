import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import Loader from '../../components/common/Loader/Loader.jsx';
import { useToast } from '../../components/common/Toast/Toast.jsx';
import infrastructureService from '../../services/infrastructureService.js';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function InfrastructurePage() {
    const showToast = useToast();
    const [telemetry, setTelemetry] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    async function fetchTelemetry() {
        try {
            const res = await infrastructureService.getTelemetry();
            if (res.data) {
                setTelemetry(res.data);
                const cpuNum = parseFloat(res.data.cpuCount);
                const memNum = parseFloat(res.data.memoryPoolInfo);
                const dbNum = parseInt(res.data.dbConnections?.split('/')[0]);
                const time = new Date().toLocaleTimeString('en-US', { hour12: false });

                setHistory((prev) => {
                    const next = [...prev, { time, cpu: cpuNum, memory: memNum, db: dbNum }];
                    if (next.length > 15) next.shift(); // Keep last 15 ticks
                    return next;
                });
            }
        } catch {
            showToast('Failed to fetch infrastructure telemetry', 'error');
        }
    }

    useEffect(() => {
        fetchTelemetry().then(() => setLoading(false));
        const interval = setInterval(fetchTelemetry, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <DashboardLayout>
            <section className="content-header" style={{ marginBottom: 20 }}>
                <h1>Infrastructure &amp; Telemetry <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>Live monitoring</span></h1>
            </section>

            {loading ? <Loader /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Status grid */}
                    <div className="system-health-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                        <div className="health-mini-card">
                            <div style={{ display: 'flex', alignContent: 'center', justifyContent: 'space-between' }}>
                                <span className="health-mini-label">CPU Count</span>
                                <i className="ph ph-cpu" style={{ color: 'var(--text-muted)' }} />
                            </div>
                            <span className="health-mini-value" id="rt-cpu">{telemetry?.cpuCount || '—'}</span>
                        </div>
                        <div className="health-mini-card">
                            <div style={{ display: 'flex', alignContent: 'center', justifyContent: 'space-between' }}>
                                <span className="health-mini-label">Memory Pool Info</span>
                                <i className="ph ph-database" style={{ color: 'var(--text-muted)' }} />
                            </div>
                            <span className="health-mini-value" id="rt-mem">{telemetry?.memoryPoolInfo || '—'}</span>
                        </div>
                        <div className="health-mini-card">
                            <div style={{ display: 'flex', alignContent: 'center', justifyContent: 'space-between' }}>
                                <span className="health-mini-label">Network I/O Rate</span>
                                <i className="ph ph-arrows-left-right" style={{ color: 'var(--text-muted)' }} />
                            </div>
                            <span className="health-mini-value" id="rt-net">{telemetry?.networkIoRate || '—'}</span>
                        </div>
                        <div className="health-mini-card">
                            <div style={{ display: 'flex', alignContent: 'center', justifyContent: 'space-between' }}>
                                <span className="health-mini-label">DB Connections</span>
                                <i className="ph ph-plugs" style={{ color: 'var(--text-muted)' }} />
                            </div>
                            <span className="health-mini-value" id="rt-db">{telemetry?.dbConnections || '—'}</span>
                        </div>
                        <div className="health-mini-card">
                            <div style={{ display: 'flex', alignContent: 'center', justifyContent: 'space-between' }}>
                                <span className="health-mini-label">Vault HSM Status</span>
                                <i className="ph ph-shield-check" style={{ color: telemetry?.vaultHsmStatus === 'OK' ? 'var(--success-green)' : 'var(--danger-red)' }} />
                            </div>
                            <span className="health-mini-value" id="rt-vault" style={{ color: telemetry?.vaultHsmStatus === 'OK' ? 'var(--success-green)' : 'var(--danger-red)' }}>
                                {telemetry?.vaultHsmStatus || '—'}
                            </span>
                        </div>
                        <div className="health-mini-card">
                            <div style={{ display: 'flex', alignContent: 'center', justifyContent: 'space-between' }}>
                                <span className="health-mini-label">Active Instances</span>
                                <i className="ph ph-squares-four" style={{ color: 'var(--text-muted)' }} />
                            </div>
                            <span className="health-mini-value" id="rt-instances">{telemetry?.activeInstances || '—'}</span>
                        </div>
                    </div>

                    {/* Secondary Status & SLA Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                        {/* SLA & Uptime Card */}
                        <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', justifyItems: 'space-between' }}>
                            <h2 className="panel-title">SLA Compliance &amp; Availability</h2>
                            <div style={{ padding: '15px 0', textAlign: 'center' }}>
                                <div style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--success-green)' }}>99.991%</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>Uptime SLA Target: 99.95%</div>
                            </div>
                            <div style={{ marginTop: 'auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                                    <span>Monthly Availability</span>
                                    <span>99.99% Passed</span>
                                </div>
                                <div style={{ width: '100%', height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                                    <div style={{ width: '99.99%', height: '100%', background: 'var(--success-green)' }} />
                                </div>
                            </div>
                        </div>

                        {/* Cloud Infrastructure Status */}
                        <div className="panel-card">
                            <h2 className="panel-title">Multi-Cloud Node Clusters</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 15 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-inset)', borderRadius: 6 }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}><i className="ph ph-cloud" style={{ color: '#ff9900', marginRight: 8 }} /> AWS (us-east-1)</span>
                                    <span className="badge badge-status ok">Healthy</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-inset)', borderRadius: 6 }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}><i className="ph ph-microsoft-windows" style={{ color: '#0078d4', marginRight: 8 }} /> Azure (w-europe)</span>
                                    <span className="badge badge-status ok">Healthy</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-inset)', borderRadius: 6 }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}><i className="ph ph-google-chrome" style={{ color: '#4285f4', marginRight: 8 }} /> Google Cloud (asia-south)</span>
                                    <span className="badge badge-status ok">Healthy</span>
                                </div>
                            </div>
                        </div>

                        {/* Disk Storage Health */}
                        <div className="panel-card">
                            <h2 className="panel-title">Storage Disk Utilization</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 15 }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                                        <span>Primary SAN Storage (/dev/sda1)</span>
                                        <span>42% (1.8 TB / 4.0 TB)</span>
                                    </div>
                                    <div style={{ width: '100%', height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{ width: '42%', height: '100%', background: 'var(--success-green)' }} />
                                    </div>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                                        <span>Elastic Archive Pool (/dev/sdb1)</span>
                                        <span>78% (6.1 TB / 8.0 TB)</span>
                                    </div>
                                    <div style={{ width: '100%', height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{ width: '78%', height: '100%', background: 'var(--warning-amber)' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Infrastructure Alerts & Auto Scaling Logs Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 20 }}>
                        {/* Infrastructure Alerts Panel */}
                        <div className="panel-card">
                            <h2 className="panel-title">Infrastructure Status Alerts</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 15 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderLeft: '3px solid var(--danger-red)', background: 'var(--bg-inset)', borderRadius: 4 }}>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>DB-srv-12 High Load Threshold Exceeded</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trigger: DB connections &gt; 90% persistent for 5m</div>
                                    </div>
                                    <span style={{ color: 'var(--danger-red)', fontSize: '0.78rem', fontWeight: 600 }}>Critical</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderLeft: '3px solid var(--warning-amber)', background: 'var(--bg-inset)', borderRadius: 4 }}>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>APP-03 Node Auto-scaling Triggered</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trigger: Elastic pool scaling group expansion</div>
                                    </div>
                                    <span style={{ color: 'var(--warning-amber)', fontSize: '0.78rem', fontWeight: 600 }}>Warning</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderLeft: '3px solid var(--success-green)', background: 'var(--bg-inset)', borderRadius: 4 }}>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>WEB-SRV-01 SSL Certificate Hydration Complete</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto renew daemon run complete</div>
                                    </div>
                                    <span style={{ color: 'var(--success-green)', fontSize: '0.78rem', fontWeight: 600 }}>Healthy</span>
                                </div>
                            </div>
                        </div>

                        {/* Auto Scaling & Node Instances logs */}
                        <div className="panel-card">
                            <h2 className="panel-title">Kubernetes Cluster &amp; Scaling Events</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 15 }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                                    <span>Target Namespace: <code>sentinel-prod</code></span>
                                    <span>Replica Count: <strong>{telemetry?.activeInstances || '4'} / 10 Max</strong></span>
                                </div>
                                <div style={{ maxHeight: 110, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    <div>[22:42:15] Namespace sentinel-prod replica target matched to {telemetry?.activeInstances || '4'}</div>
                                    <div>[21:15:30] Cluster Scaling rule CPU_UP triggered (avg CPU &gt; 75%)</div>
                                    <div>[19:05:42] Successfully registered new node instance in AZ us-east-1b</div>
                                    <div>[16:22:11] Scaling daemon verification challenge passed</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Core Telemetry Rolling Charts */}
                    <div className="panel-card">
                        <h2 className="panel-title">Resource Telemetry History <span className="panel-subtitle">3s tick update rate</span></h2>
                        <div style={{ width: '100%', height: 350, marginTop: 15 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={history}>
                                    <defs>
                                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3a7bd5" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#3a7bd5" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#d53a99" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#d53a99" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                                    <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="cpu" name="CPU Usage" stroke="#3a7bd5" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="memory" name="Memory Usage" stroke="#d53a99" fillOpacity={1} fill="url(#colorMemory)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
