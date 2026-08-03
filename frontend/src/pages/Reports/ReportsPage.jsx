import { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useToast } from '../../components/common/Toast/Toast.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Swal from 'sweetalert2';
import html2pdf from 'html2pdf.js';
import axiosInstance from '../../api/axios.js';

import assetService from '../../services/assetService.js';
import incidentService from '../../services/incidentService.js';
import auditService from '../../services/auditService.js';
import complianceService from '../../services/complianceService.js';
import vulnerabilityService from '../../services/vulnerabilityService.js';
import dashboardService from '../../services/dashboardService.js';

export default function ReportsPage() {
    const showToast = useToast();
    const { user, hasPermission } = useAuth();
    const [reportType, setReportType] = useState('dashboard');
    const [reportFormat, setReportFormat] = useState('pdf');

    // Scheduler states
    const [schedules, setSchedules] = useState([
        { type: 'Executive Summary', freq: 'Weekly', time: 'Monday at 08:00 UTC', email: 'secops-team@sentinelcore.com' },
        { type: 'Vulnerability CVE Report', freq: 'Monthly', time: '1st of the month at 00:00 UTC', email: 'compliance@sentinelcore.com' }
    ]);
    const [schedType, setSchedType] = useState('Executive Summary');
    const [schedFreq, setSchedFreq] = useState('Daily');
    const [schedTime, setSchedTime] = useState('00:00');
    const [schedEmail, setSchedEmail] = useState('');

    // Email dispatcher states
    const [dispatchEmail, setDispatchEmail] = useState('');
    const [dispatching, setDispatching] = useState(false);

    async function sendReportEmail(payload) {
        const response = await axiosInstance.post('/api/reports/send-email', payload);
        return response.data;
    }

    async function triggerReportGeneration() {
        if (!hasPermission('REPORT_EXPORT')) {
            Swal.fire({
                title: 'Access Denied',
                text: 'You do not have the required permissions to export or generate security reports.',
                icon: 'error',
                confirmButtonColor: '#3a7bd5'
            });
            return;
        }

        Swal.fire({
            title: 'Generating Report',
            text: `Fetching live telemetry and compiling ${reportType} report...`,
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            let fetchedData = null;

            if (reportType === 'dashboard') {
                const [statsRes, incidentsRes, alertsRes] = await Promise.all([
                    dashboardService.getStats(),
                    dashboardService.getRecentIncidents(),
                    dashboardService.getRecentAlerts()
                ]);
                fetchedData = {
                    stats: statsRes.data || {},
                    incidents: incidentsRes.data || [],
                    alerts: alertsRes.data || []
                };
            } else if (reportType === 'assets') {
                const res = await assetService.getAll();
                fetchedData = res.data || [];
            } else if (reportType === 'incidents') {
                const res = await incidentService.getAll();
                fetchedData = res.data || [];
            } else if (reportType === 'audit') {
                const res = await auditService.getAllList();
                fetchedData = res.data || [];
            } else if (reportType === 'compliance') {
                const [standardsRes, controlsRes] = await Promise.all([
                    complianceService.getStandards(),
                    complianceService.getControls()
                ]);
                fetchedData = {
                    standards: standardsRes.data || [],
                    controls: controlsRes.data || []
                };
            } else if (reportType === 'vulnerabilities') {
                const res = await vulnerabilityService.getAll();
                fetchedData = res.data || [];
            }

            if (reportFormat === 'csv') {
                downloadCsvReport(reportType, fetchedData, 'csv');
                Swal.fire('Generated!', 'Your CSV report download has started.', 'success');
            } else if (reportFormat === 'xlsx') {
                // Mock Excel download
                downloadCsvReport(reportType, fetchedData, 'xlsx');
                Swal.fire('Generated!', 'Your Excel workbook download has started.', 'success');
            } else {
                const container = document.createElement('div');
                container.innerHTML = getPdfHtml(reportType, fetchedData, user?.username || 'admin');

                const opt = {
                    margin: 0.5,
                    filename: `sentinelcore_${reportType}_report.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                };

                html2pdf().set(opt).from(container).save().then(() => {
                    Swal.fire('Generated!', 'Your PDF report download has started.', 'success');
                }).catch((e) => {
                    console.error(e);
                    Swal.fire('Failed', 'Report rendering failed. Triggering page print.', 'error');
                    window.print();
                });
            }
        } catch (error) {
            console.error('Report Generation Error:', error);
            Swal.fire('Error', 'Failed to retrieve dynamic data from security APIs.', 'error');
        }
    }

    function downloadCsvReport(type, data, format = 'csv') {
        let content = '';
        if (type === 'dashboard') {
            const { stats } = data;
            content += 'Metric,Value\n';
            content += `Total Assets,${stats.totalAssets ?? 0}\n`;
            content += `Active Alerts,${stats.activeAlerts ?? 0}\n`;
            content += `Active Incidents,${stats.activeIncidents ?? 0}\n`;
            content += `Critical Incidents,${stats.criticalIncidents ?? 0}\n`;
            content += `Open Vulnerabilities,${stats.openVulnerabilities ?? 0}\n`;
            content += `Registered Users,${stats.registeredUsers ?? 0}\n`;
        } else if (type === 'assets') {
            content += 'ID,Asset Name,Type,IP Address,Status,CPU Usage,Memory Usage,Disk Usage,Location,Uptime\n';
            data.forEach(a => {
                content += `"${a.id}","${(a.assetName || '').replace(/"/g, '""')}","${a.assetType || ''}","${a.ipAddress || ''}","${a.status || ''}","${a.cpuUsage || 0}%","${a.memoryUsage || 0}%","${a.diskUsage || 0}%","${(a.location || '').replace(/"/g, '""')}","${(a.uptime || '').replace(/"/g, '""')}"\n`;
            });
        } else if (type === 'incidents') {
            content += 'Incident ID,Title,Severity,Status,Assigned Team,Assigned To,SLA Hours,Created Date\n';
            data.forEach(i => {
                content += `"INC-${i.id}","${(i.title || '').replace(/"/g, '""')}","${i.severity || ''}","${i.status || ''}","${(i.assignedTeam || '').replace(/"/g, '""')}","${(i.assignedTo || '').replace(/"/g, '""')}","${i.slaHours || 0}","${i.createdAt ? new Date(i.createdAt).toLocaleString() : ''}"\n`;
            });
        } else if (type === 'audit') {
            content += 'Timestamp,Username,Role,IP Address,Action,Outcome,Device/Browser\n';
            data.forEach(log => {
                content += `"${log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}","${log.username || ''}","${log.role || ''}","${log.ipAddress || ''}","${(log.action || '').replace(/"/g, '""')}","${log.result || ''}","${(log.deviceBrowser || '').replace(/"/g, '""')}"\n`;
            });
        } else if (type === 'compliance') {
            const { standards, controls } = data;
            content += 'Standard Name,Score %,Passed Checks,Total Checks,Status\n';
            standards.forEach(std => {
                content += `"${(std.name || '').replace(/"/g, '""')}","${std.score || 0}%","${std.passed || 0}","${std.total || 0}","${std.status || ''}"\n`;
            });
            content += '\nControl ID,Framework,Control Policy,Status,Audited By,Audited Time\n';
            controls.forEach(c => {
                content += `"${c.id}","${c.framework || ''}","${(c.control || '').replace(/"/g, '""')}","${c.status || ''}","${(c.checkedBy || '').replace(/"/g, '""')}","${c.lastAudited || ''}"\n`;
            });
        } else if (type === 'vulnerabilities') {
            content += 'CVE,CVSS score,Risk Score,Affected Assets,Patch Status,Remediation Description\n';
            data.forEach(v => {
                content += `"${v.cve || ''}","${v.cvss || 0}","${v.riskScore || ''}","${(v.affectedAssets || '').replace(/"/g, '""')}","${v.patchStatus || ''}","${(v.remediation || '').replace(/"/g, '""')}"\n`;
            });
        }

        const mime = format === 'csv' ? 'text/csv;charset=utf-8,' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8,';
        const ext = format === 'csv' ? 'csv' : 'xlsx';
        const encodedUri = 'data:' + mime + encodeURIComponent(content);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `sentinelcore_${type}_report.${ext}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function getPdfHtml(type, data, username) {
        const timestamp = new Date().toLocaleString();
        let bodyHtml = '';

        if (type === 'dashboard') {
            const { stats, incidents, alerts } = data;
            bodyHtml = `
                <div style="display:flex; justify-content:space-between; margin-bottom: 25px;">
                    <div style="background:#f8fafc; padding:15px; border-radius:8px; width:46%; border:1px solid #cbd5e1;">
                        <h4 style="margin:0 0 10px 0; color:#1e293b; font-size:14px; border-bottom:1px solid #e2e8f0; padding-bottom:5px;">Dashboard Counters</h4>
                        <ul style="margin:0; padding-left:15px; font-size:12px; line-height:1.8; color:#334155; list-style-type:square;">
                            <li>Total CMDB Assets: <strong>${stats.totalAssets ?? 0}</strong></li>
                            <li>Active Incidents: <strong>${stats.activeIncidents ?? 0}</strong> (Critical: ${stats.criticalIncidents ?? 0})</li>
                            <li>Open CVE Vulnerabilities: <strong>${stats.openVulnerabilities ?? 0}</strong></li>
                            <li>Pending Console Alerts: <strong>${stats.activeAlerts ?? 0}</strong></li>
                            <li>Registered Users: <strong>${stats.registeredUsers ?? 0}</strong></li>
                        </ul>
                    </div>
                    <div style="background:#f8fafc; padding:15px; border-radius:8px; width:46%; border:1px solid #cbd5e1;">
                        <h4 style="margin:0 0 10px 0; color:#1e293b; font-size:14px; border-bottom:1px solid #e2e8f0; padding-bottom:5px;">Security Session Info</h4>
                        <p style="margin:0; font-size:12px; line-height:1.8; color:#334155;">
                            Authorized Operator: <strong>${username}</strong><br/>
                            Overall System State: <span style="background:#dcfce7; color:#16a34a; padding:2px 6px; border-radius:4px; font-weight:700;">ACTIVE MONITORING</span><br/>
                            SecOps Vault HSM Status: <strong style="color:#16a34a;">OK</strong>
                        </p>
                    </div>
                </div>
                
                <h3 style="color:#1e293b; border-bottom:2px solid #cbd5e1; padding-bottom:5px; margin-top:20px; font-size:14px;">Recent Console Alerts</h3>
                <table style="width:100%; border-collapse:collapse; margin-bottom:25px; font-size:11px; font-family:sans-serif;">
                    <thead>
                        <tr style="background:#f1f5f9; text-align:left;">
                            <th style="padding:8px; border:1px solid #cbd5e1;">Severity</th>
                            <th style="padding:8px; border:1px solid #cbd5e1;">Title</th>
                            <th style="padding:8px; border:1px solid #cbd5e1;">Source IP</th>
                            <th style="padding:8px; border:1px solid #cbd5e1;">Triggered Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${alerts.length ? alerts.map(a => `
                            <tr>
                                <td style="padding:8px; border:1px solid #e2e8f0; font-weight:700; color:${a.severity === 'Critical' || a.severity === 'High' ? '#dc2626' : '#d97706'}">${a.severity}</td>
                                <td style="padding:8px; border:1px solid #e2e8f0;">${a.title}</td>
                                <td style="padding:8px; border:1px solid #e2e8f0;"><code>${a.source || 'Internal'}</code></td>
                                <td style="padding:8px; border:1px solid #e2e8f0;">${a.timestamp ? new Date(a.timestamp).toLocaleString() : 'Just now'}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="4" style="padding:10px; text-align:center; color:#64748b;">No recent alerts flagged.</td></tr>'}
                    </tbody>
                </table>

                <h3 style="color:#1e293b; border-bottom:2px solid #cbd5e1; padding-bottom:5px; font-size:14px;">Recent Incidents</h3>
                <table style="width:100%; border-collapse:collapse; font-size:11px; font-family:sans-serif;">
                    <thead>
                        <tr style="background:#f1f5f9; text-align:left;">
                            <th style="padding:8px; border:1px solid #cbd5e1;">ID</th>
                            <th style="padding:8px; border:1px solid #cbd5e1;">Incident Title</th>
                            <th style="padding:8px; border:1px solid #cbd5e1;">Severity</th>
                            <th style="padding:8px; border:1px solid #cbd5e1;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${incidents.length ? incidents.map(i => `
                            <tr>
                                <td style="padding:8px; border:1px solid #e2e8f0; font-weight:600;">INC-${i.id}</td>
                                <td style="padding:8px; border:1px solid #e2e8f0;">${i.title}</td>
                                <td style="padding:8px; border:1px solid #e2e8f0; font-weight:700; color:${i.severity === 'Critical' || i.severity === 'High' ? '#dc2626' : '#ca8a04'}">${i.severity}</td>
                                <td style="padding:8px; border:1px solid #e2e8f0;">
                                    <span style="background:${i.status === 'Resolved' || i.status === 'Closed' ? '#dcfce7' : '#fef3c7'}; color:${i.status === 'Resolved' || i.status === 'Closed' ? '#16a34a' : '#d97706'}; padding:2px 6px; border-radius:4px; font-weight:600;">${i.status}</span>
                                </td>
                            </tr>
                        `).join('') : '<tr><td colspan="4" style="padding:10px; text-align:center; color:#64748b;">No security incidents logged.</td></tr>'}
                    </tbody>
                </table>
            `;
        } else if (type === 'assets') {
            const assets = data;
            bodyHtml = `
                <div style="background:#f8fafc; padding:12px; border:1px solid #cbd5e1; border-radius:6px; margin-bottom:20px; font-size:12px; color:#334155;">
                    Total Tracked Assets: <strong>${assets.length}</strong> | Online/Active: <strong>${assets.filter(a => a.status === 'Active').length}</strong> | Offline/Critical: <strong>${assets.filter(a => a.status === 'Offline').length}</strong> | Maintenance: <strong>${assets.filter(a => a.status === 'Maintenance').length}</strong>
                </div>
                <table style="width:100%; border-collapse:collapse; font-size:10px; font-family:sans-serif;">
                    <thead>
                        <tr style="background:#f1f5f9; text-align:left;">
                            <th style="padding:6px; border:1px solid #cbd5e1;">Asset Name</th>
                            <th style="padding:6px; border:1px solid #cbd5e1;">Type</th>
                            <th style="padding:6px; border:1px solid #cbd5e1;">IP Address</th>
                            <th style="padding:6px; border:1px solid #cbd5e1;">Status</th>
                            <th style="padding:6px; border:1px solid #cbd5e1;">Usage (CPU / RAM)</th>
                            <th style="padding:6px; border:1px solid #cbd5e1;">Location</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${assets.map(a => `
                            <tr>
                                <td style="padding:6px; border:1px solid #e2e8f0;"><strong>${a.assetName}</strong></td>
                                <td style="padding:6px; border:1px solid #e2e8f0;">${a.assetType}</td>
                                <td style="padding:6px; border:1px solid #e2e8f0;"><code>${a.ipAddress || '—'}</code></td>
                                <td style="padding:6px; border:1px solid #e2e8f0;">
                                    <span style="color:${a.status === 'Active' ? '#16a34a' : a.status === 'Offline' ? '#dc2626' : '#d97706'}; font-weight:700;">${a.status}</span>
                                </td>
                                <td style="padding:6px; border:1px solid #e2e8f0;">CPU: ${a.cpuUsage || 0}% | RAM: ${a.memoryUsage || 0}%</td>
                                <td style="padding:6px; border:1px solid #e2e8f0;">${a.location || 'Unknown'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else if (type === 'incidents') {
            bodyHtml = `
                <div style="background:#f8fafc; padding:12px; border:1px solid #cbd5e1; border-radius:6px; margin-bottom:20px; font-size:12px; color:#334155;">
                    Security Event Occurrences: <strong>${data.length} total</strong> | Critical: <strong>${data.filter(i => i.severity === 'Critical').length}</strong> | Investigating: <strong>${data.filter(i => i.status === 'Investigating').length}</strong>
                </div>
                <table style="width:100%; border-collapse:collapse; font-size:10px; font-family:sans-serif;">
                    <thead>
                        <tr style="background:#f1f5f9; text-align:left;">
                            <th style="padding:6px; border:1px solid #cbd5e1;">ID</th>
                            <th style="padding:6px; border:1px solid #cbd5e1;">Title</th>
                            <th style="padding:6px; border:1px solid #cbd5e1;">Severity</th>
                            <th style="padding:6px; border:1px solid #cbd5e1;">Status</th>
                            <th style="padding:6px; border:1px solid #cbd5e1;">Assigned Team</th>
                            <th style="padding:6px; border:1px solid #cbd5e1;">Affected Asset</th>
                            <th style="padding:6px; border:1px solid #cbd5e1;">Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(i => `
                            <tr>
                                <td style="padding:6px; border:1px solid #e2e8f0; font-weight:bold;">INC-${i.id}</td>
                                <td style="padding:6px; border:1px solid #e2e8f0;">${i.title}</td>
                                <td style="padding:6px; border:1px solid #e2e8f0; font-weight:700; color:${i.severity === 'Critical' ? '#dc2626' : i.severity === 'High' ? '#ea580c' : '#ca8a04'}">${i.severity}</td>
                                <td style="padding:6px; border:1px solid #e2e8f0;">
                                    <span style="background:${i.status === 'Resolved' ? '#dcfce7' : i.status === 'Investigating' ? '#fef3c7' : '#fee2e2'}; color:${i.status === 'Resolved' ? '#16a34a' : i.status === 'Investigating' ? '#d97706' : '#991b1b'}; padding:1px 5px; border-radius:3px; font-size:9px; font-weight:600;">${i.status}</span>
                                </td>
                                <td style="padding:6px; border:1px solid #e2e8f0;">${i.assignedTeam || '—'}</td>
                                <td style="padding:6px; border:1px solid #e2e8f0;">${i.affectedAsset || '—'}</td>
                                <td style="padding:6px; border:1px solid #e2e8f0; white-space:nowrap;">${i.createdAt ? new Date(i.createdAt).toLocaleDateString() : '—'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else if (type === 'audit') {
            bodyHtml = `
                <div style="background:#f8fafc; padding:12px; border:1px solid #cbd5e1; border-radius:6px; margin-bottom:20px; font-size:12px; color:#334155;">
                    Security Access Logs: <strong>${data.length} records retrieved</strong>
                </div>
                <table style="width:100%; border-collapse:collapse; font-size:9px; font-family:sans-serif;">
                    <thead>
                        <tr style="background:#f1f5f9; text-align:left;">
                            <th style="padding:6px; border:1px solid #cbd5e1; white-space:nowrap;">Timestamp</th>
                            <th style="padding:6px; border:1px solid #cbd5e1;">User</th>
                            <th style="padding:6px; border:1px solid #cbd5e1;">Role</th>
                            <th style="padding:6px; border:1px solid #cbd5e1;">IP Address</th>
                            <th style="padding:6px; border:1px solid #cbd5e1;">Action</th>
                            <th style="padding:6px; border:1px solid #cbd5e1;">Outcome</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(log => `
                            <tr>
                                <td style="padding:6px; border:1px solid #e2e8f0; white-space:nowrap;">${log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}</td>
                                <td style="padding:6px; border:1px solid #e2e8f0;"><strong>${log.username}</strong></td>
                                <td style="padding:6px; border:1px solid #e2e8f0;">${log.role || '—'}</td>
                                <td style="padding:6px; border:1px solid #e2e8f0;"><code>${log.ipAddress}</code></td>
                                <td style="padding:6px; border:1px solid #e2e8f0;">${log.action}</td>
                                <td style="padding:6px; border:1px solid #e2e8f0;">
                                    <strong style="color:${log.result === 'SUCCESS' ? '#16a34a' : '#dc2626'}">${log.result}</strong>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else if (type === 'compliance') {
            const { standards, controls } = data;
            bodyHtml = `
                <h3 style="color:#1e293b; margin-top:0; font-size:13px;">Regulatory Scoreboards</h3>
                <div style="display:flex; gap:10px; margin-bottom:20px;">
                    ${standards.map(std => `
                        <div style="flex:1; background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:10px;">
                            <strong style="font-size:11px; color:#475569; display:block;">${std.name}</strong>
                            <div style="font-size:20px; font-weight:700; margin:4px 0; color:#1e293b;">${std.score}%</div>
                            <span style="font-size:10px; color:${std.status === 'Compliant' ? '#16a34a' : '#d97706'}; font-weight:600;">${std.status}</span>
                        </div>
                    `).join('')}
                </div>

                <h3 style="color:#1e293b; border-bottom:2px solid #cbd5e1; padding-bottom:5px; margin-top:20px; font-size:13px;">Mapped Controls Summary</h3>
                <table style="width:100%; border-collapse:collapse; font-size:9px; font-family:sans-serif;">
                    <thead>
                        <tr style="background:#f1f5f9; text-align:left;">
                            <th style="padding:6px; border:1px solid #cbd5e1;">Control Code</th>
                            <th style="padding:6px; border:1px solid #cbd5e1;">Framework</th>
                            <th style="padding:6px; border:1px solid #cbd5e1;">Policy Check Context</th>
                            <th style="padding:6px; border:1px solid #cbd5e1;">Status</th>
                            <th style="padding:6px; border:1px solid #cbd5e1;">Last Audited</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${controls.map(c => `
                            <tr>
                                <td style="padding:6px; border:1px solid #e2e8f0;"><strong>${c.id}</strong></td>
                                <td style="padding:6px; border:1px solid #e2e8f0;">${c.framework}</td>
                                <td style="padding:6px; border:1px solid #e2e8f0;">${c.control}</td>
                                <td style="padding:6px; border:1px solid #e2e8f0;">
                                    <strong style="color:${c.status === 'PASS' ? '#16a34a' : '#d97706'}">${c.status}</strong>
                                </td>
                                <td style="padding:6px; border:1px solid #e2e8f0;">${c.lastAudited}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else if (type === 'vulnerabilities') {
            bodyHtml = `
                <div style="background:#f8fafc; padding:12px; border:1px solid #cbd5e1; border-radius:6px; margin-bottom:20px; font-size:12px; color:#334155;">
                    Total Tracked Risks: <strong>${data.length} active vulnerabilities</strong>
                </div>
                <table style="width:100%; border-collapse:collapse; font-size:10px; font-family:sans-serif;">
                    <thead>
                        <tr style="background:#f1f5f9; text-align:left;">
                            <th style="padding:6px; border:1px solid #cbd5e1;">CVE Identifier</th>
                            <th style="padding:6px; border:1px solid #cbd5e1;">CVSS Score</th>
                            <th style="padding:6px; border:1px solid #cbd5e1;">Severity Risk</th>
                            <th style="padding:6px; border:1px solid #cbd5e1;">Affected Hosts</th>
                            <th style="padding:6px; border:1px solid #cbd5e1;">Status</th>
                            <th style="padding:6px; border:1px solid #cbd5e1;">Mitigation</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(v => `
                            <tr>
                                <td style="padding:6px; border:1px solid #e2e8f0;"><strong>${v.cve}</strong></td>
                                <td style="padding:6px; border:1px solid #e2e8f0;">
                                    <span style="background:${parseFloat(v.cvss) >= 7 ? '#fee2e2' : '#eff6ff'}; color:${parseFloat(v.cvss) >= 7 ? '#991b1b' : '#1e40af'}; padding:2px 6px; border-radius:4px; font-weight:700;">${v.cvss}</span>
                                </td>
                                <td style="padding:6px; border:1px solid #e2e8f0;">${v.riskScore || 'Low'}</td>
                                <td style="padding:6px; border:1px solid #e2e8f0;">${v.affectedAssets || 'General'}</td>
                                <td style="padding:6px; border:1px solid #e2e8f0;">
                                    <strong style="color:${v.patchStatus === 'Patched' ? '#16a34a' : '#dc2626'}">${v.patchStatus || 'Unpatched'}</strong>
                                </td>
                                <td style="padding:6px; border:1px solid #e2e8f0; font-size:9px;">${v.remediation || '—'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        return `
          <div style="padding:40px; background:#ffffff; color:#1e293b; font-family: 'Inter', system-ui, sans-serif;">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #dc2626; padding-bottom:15px; margin-bottom:20px;">
                  <div>
                      <h1 style="color:#dc2626; margin:0; font-size:22px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">SentinelCore SecureOps</h1>
                      <h2 style="margin:4px 0 0 0; color:#475569; font-size:14px; font-weight:600;">System Report: ${type.toUpperCase()}</h2>
                  </div>
                  <div style="text-align:right;">
                      <p style="margin:0; font-size:11px; color:#64748b;">Report Date: ${timestamp}</p>
                      <p style="margin:2px 0 0 0; font-size:11px; color:#64748b;">Operator Domain User: <strong>${username}</strong></p>
                  </div>
              </div>
              
              ${bodyHtml}

              <div style="margin-top:40px; border-top:1px solid #e2e8f0; padding-top:15px; text-align:center; font-size:9px; color:#94a3b8; letter-spacing:0.5px;">
                THIS SECURITY REPORT GENERATED FROM REAL-TIME MONITORING APIS IS CLASSIFIED AS CONFIDENTIAL.
              </div>
          </div>
        `;
    }

    const handleSendDirectEmail = async (e) => {
        e.preventDefault();
        if (!dispatchEmail || !dispatchEmail.includes('@')) {
            showToast('Please enter a valid recipient email address', 'error');
            return;
        }
        setDispatching(true);
        try {
            // Fetch live data for selected report type
            let fetchedData = null;
            if (reportType === 'dashboard') {
                const [statsRes, incidentsRes, alertsRes] = await Promise.all([
                    dashboardService.getStats(),
                    dashboardService.getRecentIncidents(),
                    dashboardService.getRecentAlerts()
                ]);
                fetchedData = {
                    stats: statsRes.data || {},
                    incidents: incidentsRes.data || [],
                    alerts: alertsRes.data || []
                };
            } else if (reportType === 'assets') {
                const res = await assetService.getAll();
                fetchedData = res.data || [];
            } else if (reportType === 'incidents') {
                const res = await incidentService.getAll();
                fetchedData = res.data || [];
            } else if (reportType === 'audit') {
                const res = await auditService.getAllList();
                fetchedData = res.data || [];
            } else if (reportType === 'compliance') {
                const [standardsRes, controlsRes] = await Promise.all([
                    complianceService.getStandards(),
                    complianceService.getControls()
                ]);
                fetchedData = {
                    standards: standardsRes.data || [],
                    controls: controlsRes.data || []
                };
            } else if (reportType === 'vulnerabilities') {
                const res = await vulnerabilityService.getAll();
                fetchedData = res.data || [];
            }

            const container = document.createElement('div');
            container.innerHTML = getPdfHtml(reportType, fetchedData, user?.username || 'admin');

            const opt = {
                margin: 0.5,
                filename: `sentinelcore_${reportType}_report.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

            const pdfBase64 = await html2pdf().from(container).set(opt).outputPdf('datauristring');

            const result = await sendReportEmail({
                    to: dispatchEmail.trim(),
                    subject: `SentinelCore SecureOps - Security Report: ${reportType.toUpperCase()}`,
                    body: `Please review conflicts, warnings, or anomalies in the attached system summary report for ${reportType}.`,
                    reportType: reportType,
                    fileName: `sentinelcore_${reportType}_report.pdf`,
                    attachmentBase64: pdfBase64
            });

            if (result?.message) {
                showToast(`Report emailed successfully.`, 'success');
                setDispatchEmail('');
            } else {
                showToast('Email delivery failed. Please verify SMTP configuration.', 'error');
            }
        } catch (error) {
            console.error('Email Dispatch Error:', error);
            const message = error.response?.data?.message || error.response?.data?.error || 'Email delivery failed. Please verify SMTP configuration.';
            showToast(message, 'error');
        } finally {
            setDispatching(false);
        }
    };

    const triggerTestDispatch = async (email, type) => {
        showToast(`Triggering manual scheduler test delivery to ${email}...`, 'info');
        try {
            const response = await sendReportEmail({
                    to: email,
                    subject: `Scheduled SentinelCore Incident Summary - Test`,
                    body: `Manual execution check for scheduled cron report: ${type}.`,
                    reportType: 'dashboard',
                    fileName: 'cron_test_summary.pdf'
            });
            if (response?.message) {
                showToast(`Report emailed successfully.`, 'success');
            } else {
                showToast('Email delivery failed. Please verify SMTP configuration.', 'error');
            }
        } catch (error) {
            console.error(error);
            const message = error.response?.data?.message || error.response?.data?.error || 'Email delivery failed. Please verify SMTP configuration.';
            showToast(message, 'error');
        }
    };

    const handleAddDeliverySchedule = (e) => {
        e.preventDefault();
        if (!schedEmail || !schedEmail.includes('@')) {
            showToast('Please enter a valid subscriber email address', 'error');
            return;
        }
        const newSched = {
            type: schedType,
            freq: schedFreq,
            time: `Every ${schedFreq === 'Daily' ? 'day' : schedFreq === 'Weekly' ? 'Monday' : 'Month'} at ${schedTime} UTC`,
            email: schedEmail.trim()
        };
        setSchedules([...schedules, newSched]);
        setSchedEmail('');
        showToast('Cron compliance report delivery slot registered!', 'success');
    };

    return (
        <DashboardLayout>
            <section className="content-header" style={{ marginBottom: 20 }}>
                <h1>SOC Compliance &amp; System Reports <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>Reporting suite</span></h1>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1fr)', gap: 20, alignItems: 'start' }}>
                {/* Left Column: Generate Manual Report */}
                <div className="panel-card">
                    <h2 className="panel-title" style={{ marginBottom: 20 }}><i className="ph ph-file-plus" style={{ marginRight: 6 }} /> Compile Summary Report</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>REPORT TYPE</label>
                            <select
                                id="report-type"
                                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 6, background: 'var(--bg-inset)', color: 'var(--text-primary)', outline: 'none' }}
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                            >
                                <option value="dashboard">Executive Dashboard Summary</option>
                                <option value="assets">IT Assets Log Report</option>
                                <option value="incidents">Security Incidents History</option>
                                <option value="audit">System Access Audit Trail</option>
                                <option value="compliance">Regulatory Compliance Report</option>
                                <option value="vulnerabilities">Vulnerability CVE Report</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>FORMAT</label>
                            <select
                                id="report-format"
                                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 6, background: 'var(--bg-inset)', color: 'var(--text-primary)', outline: 'none' }}
                                value={reportFormat}
                                onChange={(e) => setReportFormat(e.target.value)}
                            >
                                <option value="pdf">Vector PDF Document (.pdf)</option>
                                <option value="csv">Structured CSV Dataset (.csv)</option>
                                <option value="xlsx">Structured Excel Workbook Mock (.xlsx)</option>
                            </select>
                        </div>

                        <button
                            className="btn"
                            style={{ marginTop: 10, padding: '12px' }}
                            onClick={triggerReportGeneration}
                        >
                            Generate &amp; View Report
                        </button>
                    </div>

                    {/* Email dispatcher */}
                    <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-color)' }}>
                        <h3 className="panel-title" style={{ fontSize: '0.88rem', marginBottom: 10 }}><i className="ph ph-envelope-simple" style={{ marginRight: 6 }} /> Direct Email Dispatcher</h3>
                        <form onSubmit={handleSendDirectEmail} style={{ display: 'flex', gap: 8 }}>
                            <input
                                type="email"
                                placeholder="Enter operator email (e.g. j.doe@corp.com)"
                                value={dispatchEmail}
                                onChange={e => setDispatchEmail(e.target.value)}
                                style={{ flex: 1, padding: 8, fontSize: '0.8rem', border: '1px solid var(--border-color)', borderRadius: 6, background: 'var(--bg-inset)', color: 'var(--text-primary)' }}
                            />
                            <button
                                type="submit"
                                className="btn"
                                style={{ width: 'auto', padding: '0 16px', fontSize: '0.8rem' }}
                                disabled={dispatching}
                            >
                                {dispatching ? 'Sending...' : 'Send Now'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Column: Scheduled Automated Runs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Schedule Manager */}
                    <div className="panel-card">
                        <h2 className="panel-title" style={{ marginBottom: 15 }}><i className="ph ph-calendar" style={{ marginRight: 6 }} /> Schedule Automated Deliveries</h2>
                        <form onSubmit={handleAddDeliverySchedule} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Report Type</label>
                                    <select value={schedType} onChange={e => setSchedType(e.target.value)} style={{ width: '100%', padding: '6px 8px', fontSize: '0.78rem', background: 'var(--bg-inset)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 4 }}>
                                        <option value="Executive Summary">Executive Summary</option>
                                        <option value="IT Assets Log Report">IT Assets Log Report</option>
                                        <option value="Security Incidents History">Security Incidents History</option>
                                        <option value="Vulnerability CVE Report">Vulnerability CVE Report</option>
                                    </select>
                                </div>
                                <div style={{ width: 100 }}>
                                    <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Frequency</label>
                                    <select value={schedFreq} onChange={e => setSchedFreq(e.target.value)} style={{ width: '100%', padding: '6px 8px', fontSize: '0.78rem', background: 'var(--bg-inset)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 4 }}>
                                        <option value="Daily">Daily</option>
                                        <option value="Weekly">Weekly</option>
                                        <option value="Monthly">Monthly</option>
                                    </select>
                                </div>
                                <div style={{ width: 80 }}>
                                    <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>UTC Time</label>
                                    <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)} style={{ width: '100%', padding: '6px 8px', fontSize: '0.78rem', background: 'var(--bg-inset)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 4 }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Recipient Subscriber Email</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input type="email" placeholder="subscriber@corp.com" value={schedEmail} onChange={e => setSchedEmail(e.target.value)} style={{ flex: 1, padding: '6px 8px', fontSize: '0.78rem', background: 'var(--bg-inset)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 4 }} />
                                    <button type="submit" className="btn" style={{ width: 'auto', padding: '0 16px', fontSize: '0.78rem' }}>Schedule</button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Active Schedules List */}
                    <div className="panel-card">
                        <h2 className="panel-title" style={{ marginBottom: 15 }}><i className="ph ph-clock" style={{ marginRight: 6 }} /> Active Security Cron Schedules</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {schedules.map((s, idx) => (
                                <div key={idx} style={{ padding: 12, background: 'var(--bg-inset)', borderRadius: 6, border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <strong style={{ fontSize: '0.8rem', display: 'block' }}>{s.type}</strong>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}><i className="ph ph-timer" /> {s.time}</span>
                                    </div>
                                    <div style={{ textAlignment: 'right' }}>
                                        <div style={{ fontSize: '0.74rem', fontWeight: 600 }}>{s.email}</div>
                                        <span style={{ fontSize: '0.66rem', color: 'var(--success-green)', cursor: 'pointer' }} onClick={() => triggerTestDispatch(s.email, s.type)}>Test dispatch</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
