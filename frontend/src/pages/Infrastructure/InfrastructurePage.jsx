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
                            <span className="health-mini-label">CPU Count</span>
                            <span className="health-mini-value" id="rt-cpu">{telemetry?.cpuCount || '—'}</span>
                        </div>
                        <div className="health-mini-card">
                            <span className="health-mini-label">Memory Pool Info</span>
                            <span className="health-mini-value" id="rt-mem">{telemetry?.memoryPoolInfo || '—'}</span>
                        </div>
                        <div className="health-mini-card">
                            <span className="health-mini-label">Network I/O Rate</span>
                            <span className="health-mini-value" id="rt-net">{telemetry?.networkIoRate || '—'}</span>
                        </div>
                        <div className="health-mini-card">
                            <span className="health-mini-label">DB Connections</span>
                            <span className="health-mini-value" id="rt-db">{telemetry?.dbConnections || '—'}</span>
                        </div>
                        <div className="health-mini-card">
                            <span className="health-mini-label">Vault HSM Status</span>
                            <span className="health-mini-value" id="rt-vault" style={{ color: telemetry?.vaultHsmStatus === 'OK' ? 'var(--success-green)' : 'var(--danger-red)' }}>
                                {telemetry?.vaultHsmStatus || '—'}
                            </span>
                        </div>
                        <div className="health-mini-card">
                            <span className="health-mini-label">Active Instances</span>
                            <span className="health-mini-value" id="rt-instances">{telemetry?.activeInstances || '—'}</span>
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
