/**
 * Sidebar.jsx
 *
 * Replaces: <aside class="sidebar" id="appSidebar"> in dashboard.html (lines 642–732)
 * Purpose : Permission-aware sidebar navigation. Uses React Router <NavLink> for
 *           active-state management instead of data-page JS tab switching.
 *
 * RBAC rules mirror the sec:authorize attributes from dashboard.html exactly:
 *  - Dashboard      : ASSET_VIEW
 *  - Infrastructure : ASSET_VIEW
 *  - Assets         : ASSET_VIEW
 *  - Incidents      : INCIDENT_MANAGE or ASSET_VIEW
 *  - Threat Intel   : VULN_MANAGE or ASSET_VIEW
 *  - Vulnerabilities: VULN_MANAGE or ASSET_VIEW
 *  - Audit Logs     : AUDIT_VIEW
 *  - Compliance     : COMPLIANCE_VIEW
 *  - Users          : USER_MANAGE
 *  - Reports        : REPORT_EXPORT or ASSET_VIEW
 *  - Settings       : ROLE_ADMIN or ROLE_SUPER_ADMIN
 *  - Logout         : always visible
 */

import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';

export default function Sidebar({ collapsed, onToggle }) {
    const { hasPermission, hasRole, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // RBAC helpers
    const canView = hasPermission('ASSET_VIEW');
    const canIncident = hasPermission('INCIDENT_MANAGE') || canView;
    const canVuln = hasPermission('VULN_MANAGE') || canView;
    const canAudit = hasPermission('AUDIT_VIEW');
    const canCompliance = hasPermission('COMPLIANCE_VIEW');
    const canUsers = hasPermission('USER_MANAGE');
    const canReports = hasPermission('REPORT_EXPORT') || canView;
    const canSettings = hasRole('ROLE_ADMIN') || hasRole('ROLE_SUPER_ADMIN');

    async function handleLogout() {
        await logout();
        navigate('/login?logout', { replace: true });
    }

    // Nav items config — exact icon classes + text from dashboard.html
    const navItems = [
        { to: '/dashboard', icon: 'ph-squares-four', label: 'Dashboard', show: canView },
        { to: '/infrastructure', icon: 'ph-tree-structure', label: 'Infrastructure', show: canView },
        { to: '/assets', icon: 'ph-hard-drives', label: 'Assets', show: canView },
        { to: '/incidents', icon: 'ph-shield-warning', label: 'Incidents', show: canIncident },
        { to: '/threat-intelligence', icon: 'ph-target', label: 'Threat Intelligence', show: canVuln },
        { to: '/vulnerabilities', icon: 'ph-bug', label: 'Vulnerabilities', show: canVuln },
        { to: '/audit-logs', icon: 'ph-scroll', label: 'Audit Logs', show: canAudit },
        { to: '/compliance', icon: 'ph-check-circle', label: 'Compliance', show: canCompliance },
        { to: '/users', icon: 'ph-users', label: 'Users', show: canUsers },
        { to: '/reports', icon: 'ph-chart-bar', label: 'Reports', show: canReports },
        { to: '/settings', icon: 'ph-gear', label: 'Settings', show: canSettings },
    ];

    return (
        <aside className={`sidebar${collapsed ? ' collapsed' : ''}`} id="appSidebar">
            {/* Toggle button — mirrors #sidebarToggleBtn */}
            <div
                className="sidebar-toggle-btn"
                id="sidebarToggleBtn"
                title="Toggle Sidebar"
                onClick={onToggle}
            >
                <i className="ph ph-list" />
            </div>

            <nav>
                <ul className="nav-list">
                    {navItems.map(({ to, icon, label, show }) => {
                        const isActive = location.pathname === to;
                        return show ? (
                            <li key={to} className={`nav-item${isActive ? ' active' : ''}`}>
                                <NavLink
                                    to={to}
                                    className="nav-link"
                                >
                                    <i className={`ph ${icon}`} />
                                    <span className="nav-text">{label}</span>
                                </NavLink>
                            </li>
                        ) : null;
                    })}

                    {/* Logout — always visible, mirrors #sidebarLogoutBtn */}
                    <li className="nav-item" id="menu-logout-side">
                        <button
                            className="nav-link"
                            id="sidebarLogoutBtn"
                            onClick={handleLogout}
                            style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <i className="ph ph-sign-out" />
                            <span className="nav-text">Logout</span>
                        </button>
                    </li>
                </ul>
            </nav>

            {/* Sidebar footer — mirrors .sidebar-footer */}
            <div className="sidebar-footer">
                <div className="status-indicator minified-hide">
                    <span className="status-dot pulsing" id="healthPulseDot" />
                    <span>Sentinel Active</span>
                </div>
            </div>
        </aside>
    );
}
