/**
 * App.jsx
 *
 * Replaces: dashboard.js → initSidebarNav, switchPage (single-page tab switching)
 * Purpose : Root routing configuration for the React SPA.
 *           - PublicRoute: redirects already-authenticated users to /dashboard
 *           - ProtectedRoute: guards every dashboard page with auth + optional permission/role
 *           - AccessDenied: 403 fallback page
 */

import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

// ── Page Imports ─────────────────────────────────────────────────────────────
import LoginPage from './pages/Login/LoginPage.jsx';
import RegisterPage from './pages/Register/RegisterPage.jsx';
import DashboardPage from './pages/Dashboard/DashboardPage.jsx';
import InfrastructurePage from './pages/Infrastructure/InfrastructurePage.jsx';
import AssetsPage from './pages/Assets/AssetsPage.jsx';
import IncidentsPage from './pages/Incidents/IncidentsPage.jsx';
import ThreatIntelPage from './pages/ThreatIntelligence/ThreatIntelligencePage.jsx';
import VulnerabilitiesPage from './pages/Vulnerabilities/VulnerabilitiesPage.jsx';
import AuditLogsPage from './pages/AuditLogs/AuditLogsPage.jsx';
import CompliancePage from './pages/Compliance/CompliancePage.jsx';
import UsersPage from './pages/Users/UsersPage.jsx';
import ReportsPage from './pages/Reports/ReportsPage.jsx';
import SettingsPage from './pages/Settings/SettingsPage.jsx';

// ── Auth Wrappers ─────────────────────────────────────────────────────────────

/**
 * ProtectedRoute
 * Redirects unauthenticated users to /login.
 * Optionally checks a permission or role before rendering — redirects to /403 otherwise.
 */
function ProtectedRoute({ children, permission, role }) {
  const { isAuthenticated, loading, hasPermission, hasRole } = useAuth();

  if (loading) return null; // AuthContext is still hydrating — render nothing

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/403" replace />;
  }

  if (role && !hasRole(role) && !hasRole('ROLE_SUPER_ADMIN')) {
    return <Navigate to="/403" replace />;
  }

  return children;
}

/**
 * PublicRoute
 * Redirects already-authenticated users away from /login and /register.
 */
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

// ── Root Component ────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Routes>
      {/* ── Public ────────────────────────────────────────────────────────── */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* ── Dashboard ─────────────────────────────────────────────────────── */}
      <Route
        path="/dashboard"
        element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
      />

      {/* ── Infrastructure ────────────────────────────────────────────────── */}
      <Route
        path="/infrastructure"
        element={<ProtectedRoute permission="ASSET_VIEW"><InfrastructurePage /></ProtectedRoute>}
      />

      {/* ── Assets ────────────────────────────────────────────────────────── */}
      <Route
        path="/assets"
        element={<ProtectedRoute permission="ASSET_VIEW"><AssetsPage /></ProtectedRoute>}
      />

      {/* ── Incidents ─────────────────────────────────────────────────────── */}
      <Route
        path="/incidents"
        element={<ProtectedRoute permission="INCIDENT_VIEW"><IncidentsPage /></ProtectedRoute>}
      />

      {/* ── Threat Intelligence ───────────────────────────────────────────── */}
      <Route
        path="/threat-intelligence"
        element={<ProtectedRoute permission="ASSET_VIEW"><ThreatIntelPage /></ProtectedRoute>}
      />

      {/* ── Vulnerabilities ───────────────────────────────────────────────── */}
      <Route
        path="/vulnerabilities"
        element={<ProtectedRoute permission="ASSET_VIEW"><VulnerabilitiesPage /></ProtectedRoute>}
      />

      {/* ── Audit Logs ────────────────────────────────────────────────────── */}
      <Route
        path="/audit-logs"
        element={<ProtectedRoute permission="AUDIT_VIEW"><AuditLogsPage /></ProtectedRoute>}
      />

      {/* ── Compliance ────────────────────────────────────────────────────── */}
      <Route
        path="/compliance"
        element={<ProtectedRoute permission="COMPLIANCE_VIEW"><CompliancePage /></ProtectedRoute>}
      />

      {/* ── Users ─────────────────────────────────────────────────────────── */}
      <Route
        path="/users"
        element={<ProtectedRoute permission="USER_MANAGE"><UsersPage /></ProtectedRoute>}
      />

      {/* ── Reports ───────────────────────────────────────────────────────── */}
      <Route
        path="/reports"
        element={<ProtectedRoute><ReportsPage /></ProtectedRoute>}
      />

      {/* ── Settings ──────────────────────────────────────────────────────── */}
      <Route
        path="/settings"
        element={<ProtectedRoute role="ROLE_ADMIN"><SettingsPage /></ProtectedRoute>}
      />

      {/* ── 403 & Catch-All ───────────────────────────────────────────────── */}
      <Route path="/403" element={<AccessDenied />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// ── 403 Page ──────────────────────────────────────────────────────────────────

function AccessDenied() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'var(--bg-base, #0f1320)',
      color: 'var(--text-primary, #e8edf8)',
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: '4rem', color: 'var(--danger-red, #c62828)', margin: 0 }}>403</h1>
      <h2 style={{ margin: '12px 0 8px' }}>Access Denied</h2>
      <p style={{ color: 'var(--text-muted)' }}>
        You do not have the required permissions to view this resource.
      </p>
      <Link
        to="/dashboard"
        style={{ marginTop: 20, color: 'var(--highlight-blue, #1976d2)', textDecoration: 'none' }}
      >
        ← Return to Dashboard
      </Link>
    </div>
  );
}
