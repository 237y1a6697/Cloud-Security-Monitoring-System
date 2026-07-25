/**
 * auditService.js
 *
 * Replaces: dashboard.js → loadAuditLogs, renderAuditLogs, filterAuditLogs
 * Purpose : Paginated audit log retrieval with stats.
 * API     : /api/audit-logs  (AuditLogController.java)
 * RBAC    : AUDIT_VIEW
 */

import axiosInstance from '../api/axios.js';

const auditService = {
    /**
     * Paginated audit logs.
     * @param {number} page - Zero-based page index
     * @param {number} size - Records per page (default 20)
     * @param {string} sortBy  - Field to sort by (default 'timestamp')
     * @param {string} sortDir - 'asc' | 'desc'
     */
    getAll: (page = 0, size = 20, sortBy = 'timestamp', sortDir = 'desc') =>
        axiosInstance.get('/api/audit-logs', { params: { page, size, sortBy, sortDir } }),

    /** Fetch full list without paging (used for client-side filtering) */
    getAllList: () => axiosInstance.get('/api/audit-logs/all'),

    /** Filter logs by username */
    getByUsername: (username) => axiosInstance.get(`/api/audit-logs/username/${username}`),

    /** Filter logs by action type */
    getByAction: (action) => axiosInstance.get(`/api/audit-logs/action/${action}`),

    /** Filter logs by result: SUCCESS | FAILED | DENIED */
    getByResult: (result) => axiosInstance.get(`/api/audit-logs/result/${result}`),

    /** Aggregate stats for the stat cards (total, success, failed, denied) */
    getStats: () => axiosInstance.get('/api/audit-logs/stats'),
};

export default auditService;
