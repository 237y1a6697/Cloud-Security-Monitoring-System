import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
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

    const hasError = searchParams.has('error');
    const errorType = searchParams.get('error');
    const hasRegistered = searchParams.has('registered');
    const hasLogout = searchParams.has('logout');
    const hasAccess = searchParams.has('access');
    const hasExpired = searchParams.has('expired');
    const hasReset = searchParams.has('reset');

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
        } catch (err) {
            const status = err?.response?.status;
            if (status === 403 || status === 401) {
                setError('🔐 Invalid username or password. Please try again.');
            } else if (err?.code === 'ERR_NETWORK' || err?.code === 'ERR_CONNECTION_REFUSED') {
                setError('🔌 Connection error. Make sure the backend server is running.');
            } else {
                setError('🔐 Invalid username or password. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="modern-auth-body">
            {/* Extremely detailed CSS Background mimicking the screenshot */}
            <div className="bg-digital-city"></div>

            <div className="auth-split-layout">
                {/* Left Side Graphics */}
                <div className="auth-left">
                    <div className="shield-glow-container">
                        <svg viewBox="0 0 100 120" className="hero-shield">
                            <defs>
                                <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#3a7bd5" stopOpacity="0.8" />
                                    <stop offset="100%" stopColor="#00d2ff" stopOpacity="0.2" />
                                </linearGradient>
                                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="8" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>
                            <path d="M50 5 L90 20 L90 60 C90 90 50 115 50 115 C50 115 10 90 10 60 L10 20 Z"
                                fill="url(#shieldGrad)" stroke="#00d2ff" strokeWidth="2" filter="url(#glow)" />
                            <rect x="35" y="45" width="30" height="25" rx="4" fill="#00d2ff" />
                            <path d="M40 45 V35 C40 25 60 25 60 35 V45" fill="none" stroke="#00d2ff" strokeWidth="6" strokeLinecap="round" />
                            <circle cx="50" cy="57" r="4" fill="#0a0e1a" />
                            <path d="M48 57 L48 65 L52 65 L52 57 Z" fill="#0a0e1a" />
                        </svg>
                    </div>

                    <div className="features-row">
                        <div className="feature-item">
                            <div className="feature-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                            </div>
                            <h3>Monitor</h3>
                            <p>Real-time visibility into your infrastructure</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                            </div>
                            <h3>Protect</h3>
                            <p>Detect threats and respond faster</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            </div>
                            <h3>Comply</h3>
                            <p>Stay aligned with compliance standards</p>
                        </div>
                    </div>
                </div>

                {/* Right Side Login Card */}
                <div className="auth-right">
                    <div className="modern-glass-card">
                        <div className="glass-brand">
                            <div className="glass-logo">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                            </div>
                            <h1>Cloud Security Monitoring System <br /><span style={{ fontSize: '1rem', fontWeight: 500 }}>with Incident Management Assistance</span></h1>
                            <p>Cybersecurity Infrastructure Monitoring Portal</p>
                        </div>

                        {getErrorMessage() && (
                            <div className="form-alert error">{getErrorMessage()}</div>
                        )}
                        {hasRegistered && (
                            <div className="form-alert success">✅ Account created successfully! Log in below.</div>
                        )}
                        {hasLogout && (
                            <div className="form-alert success">👋 You have been signed out successfully.</div>
                        )}

                        <form onSubmit={handleSubmit} noValidate>
                            <div className="modern-form-group">
                                <label>USERNAME</label>
                                <div className="input-wrapper">
                                    <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                    <input
                                        type="text"
                                        placeholder="Enter your username"
                                        autoFocus
                                        autoComplete="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="modern-form-group">
                                <label>PASSWORD</label>
                                <div className="input-wrapper">
                                    <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                    <input
                                        type="password"
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="modern-form-helpers">
                                <label className="custom-check">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <span>Keep me signed in</span>
                                </label>
                                <Link to="/forgot-password" className="text-link">Forgot password?</Link>
                            </div>

                            <button type="submit" className="glass-btn-primary" disabled={loading}>
                                {loading ? <span className="spinner" /> : 'Sign In →'}
                            </button>
                        </form>

                        <div className="modern-divider"><span>or</span></div>

                        <div className="modern-link-row">
                            New to CSMS-IMA? <Link to="/register">Create an account</Link>
                        </div>

                        <div className="modern-demo-hint">
                            <div className="demo-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
                            </div>
                            <div className="demo-text">
                                <strong>Demo Credentials</strong>
                                admin / admin123 • Create your own account via Register
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="auth-footer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                Cloud Security Monitoring System • Protect. Monitor. Respond.
            </div>
        </div>
    );
}
