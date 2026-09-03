/**
 * ForgotPasswordPage.jsx
 *
 * Route: /forgot-password (public)
 * Allows unauthenticated users to request a password-reset email.
 *
 * Design: matches the existing auth-card / login.css look exactly.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService.js';
import logo from '../../assets/logo.svg';
import '../../styles/login.css';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Please enter your email address.');
            return;
        }
        // Basic email format check (full validation happens on backend too)
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError('Please enter a valid email address.');
            return;
        }

        setLoading(true);
        try {
            await authService.forgotPassword(email.trim());
            // Always show success message — backend never reveals whether email exists
            setSubmitted(true);
        } catch (err) {
            // Even on network errors, show a generic friendly message
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

    return (
        <div className="auth-body">
            <div className="bg-canvas" />
            <div className="bg-grid" />

            <div className="auth-card">
                {/* Brand — identical to LoginPage */}
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
                        🔑 Forgot Password?
                    </h2>
                    <p style={{ color: '#6b7fa0', fontSize: '0.82rem', margin: 0 }}>
                        Enter your registered email and we&apos;ll send you a reset link.
                    </p>
                </div>

                {/* Success state */}
                {submitted ? (
                    <div style={{ textAlign: 'center' }}>
                        <div className="alert alert-success" style={{ justifyContent: 'center', marginBottom: 24 }}>
                            ✅ If an account exists for this email, a password reset link has been sent.
                            Please check your inbox (and spam folder).
                        </div>
                        <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', display: 'flex', marginBottom: 0 }}>
                            ← Back to Login
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Error alert */}
                        {error && (
                            <div className="alert alert-danger">{error}</div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} noValidate>
                            <div className="form-group">
                                <label className="form-label" htmlFor="reset-email">
                                    Email Address
                                </label>
                                <input
                                    id="reset-email"
                                    type="email"
                                    className="form-input"
                                    placeholder="Enter your registered email"
                                    autoFocus
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn-primary"
                                id="forgotPasswordBtn"
                                disabled={loading}
                                style={{ marginBottom: '18px' }}
                            >
                                {loading
                                    ? <><div className="btn-spinner" /> Sending…</>
                                    : 'Send Reset Link'
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
