/**
 * LoginPage.jsx
 *
 * Replaces: src/main/resources/templates/login.html
 * Consumes: POST /login (Spring Security form-login via authService.login())
 *           GET  /api/dashboard/user (AuthContext.fetchCurrentUser after login)
 *
 * Pixel-perfect port of login.html.
 * - Same animated bg-canvas + bg-grid background
 * - Same auth-card layout with brand logo
 * - Same form fields: username, password, remember-me
 * - Same alert states: error / registered / logout / access
 * - Submit spinner replaces plain JS class manipulation
 * - On success → navigate to /dashboard
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import logo from '../../assets/logo.svg';
import '../../styles/login.css';

export default function LoginPage() {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Read alert type from URL query params — mirrors Thymeleaf th:if="${param.xxx}"
    const hasError = searchParams.has('error');
    const errorType = searchParams.get('error');
    const hasRegistered = searchParams.has('registered');
    const hasLogout = searchParams.has('logout');
    const hasAccess = searchParams.has('access');
    const hasExpired = searchParams.has('expired');
    const hasReset = searchParams.has('reset');

    // If session is already active, skip to dashboard
    useEffect(() => {
        if (isAuthenticated) navigate('/dashboard', { replace: true });
    }, [isAuthenticated, navigate]);

    function getErrorMessage() {
        if (error) return error;
        if (hasError) {
            if (errorType === 'locked') return '⚠ Your account has been locked. Contact an administrator.';
            if (errorType === 'disabled') return '⛔ This account is disabled. Contact support.';
            return '🔐 Invalid username or password. Please try again.';
        }
        if (hasExpired) return '🕐 Your session expired. Please log in again.';
        return '';
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!username.trim() || !password) {
            setError('Please enter your username and password.');
            return;
        }
        setError('');
        setLoading(true);

        try {
            await login(username.trim(), password, rememberMe);
            // Do NOT call navigate here — React batches setState so user would still be null
            // when ProtectedRoute renders, causing an immediate redirect back to /login.
            // The useEffect on line 43 handles navigation once isAuthenticated becomes true.
        } catch (err) {
            const status = err?.response?.status;
            if (status === 403 || status === 401) {
                setError('🔐 Invalid username or password. Please try again.');
            } else if (err?.code === 'ERR_NETWORK' || err?.code === 'ERR_CONNECTION_REFUSED') {
                setError('🔌 Connection error. Make sure the backend server is running.');

            } else {
                // Unknown error — likely bad credentials from Spring redirect to /login?error
                setError('🔐 Invalid username or password. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-body">
            <div className="bg-canvas" />
            <div className="bg-grid" />

            <div className="auth-card">
                {/* Brand */}
                <div className="brand">
                    <img src={logo} alt="SentinelCore Logo" className="brand-logo" />
                    <h1>SentinelCore SecureOps</h1>
                    <p>Cybersecurity Infrastructure Monitoring Portal</p>
                </div>

                {/* Alerts — mirrors Thymeleaf th:if conditionals */}
                {getErrorMessage() && (
                    <div className="alert alert-danger">{getErrorMessage()}</div>
                )}
                {hasRegistered && (
                    <div className="alert alert-success">✅ Account created successfully! Log in below.</div>
                )}
                {hasLogout && (
                    <div className="alert alert-success">👋 You have been signed out successfully.</div>
                )}
                {hasReset && (
                    <div className="alert alert-success">✅ Password reset successfully! You can now log in with your new password.</div>
                )}
                {hasAccess && (
                    <div className="alert alert-info">🚫 Access denied. You don&apos;t have permission for that resource.</div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label className="form-label" htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            className="form-input"
                            placeholder="Enter your username"
                            autoFocus
                            autoComplete="username"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="form-input"
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="form-helpers">
                        <label className="check-label">
                            <input
                                type="checkbox"
                                name="remember-me"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            Keep me signed in
                        </label>
                        <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
                    </div>

                    <button type="submit" className="btn-primary" id="loginBtn" disabled={loading}>
                        {loading
                            ? <><div className="btn-spinner" /> Signing in…</>
                            : 'Sign In'
                        }
                    </button>
                </form>

                <div className="divider">or</div>
                <div className="link-row">
                    New to SentinelCore? <Link to="/register">Create an account</Link>
                </div>

                <div className="demo-hint">
                    <strong>Demo Credentials</strong>
                    admin / admin123 &nbsp;·&nbsp; Create your own account via Register
                </div>
            </div>
        </div>
    );
}
