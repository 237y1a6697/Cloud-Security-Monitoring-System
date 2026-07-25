import axios from 'axios';

// Axios instance — withCredentials keeps JSESSIONID cookie alive
const api = axios.create({
    baseURL: '',           // same origin — Vite proxy forwards to :8080
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});

// ── CSRF token helper ────────────────────────────────────────────────────────
// Spring Security sends XSRF-TOKEN cookie by default.
function getCsrfToken() {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

// Attach CSRF token to every mutating request
api.interceptors.request.use((config) => {
    const mutating = ['post', 'put', 'delete', 'patch'];
    if (mutating.includes(config.method?.toLowerCase())) {
        const token = getCsrfToken();
        if (token) config.headers['X-XSRF-TOKEN'] = token;
    }
    return config;
});

// Global 401/403 handler
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            window.location.href = '/login?expired';
        }
        return Promise.reject(err);
    }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
    // Spring Security form login (x-www-form-urlencoded)
    login: (username, password, rememberMe = false) => {
        const body = new URLSearchParams();
        body.append('username', username);
        body.append('password', password);
        if (rememberMe) body.append('remember-me', 'on');
        return axios.post('/login', body, {
            withCredentials: true,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            maxRedirects: 0,
            validateStatus: (s) => s < 400 || s === 302,
        });
    },
    logout: () => {
        // POST to Spring /logout with CSRF
        const body = new URLSearchParams();
        const csrf = getCsrfToken();
        if (csrf) body.append('_csrf', csrf);
        return axios.post('/logout', body, {
            withCredentials: true,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
    },
    register: (data) => api.post('/api/users/register', data),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
    getStats: () => api.get('/api/dashboard/stats'),
    getCurrentUser: () => api.get('/api/dashboard/user'),
    getIncidentStatus: () => api.get('/api/dashboard/incidents/status'),
    getIncidentSeverity: () => api.get('/api/dashboard/incidents/severity'),
    getIncidentTrend: () => api.get('/api/dashboard/incidents/trend'),
    getRecentIncidents: () => api.get('/api/dashboard/incidents/recent'),
    getRecentAlerts: () => api.get('/api/dashboard/alerts/recent'),
    getRecentAuditLogs: () => api.get('/api/dashboard/audit-logs/recent'),
};

// ── Assets ────────────────────────────────────────────────────────────────────
export const assetsApi = {
    getAll: () => api.get('/api/assets'),
    getById: (id) => api.get(`/api/assets/${id}`),
    create: (data) => api.post('/api/assets', data),
    update: (id, data) => api.put(`/api/assets/${id}`, data),
    delete: (id) => api.delete(`/api/assets/${id}`),
    search: (keyword) => api.get('/api/assets/search', { params: { keyword } }),
    byStatus: (status) => api.get(`/api/assets/status/${status}`),
};

// ── Incidents ─────────────────────────────────────────────────────────────────
export const incidentsApi = {
    getAll: () => api.get('/api/incidents'),
    getById: (id) => api.get(`/api/incidents/${id}`),
    create: (data) => api.post('/api/incidents', data),
    update: (id, data) => api.put(`/api/incidents/${id}`, data),
    delete: (id) => api.delete(`/api/incidents/${id}`),
};

// ── Infrastructure ────────────────────────────────────────────────────────────
export const infrastructureApi = {
    getTelemetry: () => api.get('/api/infrastructure/telemetry'),
};

// ── Vulnerabilities ───────────────────────────────────────────────────────────
export const vulnerabilitiesApi = {
    getAll: () => api.get('/api/vulnerabilities'),
    patch: (id) => api.post(`/api/vulnerabilities/${id}/patch`),
};

// ── Compliance ────────────────────────────────────────────────────────────────
export const complianceApi = {
    getStandards: () => api.get('/api/compliance/standards'),
    getControls: () => api.get('/api/compliance/controls'),
};

// ── Audit Logs ────────────────────────────────────────────────────────────────
export const auditLogsApi = {
    getAll: (page = 0, size = 20, sortBy = 'timestamp', sortDir = 'desc') =>
        api.get('/api/audit-logs', { params: { page, size, sortBy, sortDir } }),
    getAllList: () => api.get('/api/audit-logs/all'),
    getByUsername: (username) => api.get(`/api/audit-logs/username/${username}`),
    getByAction: (action) => api.get(`/api/audit-logs/action/${action}`),
    getByResult: (result) => api.get(`/api/audit-logs/result/${result}`),
    getStats: () => api.get('/api/audit-logs/stats'),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
    getAll: () => api.get('/api/users'),
    assignRole: (id, role) => api.put(`/api/users/${id}/role`, null, { params: { role } }),
    setEnabled: (id, enabled) => api.put(`/api/users/${id}/disable`, null, { params: { enabled } }),
    resetPassword: (id, newPassword) => api.put(`/api/users/${id}/reset-password`, null, { params: { newPassword } }),
    delete: (id) => api.delete(`/api/users/${id}`),
};

export default api;
