/**
 * RegisterPage.jsx
 *
 * Replaces: src/main/resources/templates/register.html
 * Consumes: POST /api/users/register (authService.register())
 *
 * Pixel-perfect port of register.html.
 * - Same animated background and auth-card (wide variant)
 * - Same two-column form grid layout
 * - Same fields: firstName, lastName, username, email, password, confirmPassword,
 *   phone, organization, role
 * - Same password strength bar (5-point scoring — replaces oninput="checkStrength()")
 * - Same role select options with emojis
 * - On success → navigate to /login?registered
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService.js';
import { useToast } from '../../components/common/Toast/Toast.jsx';
import logo from '../../assets/logo.svg';
import '../../styles/login.css';

// ── Password strength scorer — ports the checkStrength() JS function ──────────
function computeStrength(val) {
    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 10) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];
    const widths = ['20%', '40%', '60%', '80%', '100%'];
    const idx = Math.min(score, 4);
    return { width: val ? widths[idx] : '0', background: val ? colors[idx] : 'transparent' };
}

// ── Username validation regex (must match backend rule) ──────────────────────
const USERNAME_REGEX = /^[A-Za-z][A-Za-z0-9._-]{2,29}$/;
const USERNAME_ERROR_MSG = "Username must start with a letter and contain only letters, numbers, '.', '_' or '-'.";

export default function RegisterPage() {
    const navigate = useNavigate();
    const showToast = useToast();

    const [form, setForm] = useState({
        firstName: '', lastName: '', username: '', email: '',
        password: '', confirmPassword: '', phone: '', organization: '',
    });
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [usernameError, setUsernameError] = useState('');

    const strength = computeStrength(form.password);

    function handle(field) {
        return (e) => {
            const val = e.target.value;
            setForm((prev) => ({ ...prev, [field]: val }));
            if (field === 'username') {
                if (val && !USERNAME_REGEX.test(val)) {
                    setUsernameError(USERNAME_ERROR_MSG);
                } else {
                    setUsernameError('');
                }
            }
        };
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!form.username || !form.password) {
            const msg = 'Username and password are required.';
            setError(msg);
            showToast(msg, 'error');
            return;
        }
        if (!USERNAME_REGEX.test(form.username.trim())) {
            const msg = USERNAME_ERROR_MSG;
            setError(msg);
            setUsernameError(msg);
            showToast(msg, 'error');
            return;
        }
        if (form.password !== form.confirmPassword) {
            const msg = 'Passwords do not match.';
            setError(msg);
            showToast(msg, 'error');
            return;
        }
        if (form.password.length < 6) {
            const msg = 'Password must be at least 6 characters.';
            setError(msg);
            showToast(msg, 'error');
            return;
        }
        if (!agreed) {
            const msg = 'You must agree to the Terms of Service.';
            setError(msg);
            showToast(msg, 'error');
            return;
        }

        setLoading(true);
        try {
            await authService.register({
                firstName: form.firstName,
                lastName: form.lastName,
                username: form.username.trim(),
                email: form.email,
                password: form.password,
                phone: form.phone,
                organization: form.organization,
                // No `role` field — backend always assigns ROLE_VIEWER for self-registration
            });
            showToast('Account created successfully!', 'success');
            // Redirect to /login with ?registered flag — mirrors Thymeleaf redirect
            navigate('/login?registered', { replace: true });
        } catch (err) {
            const msg = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.response?.data
                || 'Registration failed. Please try again.';
            const processedMsg = typeof msg === 'string' ? msg : 'Registration failed. Please try again.';
            setError(processedMsg);
            showToast(processedMsg, 'error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-body">
            <div className="bg-canvas register" />
            <div className="bg-grid" />

            <div className="auth-card wide">
                {/* Brand */}
                <div className="brand">
                    <img src={logo} alt="SentinelCore Logo" className="brand-logo" style={{ width: 46, height: 46 }} />
                    <h1 style={{ fontSize: '1.18rem' }}>Create Account</h1>
                    <p>SentinelCore SecureOps Platform</p>
                </div>

                {/* Alerts */}
                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-grid">
                        {/* First + Last Name */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="firstName">First Name</label>
                            <input type="text" id="firstName" name="firstName" className="form-input"
                                placeholder="Jane" value={form.firstName} onChange={handle('firstName')} />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="lastName">Last Name</label>
                            <input type="text" id="lastName" name="lastName" className="form-input"
                                placeholder="Smith" value={form.lastName} onChange={handle('lastName')} />
                        </div>

                        {/* Username */}
                        <div className="form-group full">
                            <label className="form-label" htmlFor="reg-username">
                                Username <span style={{ color: '#e05' }}>*</span>
                            </label>
                            <input type="text" id="reg-username" name="username" className="form-input"
                                placeholder="e.g. jane_smith or prashanth123" required autoComplete="username"
                                value={form.username} onChange={handle('username')}
                                style={usernameError ? { borderColor: '#e05252' } : {}}
                            />
                            {usernameError && (
                                <p style={{ color: '#e05252', fontSize: '0.78rem', marginTop: 4, marginBottom: 0 }}>
                                    {usernameError}
                                </p>
                            )}
                            <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.75rem', marginTop: 4, marginBottom: 0 }}>
                                3–30 chars · start with a letter · allowed: letters, digits, <code>.</code> <code>_</code> <code>-</code>
                            </p>
                        </div>

                        {/* Email */}
                        <div className="form-group full">
                            <label className="form-label" htmlFor="email">Email</label>
                            <input type="email" id="email" name="email" className="form-input"
                                placeholder="you@company.com" value={form.email} onChange={handle('email')} />
                        </div>

                        {/* Password */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="reg-password">
                                Password <span style={{ color: '#e05' }}>*</span>
                            </label>
                            <input type="password" id="reg-password" name="password" className="form-input"
                                placeholder="Min. 6 characters" required autoComplete="new-password"
                                value={form.password} onChange={handle('password')} />
                            <div className="password-strength">
                                <div className="strength-bar" style={{ width: strength.width, background: strength.background }} />
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="confirmPassword">
                                Confirm Password <span style={{ color: '#e05' }}>*</span>
                            </label>
                            <input type="password" id="confirmPassword" name="confirmPassword" className="form-input"
                                placeholder="Repeat password" required autoComplete="new-password"
                                value={form.confirmPassword} onChange={handle('confirmPassword')} />
                        </div>

                        {/* Phone */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="phone">
                                Phone <span className="optional">(optional)</span>
                            </label>
                            <input type="tel" id="phone" name="phone" className="form-input"
                                placeholder="+1 555 000 0000" value={form.phone} onChange={handle('phone')} />
                        </div>

                        {/* Organization */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="organization">Organization</label>
                            <input type="text" id="organization" name="organization" className="form-input"
                                placeholder="Your company" value={form.organization} onChange={handle('organization')} />
                        </div>

                        {/* Access Level Notice — replaces the old Role selector */}
                        <div className="form-group full">
                            <div style={{
                                background: 'rgba(58, 123, 213, 0.08)',
                                border: '1px solid rgba(58, 123, 213, 0.3)',
                                borderRadius: 6,
                                padding: '10px 14px',
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary, #94a3b8)',
                                lineHeight: 1.6
                            }}>
                                <strong style={{ color: 'var(--highlight-blue, #3a7bd5)', display: 'block', marginBottom: 2 }}>🔒 Access Level: Viewer (Read-Only)</strong>
                                All new accounts start with read-only Viewer access. A platform administrator can promote your role after registration.
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="form-group full">
                            <label className="terms-row">
                                <input type="checkbox" required checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                                I agree to the <a href="#">Terms of Service</a> and <a href="#">Security Policy</a>
                            </label>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 20 }}>
                        {loading
                            ? <><div className="btn-spinner" /> Creating account…</>
                            : 'Create Account'
                        }
                    </button>
                </form>

                <div className="link-row">Already have an account? <Link to="/login">Sign in</Link></div>
            </div>
        </div>
    );
}
