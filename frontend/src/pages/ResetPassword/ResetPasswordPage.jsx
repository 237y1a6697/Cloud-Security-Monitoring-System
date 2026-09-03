/**
 * ResetPasswordPage.jsx
 *
 * Route: /reset-password?token=... (public)
 * Reads the reset token from URL, validates on submit, updates password.
 *
 * Design: matches existing auth-card / login.css look exactly.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../../services/authService.js';
import logo from '../../assets/logo.svg';
import '../../styles/login.css';

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Redirect to login after successful reset
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => navigate('/login?reset', { replace: true }), 3000);
            return () => clearTimeout(timer);
        }
    }, [success, navigate]);

    // If no token in URL, show a clear error immediately
    if (!token) {
        return (
            <div className="auth-body">
                <div className="bg-canvas" />
                <div className="bg-grid" />
                <div className="auth-card">
                    <div className="brand">
                        <img src={logo} alt="SentinelCore Logo" className="brand-logo" />
                        <h1>SentinelCore SecureOps</h1>
                        <p>Cybersecurity Infrastructure Monitoring Portal</p>
                    </div>
                    <div className="alert alert-danger" style={{ justifyContent: 'center' }}>
                        ⚠️ Invalid or missing password reset link.
                    </div>
                    <div className="link-row" style={{ marginTop: 16 }}>
                        <Link to="/forgot-password">← Request a New Reset Link</Link>
                    </div>
                    <div className="link-row">
                        <Link to="/login">Back to Login</Link>
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

    // ── Password strength bar (lightweight) ─────────────────────────────
    function getStrength(pwd) {
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        return score; // 0-4
    }

    const strength = getStrength(newPassword);
    const strengthColors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];
    const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

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

                {/* Page title */}
                <div style={{ marginBottom: '22px', textAlign: 'center' }}>
                    <h2 style={{
                        color: '#e8edf8',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        margin: '0 0 6px',
                    }}>
                        🔒 Reset Your Password
                    </h2>
                    <p style={{ color: '#6b7fa0', fontSize: '0.82rem', margin: 0 }}>
                        Enter a new password for your account.
                    </p>
                </div>

                {/* Success state */}
                {success ? (
                    <div style={{ textAlign: 'center' }}>
                        <div className="alert alert-success" style={{ justifyContent: 'center', marginBottom: 16 }}>
                            ✅ Password reset successfully!
                        </div>
                        <p style={{ color: '#6b7fa0', fontSize: '0.83rem', marginBottom: 20 }}>
                            You can now log in with your new password.
                            Redirecting in 3 seconds…
                        </p>
                        <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', display: 'flex' }}>
                            Go to Login
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Error from backend (invalid/expired token etc.) */}
                        {error && (
                            <>
                                <div className="alert alert-danger">{error}</div>
                                {/* If token is invalid/expired, show request-new-link option */}
                                {(error.toLowerCase().includes('invalid') || error.toLowerCase().includes('expired') || error.toLowerCase().includes('used')) && (
                                    <div className="link-row" style={{ marginBottom: 14 }}>
                                        <Link to="/forgot-password">Request a New Reset Link</Link>
                                    </div>
                                )}
                            </>
                        )}

                        <form onSubmit={handleSubmit} noValidate>
                            {/* New Password */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="new-password">
                                    New Password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="new-password"
                                        type={showNew ? 'text' : 'password'}
                                        className="form-input"
                                        placeholder="Enter new password (min. 8 chars)"
                                        autoFocus
                                        autoComplete="new-password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        disabled={loading}
                                        style={{ paddingRight: '44px' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNew(v => !v)}
                                        style={{
                                            position: 'absolute', right: 12, top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none', border: 'none',
                                            cursor: 'pointer', color: '#6b7fa0',
                                            fontSize: '1rem', padding: 0,
                                        }}
                                        aria-label={showNew ? 'Hide password' : 'Show password'}
                                    >
                                        {showNew ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                {/* Strength Bar */}
                                {newPassword && (
                                    <div style={{ marginTop: 6 }}>
                                        <div className="password-strength">
                                            <div
                                                className="strength-bar"
                                                style={{
                                                    width: `${(strength / 4) * 100}%`,
                                                    background: strengthColors[strength],
                                                }}
                                            />
                                        </div>
                                        <span style={{
                                            fontSize: '0.72rem',
                                            color: strengthColors[strength],
                                            marginTop: 3,
                                            display: 'block',
                                        }}>
                                            {strengthLabels[strength]}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="confirm-password">
                                    Confirm New Password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="confirm-password"
                                        type={showConfirm ? 'text' : 'password'}
                                        className="form-input"
                                        placeholder="Confirm your new password"
                                        autoComplete="new-password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={loading}
                                        style={{ paddingRight: '44px' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(v => !v)}
                                        style={{
                                            position: 'absolute', right: 12, top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none', border: 'none',
                                            cursor: 'pointer', color: '#6b7fa0',
                                            fontSize: '1rem', padding: 0,
                                        }}
                                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                    >
                                        {showConfirm ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                {/* Mismatch inline hint */}
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <span style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 4, display: 'block' }}>
                                        Passwords do not match.
                                    </span>
                                )}
                                {confirmPassword && newPassword === confirmPassword && newPassword.length >= 8 && (
                                    <span style={{ fontSize: '0.72rem', color: '#22c55e', marginTop: 4, display: 'block' }}>
                                        ✓ Passwords match.
                                    </span>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="btn-primary"
                                id="resetPasswordBtn"
                                disabled={loading}
                                style={{ marginBottom: '18px' }}
                            >
                                {loading
                                    ? <><div className="btn-spinner" /> Resetting…</>
                                    : 'Reset Password'
                                }
                            </button>
                        </form>

                        <div className="link-row">
                            <Link to="/login">← Back to Login</Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
