/**
 * dashboardService.js
 *
 * Replaces: dashboard.js → loadDashboardStats, renderDashboardCharts, renderDashboardTables
 * Purpose : Fetches all widgets required by the Dashboard page.
 * API     : GET /api/dashboard/*
 */

import axiosInstance from '../api/axios.js';

const dashboardService = {
    /** System-wide KPI counters (assets, incidents, vulnerabilities, compliance score) */
    getStats: () => axiosInstance.get('/api/dashboard/stats'),

    /** Logged-in user info for Navbar and RBAC */
    getCurrentUser: () => axiosInstance.get('/api/dashboard/user'),

    /** Incident status distribution (Open / Investigating / Resolved) */
    getIncidentStatusChart: () => axiosInstance.get('/api/dashboard/incidents/status'),

    /** Incident severity distribution (Critical / High / Medium / Low) */
    getIncidentSeverityChart: () => axiosInstance.get('/api/dashboard/incidents/severity'),

    /** 7-day incident trend for line chart */
    getIncidentTrend: () => axiosInstance.get('/api/dashboard/incidents/trend'),

    /** Last 5 incidents for the Recent Activity table */
    getRecentIncidents: () => axiosInstance.get('/api/dashboard/incidents/recent'),

    /** Last 5 security alerts for the Alerts panel */
    getRecentAlerts: () => axiosInstance.get('/api/dashboard/alerts/recent'),

    /** Last 5 audit entries for the Audit Logs panel */
    getRecentAuditLogs: () => axiosInstance.get('/api/dashboard/audit-logs/recent'),
};

export default dashboardService;
