/**
 * SentinelCore SecureOps — Central Axios Instance
 *
 * Purpose: Creates the shared HTTP client used by all service modules.
 *   - withCredentials keeps JSESSIONID (Spring Security session) alive across requests
 *   - CSRF interceptor reads the XSRF-TOKEN cookie and attaches it on every mutating request
 *   - 401 interceptor redirects to /login ONLY when a session was previously established
 *     (avoids redirect loop on the initial unauthenticated load / session-check)
 *
 * PRODUCTION NOTE:
 *   VITE_API_URL must be set on Vercel to your Render backend URL (no trailing slash):
 *   e.g.  https://sentinelcore-backend.onrender.com
 *   Locally it is empty so Vite's dev proxy handles /api/* to the local backend
 */

import axios from 'axios';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Reads the XSRF-TOKEN cookie set by Spring Security's CsrfFilter.
 * @returns {string|null}
 */
function getCsrfToken() {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

// ── Instance ─────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || '';

const axiosInstance = axios.create({
    baseURL: API_BASE,       // '' in dev (Vite proxy), Render URL in production
    withCredentials: true,   // CRITICAL: sends JSESSIONID cookie on every request
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── Request interceptor: attach CSRF token ────────────────────────────────────

axiosInstance.interceptors.request.use((config) => {
    const mutating = ['post', 'put', 'delete', 'patch'];
    if (mutating.includes(config.method?.toLowerCase())) {
        const token = getCsrfToken();
        if (token) {
            config.headers['X-XSRF-TOKEN'] = token;
        }
    }
    return config;
});

// ── Response interceptor: handle 401 session expiry ──────────────────────────

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const currentPath = window.location.pathname;
            const requestUrl = error.config?.url || '';

            // Do NOT redirect if:
            //  1. Already on login page (infinite loop prevention)
            //  2. This is the initial session-check call (made before auth is known)
            //  3. This is the login request itself (let the caller handle the 401)
            const isLoginPage = currentPath === '/login' || currentPath.startsWith('/login');
            const isSessionCheck = requestUrl.includes('/api/dashboard/user');
            const isLoginAttempt = requestUrl.endsWith('/login');

            if (!isLoginPage && !isSessionCheck && !isLoginAttempt) {
                window.location.href = '/login?expired';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
