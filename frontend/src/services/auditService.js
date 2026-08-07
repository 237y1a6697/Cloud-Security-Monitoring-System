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
     * Paginated audit logs with dynamic database-driven filtering.
     * @param {number} page - Zero-based page index
     * @param {number} size - Records per page (default 20)
     * @param {string} sortBy  - Field to sort by (default 'timestamp')
     * @param {string} sortDir - 'asc' | 'desc'
     * @param {string} search - Search query content
     * @param {string} outcome - Outcome check: SUCCESS | FAILED | DENIED
     * @param {string} startDate - HTML Date string YYYY-MM-DD
     * @param {string} endDate - HTML Date string YYYY-MM-DD
     */
    getAll: (page = 0, size = 20, sortBy = 'timestamp', sortDir = 'desc', search = '', outcome = '', startDate = '', endDate = '') =>
        axiosInstance.get('/api/audit-logs', {
            params: { page, size, sortBy, sortDir, search, outcome, startDate, endDate }
        }),

    /** Fetch full list without paging (used for legacy layouts) */
    getAllList: () => axiosInstance.get('/api/audit-logs/all'),

    /** Filter logs by username */
    getByUsername: (username) => axiosInstance.get(`/api/audit-logs/username/${username}`),

    /** Filter logs by action type */
    getByAction: (action) => axiosInstance.get(`/api/audit-logs/action/${action}`),

    /** Filter logs by result: SUCCESS | FAILED | DENIED */
    getByResult: (result) => axiosInstance.get(`/api/audit-logs/result/${result}`),

    /** Aggregate stats for the stat cards (total, success, failed, denied) */
    getStats: () => axiosInstance.get('/api/audit-logs/stats'),

    /** Export audit logs matching active filters as CSV or PDF blob */
    exportLogs: (format, search = '', outcome = '', startDate = '', endDate = '') =>
        axiosInstance.get(`/api/audit-logs/export/${format}`, {
            params: { search, outcome, startDate, endDate },
            responseType: 'blob'
        }),

    /** Attach evidence filename to an audit log in the database */
    attachEvidence: (id, filename) =>
        axiosInstance.post(`/api/audit-logs/${id}/evidence`, null, {
            params: { filename }
        })
};

export default auditService;
