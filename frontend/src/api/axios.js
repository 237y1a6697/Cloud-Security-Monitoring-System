/**
 * SentinelCore SecureOps — Central Axios Instance
 *
 * Replaces: src/main/resources/static/js/server.js
 * Purpose : Creates the shared HTTP client used by all service modules.
 *           - withCredentials keeps JSESSIONID (Spring Security session) alive
 *           - CSRF interceptor reads the XSRF-TOKEN cookie and attaches it on
 *             every mutating request (POST / PUT / DELETE / PATCH)
 *           - 401 interceptor redirects to login ONLY when a session was previously
 *             established (avoids redirect loop on initial unauthenticated load)
 *
 * FIX NOTES:
 *  - 401 redirect guard: only redirect if NOT already on /login and NOT the
 *    /api/dashboard/user check (that call is made before auth is known)
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

// VITE_API_URL must be set on Vercel to your Render backend URL,
// e.g. https://sentinelcore.onrender.com
// Locally it is empty so Vite's dev proxy handles /api/* → localhost:8081
const API_BASE = import.meta.env.VITE_API_URL || '';

const axiosInstance = axios.create({
    baseURL: API_BASE,       // '' in dev (Vite proxy), Render URL in production
    withCredentials: true,   // Send JSESSIONID cookie on every request
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
            //  2. This is the initial session-check call on app load
            const isLoginPage = currentPath === '/login' || currentPath.startsWith('/login');
            const isSessionCheck = requestUrl.includes('/api/dashboard/user');

            if (!isLoginPage && !isSessionCheck) {
                window.location.href = '/login?expired';
            }
        } else if (error.response?.status === 403) {
            window.location.href = '/403';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
