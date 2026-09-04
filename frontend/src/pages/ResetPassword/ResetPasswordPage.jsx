import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../../services/authService.js';
import '../../styles/login.css';

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => navigate('/login?reset', { replace: true }), 3000);
            return () => clearTimeout(timer);
        }
    }, [success, navigate]);

    if (!token) {
        return (
            <div className="modern-auth-body">
                <div className="bg-digital-city"></div>
                <div className="auth-split-layout" style={{ justifyContent: 'center' }}>
                    <div className="auth-right">
                        <div className="modern-glass-card" style={{ textAlign: 'center' }}>
                            <div className="glass-brand">
                                <div className="glass-logo">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                    </svg>
                                </div>
                                <h1>CSMS-IMA Platform</h1>
                            </div>
                            <div className="form-alert error" style={{ justifyContent: 'center' }}>
                                ⚠️ Invalid or missing password reset link.
                            </div>
                            <div className="modern-link-row" style={{ marginTop: 24, marginBottom: 12 }}>
                                <Link to="/forgot-password">← Request a New Reset Link</Link>
                            </div>
                            <div className="modern-link-row">
                                <Link to="/login">Back to Login</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function validate() {
        if (!newPassword) return 'New password is required.';
        if (newPassword.length < 8) return 'Password must be at least 8 characters.';
        if (!confirmPassword) return 'Please confirm your new password.';
        if (newPassword !== confirmPassword) return 'Passwords do not match.';
        return null;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        try {
            await authService.resetPassword(token, newPassword, confirmPassword);
            setSuccess(true);
        } catch (err) {
            const msg = err?.response?.data?.message;
            if (msg) {
                setError(msg);
            } else if (err?.code === 'ERR_NETWORK' || err?.code === 'ERR_CONNECTION_REFUSED') {
                setError('🔌 Connection error. Make sure the backend server is running.');
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }

    function getStrength(pwd) {
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        return score;
    }

    const strength = getStrength(newPassword);
    const strengthColors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];
    const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

    return (
        <div className="modern-auth-body">
            <div className="bg-digital-city"></div>

            <div className="auth-split-layout" style={{ justifyContent: 'center' }}>
                <div className="auth-right">
                    <div className="modern-glass-card">
                        <div className="glass-brand">
                            <div className="glass-logo">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                            </div>
                            <h1>CSMS-IMA Platform</h1>
                            <p>Cybersecurity Infrastructure Monitoring Portal</p>
                        </div>

                        <div style={{ marginBottom: '25px', textAlign: 'center' }}>
                            <h2 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: 600, margin: '0 0 6px' }}>
                                🔒 Reset Your Password
                            </h2>
                            <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>
                                Enter a new password for your account.
                            </p>
                        </div>

                        {success ? (
                            <div style={{ textAlign: 'center' }}>
                                <div className="form-alert success" style={{ marginBottom: 16 }}>
                                    ✅ Password reset successfully!
                                </div>
                                <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 20 }}>
                                    You can now log in with your new password.<br />
                                    Redirecting in 3 seconds…
                                </p>
                                <Link to="/login" className="glass-btn-primary" style={{ textDecoration: 'none' }}>
                                    Go to Login →
                                </Link>
                            </div>
                        ) : (
                            <>
                                {error && (
                                    <>
                                        <div className="form-alert error">{error}</div>
                                        {(error.toLowerCase().includes('invalid') || error.toLowerCase().includes('expired') || error.toLowerCase().includes('used')) && (
                                            <div className="modern-link-row" style={{ marginBottom: 14 }}>
                                                <Link to="/forgot-password">Request a New Reset Link</Link>
                                            </div>
                                        )}
                                    </>
                                )}

                                <form onSubmit={handleSubmit} noValidate>
                                    <div className="modern-form-group">
                                        <label>NEW PASSWORD</label>
                                        <div className="input-wrapper">
                                            <input
                                                type={"password"}
                                                placeholder="Enter new password (min. 8 chars)"
                                                autoFocus
                                                autoComplete="new-password"
                                                required
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                disabled={loading}
                                                style={{ paddingLeft: '14px' }}
                                            />
                                        </div>
                                        {newPassword && (
                                            <div style={{ marginTop: 8 }}>
                                                <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${(strength / 4) * 100}%`, background: strengthColors[strength], transition: 'all 0.3s' }} />
                                                </div>
                                                <span style={{ fontSize: '0.72rem', color: strengthColors[strength], marginTop: 4, display: 'block' }}>
                                                    {strengthLabels[strength]}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="modern-form-group">
                                        <label>CONFIRM NEW PASSWORD</label>
                                        <div className="input-wrapper">
                                            <input
                                                type={"password"}
                                                placeholder="Confirm your new password"
                                                autoComplete="new-password"
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                disabled={loading}
                                                style={{ paddingLeft: '14px' }}
                                            />
                                        </div>
                                        {confirmPassword && newPassword !== confirmPassword && (
                                            <span style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 6, display: 'block' }}>
                                                Passwords do not match.
                                            </span>
                                        )}
                                        {confirmPassword && newPassword === confirmPassword && newPassword.length >= 8 && (
                                            <span style={{ fontSize: '0.72rem', color: '#22c55e', marginTop: 6, display: 'block' }}>
                                                ✓ Passwords match.
                                            </span>
                                        )}
                                    </div>

                                    <button type="submit" className="glass-btn-primary" disabled={loading} style={{ marginBottom: '20px' }}>
                                        {loading ? <span className="spinner" /> : 'Reset Password →'}
                                    </button>
                                </form>

                                <div className="modern-link-row" style={{ marginBottom: 0 }}>
                                    <Link to="/login" style={{ marginLeft: 0 }}>← Back to Login</Link>
                                </div>
                            </>
                        )}
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
