/**
 * authService.js
 *
 * Purpose : Handles login (Spring Security form-login), logout, and registration.
 *           Uses URLSearchParams for x-www-form-urlencoded — required by Spring.
 *
 * LOGIN FLOW:
 *  1. POST /login with username + password (x-www-form-urlencoded)
 *  2. Spring Security validates credentials:
 *     - SUCCESS → Spring 302 redirects to /dashboard (successHandler)
 *     - FAILURE → Spring 302 redirects to /login?error=xxx (failureHandler)
 *  3. Axios (browser XHR) follows the redirect transparently.
 *  4. We detect failure by checking if the final responseURL contains ?error.
 *  5. On any network error (redirect followed by browser/XHR), we swallow it —
 *     the caller checks session via /api/dashboard/user to confirm auth.
 *
 * CSRF:
 *  - /login is excluded from CSRF in SecurityConfig (same as /api/**)
 *  - No CSRF token needed for the login POST.
 */

import axiosInstance from '../api/axios.js';

const authService = {
    login: async (username, password, rememberMe = false) => {
        const body = new URLSearchParams();
        body.append('username', username);
        body.append('password', password);
        if (rememberMe) body.append('remember-me', 'on');

        try {
            const response = await axiosInstance.post('/login', body, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                validateStatus: () => true,
            });

            // Explicit 401 or 403 check
            if (response.status === 401) {
                const err = new Error('Bad credentials');
                err.response = { status: 401 };
                throw err;
            }

            if (response.status === 403) {
                const err = new Error('Forbidden');
                err.response = { status: 403 };
                throw err;
            }

            if (response.status >= 400) {
                const err = new Error('Bad request');
                err.response = { status: response.status };
                throw err;
            }

            return response;
        } catch (err) {
            if (err.response) throw err;
            console.error('[authService] Login network/request execution error:', err.message);
            throw err;
        }
    },

    logout: () => {
        const csrf = document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1];
        const body = new URLSearchParams();
        if (csrf) body.append('_csrf', decodeURIComponent(csrf));

        return axiosInstance.post('/logout', body, {
            withCredentials: true,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            validateStatus: () => true,
        });
    },

    register: (data) =>
        axiosInstance.post('/api/users/register', data, {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' },
        }),
};

export default authService;
