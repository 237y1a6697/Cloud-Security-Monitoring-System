import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService.js';
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
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError('Please enter a valid email address.');
            return;
        }

        setLoading(true);
        try {
            await authService.forgotPassword(email.trim());
            setSubmitted(true);
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
                            <h2 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>
                                🔑 Forgot Password?
                            </h2>
                            <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.5 }}>
                                Enter your registered email and we&apos;ll send you a reset link.
                            </p>
                        </div>

                        {submitted ? (
                            <div style={{ textAlign: 'center' }}>
                                <div className="form-alert success" style={{ marginBottom: '24px' }}>
                                    ✅ If an account exists for this email, a password reset link has been sent.
                                    Please check your inbox (and spam folder).
                                </div>
                                <Link to="/login" className="glass-btn-primary" style={{ textDecoration: 'none' }}>
                                    ← Back to Login
                                </Link>
                            </div>
                        ) : (
                            <>
                                {error && <div className="form-alert error">{error}</div>}

                                <form onSubmit={handleSubmit} noValidate>
                                    <div className="modern-form-group">
                                        <label>EMAIL ADDRESS</label>
                                        <div className="input-wrapper">
                                            <input
                                                type="email"
                                                placeholder="Enter your registered email"
                                                autoFocus
                                                autoComplete="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                disabled={loading}
                                                style={{ paddingLeft: '14px' }}
                                            />
                                        </div>
                                    </div>

                                    <button type="submit" className="glass-btn-primary" disabled={loading} style={{ marginBottom: '20px' }}>
                                        {loading ? <span className="spinner" /> : 'Send Reset Link →'}
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
