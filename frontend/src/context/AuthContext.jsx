/**
 * AuthContext.jsx
 *
 * Replaces: dashboard.js → window.CURRENT_USER / window.USER_PERMISSIONS
 *           auth.js → localStorage session management
 * Purpose : React context providing application-wide authentication state and RBAC helpers.
 *           On mount, hits GET /api/dashboard/user to load the active Spring Security session.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import dashboardService from '../services/dashboardService.js';
import authService from '../services/authService.js';

const AuthContext = createContext(null);

const ROLE_PERMISSIONS = {
    'ROLE_SUPER_ADMIN': [
        'USER_MANAGE', 'ROLE_ASSIGN',
        'ASSET_CREATE', 'ASSET_EDIT', 'ASSET_DELETE', 'ASSET_VIEW',
        'INCIDENT_VIEW', 'INCIDENT_CREATE', 'INCIDENT_MANAGE', 'INCIDENT_RESOLVE', 'INCIDENT_DELETE',
        'SERVER_RESTART', 'CLUSTER_SCALE', 'CLOUD_MODIFY',
        'VULN_MANAGE', 'COMPLIANCE_VIEW', 'REPORT_EXPORT', 'AUDIT_VIEW',
        'INTEGRATION_CONFIG', 'SETTINGS_ACCESS'
    ],
    'ROLE_ADMIN': [
        'ASSET_CREATE', 'ASSET_EDIT', 'ASSET_DELETE', 'ASSET_VIEW',
        'INCIDENT_VIEW', 'INCIDENT_CREATE', 'INCIDENT_MANAGE', 'INCIDENT_RESOLVE', 'INCIDENT_DELETE',
        'SERVER_RESTART', 'CLUSTER_SCALE', 'CLOUD_MODIFY',
        'VULN_MANAGE', 'COMPLIANCE_VIEW', 'REPORT_EXPORT', 'AUDIT_VIEW',
        'USER_MANAGE', 'ROLE_ASSIGN', 'SETTINGS_ACCESS', 'INTEGRATION_CONFIG'
    ],
    'ROLE_SOC_MANAGER': [
        'ASSET_VIEW',
        'INCIDENT_VIEW', 'INCIDENT_CREATE', 'INCIDENT_MANAGE', 'INCIDENT_RESOLVE',
        'REPORT_EXPORT', 'AUDIT_VIEW'
    ],
    'ROLE_SECURITY_ANALYST': [
        'ASSET_VIEW',
        'INCIDENT_VIEW', 'INCIDENT_CREATE', 'INCIDENT_MANAGE',
        'VULN_MANAGE', 'REPORT_EXPORT'
    ],
    'ROLE_INCIDENT_RESPONDER': [
        'ASSET_VIEW',
        'INCIDENT_VIEW', 'INCIDENT_MANAGE', 'INCIDENT_RESOLVE',
        'AUDIT_VIEW'
    ],
    'ROLE_INFRA_ENGINEER': [
        'ASSET_VIEW', 'ASSET_CREATE', 'ASSET_EDIT', 'ASSET_DELETE',
        'INCIDENT_VIEW',
        'SERVER_RESTART', 'CLUSTER_SCALE', 'CLOUD_MODIFY',
        'REPORT_EXPORT'
    ],
    'ROLE_DEVSECOPS': [
        'ASSET_VIEW', 'ASSET_CREATE', 'ASSET_EDIT',
        'INCIDENT_VIEW', 'INCIDENT_CREATE', 'INCIDENT_MANAGE',
        'VULN_MANAGE', 'SERVER_RESTART', 'CLUSTER_SCALE',
        'REPORT_EXPORT'
    ],
    'ROLE_AUDITOR': [
        'ASSET_VIEW',
        'INCIDENT_VIEW',
        'AUDIT_VIEW', 'COMPLIANCE_VIEW', 'REPORT_EXPORT'
    ],
    'ROLE_VIEWER': [
        'ASSET_VIEW', 'INCIDENT_VIEW'
    ]
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);   // { username, role, permissions[] }
    const [loading, setLoading] = useState(true);

    const applyTheme = useCallback((theme) => {
        const resolvedTheme = theme === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', resolvedTheme);
        document.documentElement.style.colorScheme = resolvedTheme;
        document.body.setAttribute('data-theme', resolvedTheme);
    }, []);

    /**
     * Hydrate the auth state from the active Spring Security session.
     * Called on first render and after every successful login.
     */
    const fetchCurrentUser = useCallback(async () => {
        try {
            const res = await dashboardService.getCurrentUser();
            if (res.data?.username) {
                const userRole = res.data.role || 'ROLE_VIEWER';
                const permissions = ROLE_PERMISSIONS[userRole] || [];
                setUser({
                    id: res.data.id,
                    username: res.data.username,
                    role: userRole,
                    lastLogin: res.data.lastLogin,
                    permissions: permissions,
                    displayName: res.data.displayName,
                    firstName: res.data.firstName,
                    lastName: res.data.lastName,
                    email: res.data.email,
                    phone: res.data.phone,
                    organization: res.data.organization,
                    designation: res.data.designation,
                    department: res.data.department,
                    employeeId: res.data.employeeId,
                    theme: res.data.theme,
                    notifications: res.data.notifications,
                    language: res.data.language,
                    timezone: res.data.timezone,
                    avatar: res.data.avatar,
                });
                applyTheme(res.data.theme || 'light');
            } else {
                setUser(null);
                applyTheme('light');
            }
        } catch {
            setUser(null);
            applyTheme('light');
        } finally {
            setLoading(false);
        }
    }, [applyTheme]);

    useEffect(() => { fetchCurrentUser(); }, [fetchCurrentUser]);

    useEffect(() => {
        if (user?.theme) {
            applyTheme(user.theme);
        }
    }, [applyTheme, user?.theme]);

    /**
     * Login: POST to Spring Security's /login, then refresh user state.
     */
    const login = useCallback(async (username, password, rememberMe) => {
        await authService.login(username, password, rememberMe);
        await fetchCurrentUser();
    }, [fetchCurrentUser]);

    /**
     * Logout: POST to /logout, clear local state, redirect to login page.
     */
    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } catch { /* ignore errors during logout */ }
        setUser(null);
        applyTheme('light');
        window.location.href = '/login?logout';
    }, [applyTheme]);

    const isAuthenticated = !!user;

    /**
     * RBAC helper: returns true if the current user holds the given permission.
     * @param {string} perm - e.g. 'ASSET_VIEW', 'INCIDENT_DELETE'
     */
    const hasPermission = useCallback(
        (perm) => user?.permissions?.includes(perm) ?? false,
        [user]
    );

    /**
     * RBAC helper: returns true if the current user's primary role matches.
     * @param {string} role - e.g. 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'
     */
    const hasRole = useCallback(
        (role) => user?.role === role,
        [user]
    );

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isAuthenticated,
            login,
            logout,
            hasPermission,
            hasRole,
            refetch: fetchCurrentUser,
            applyTheme,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
    return ctx;
}
