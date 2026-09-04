import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService.js';
import { useToast } from '../../components/common/Toast/Toast.jsx';
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
            });
            showToast('Account created successfully!', 'success');
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
        <div className="modern-auth-body">
            <div className="bg-digital-city"></div>

            <div className="auth-split-layout" style={{ justifyContent: 'center' }}>
                <div className="auth-right" style={{ width: '600px' }}>
                    <div className="modern-glass-card" style={{ padding: '40px' }}>
                        <div className="glass-brand" style={{ marginBottom: '25px' }}>
                            <div className="glass-logo" style={{ marginBottom: '12px' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                            </div>
                            <h1 style={{ fontSize: '1.2rem' }}>Create Account</h1>
                            <p>CSMS-IMA Platform</p>
                        </div>

                        {error && <div className="form-alert error">{error}</div>}
                        {success && <div className="form-alert success">{success}</div>}

                        <form onSubmit={handleSubmit} noValidate>
                            {/* Generic grid utilizing flex layout for 2 cols */}
                            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                                <div className="modern-form-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label>FIRST NAME</label>
                                    <div className="input-wrapper">
                                        <input type="text" placeholder="Jane" value={form.firstName} onChange={handle('firstName')} style={{ paddingLeft: '14px' }} />
                                    </div>
                                </div>
                                <div className="modern-form-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label>LAST NAME</label>
                                    <div className="input-wrapper">
                                        <input type="text" placeholder="Smith" value={form.lastName} onChange={handle('lastName')} style={{ paddingLeft: '14px' }} />
                                    </div>
                                </div>
                            </div>

                            <div className="modern-form-group">
                                <label>USERNAME <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="input-wrapper">
                                    <input type="text" required placeholder="e.g. jane_smith" value={form.username} onChange={handle('username')} style={{ paddingLeft: '14px', borderColor: usernameError ? '#ef4444' : 'rgba(255, 255, 255, 0.08)' }} />
                                </div>
                                {usernameError && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '6px' }}>{usernameError}</p>}
                                <p style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '6px' }}>
                                    3–30 chars · start with letter · allowed: letters, digits, <code>.</code> <code>_</code> <code>-</code>
                                </p>
                            </div>

                            <div className="modern-form-group">
                                <label>EMAIL</label>
                                <div className="input-wrapper">
                                    <input type="email" placeholder="you@company.com" value={form.email} onChange={handle('email')} style={{ paddingLeft: '14px' }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                                <div className="modern-form-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label>PASSWORD <span style={{ color: '#ef4444' }}>*</span></label>
                                    <div className="input-wrapper">
                                        <input type="password" required placeholder="Min. 6 characters" value={form.password} onChange={handle('password')} style={{ paddingLeft: '14px' }} />
                                    </div>
                                    <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: strength.width, background: strength.background, transition: 'all 0.3s' }} />
                                    </div>
                                </div>
                                <div className="modern-form-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label>CONFIRM PASSWORD <span style={{ color: '#ef4444' }}>*</span></label>
                                    <div className="input-wrapper">
                                        <input type="password" required placeholder="Repeat password" value={form.confirmPassword} onChange={handle('confirmPassword')} style={{ paddingLeft: '14px' }} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                                <div className="modern-form-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label>PHONE (OPTIONAL)</label>
                                    <div className="input-wrapper">
                                        <input type="tel" placeholder="+1 555 000 0000" value={form.phone} onChange={handle('phone')} style={{ paddingLeft: '14px' }} />
                                    </div>
                                </div>
                                <div className="modern-form-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label>ORGANIZATION</label>
                                    <div className="input-wrapper">
                                        <input type="text" placeholder="Your company" value={form.organization} onChange={handle('organization')} style={{ paddingLeft: '14px' }} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', padding: '12px', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '20px', lineHeight: '1.5' }}>
                                <strong style={{ color: '#60a5fa', display: 'block', marginBottom: '4px' }}>🔒 Access Level: Viewer (Read-Only)</strong>
                                All new accounts start with read-only Viewer access. A platform administrator can promote your role after registration.
                            </div>

                            <div className="modern-form-helpers" style={{ marginBottom: '25px' }}>
                                <label className="custom-check" style={{ fontSize: '0.75rem' }}>
                                    <input type="checkbox" required checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                                    <span style={{ marginLeft: '4px' }}>I agree to the <a href="#" style={{ color: '#60a5fa', textDecoration: 'none' }}>Terms of Service</a> and <a href="#" style={{ color: '#60a5fa', textDecoration: 'none' }}>Security Policy</a></span>
                                </label>
                            </div>

                            <button type="submit" className="glass-btn-primary" disabled={loading}>
                                {loading ? <span className="spinner" /> : 'Create Account →'}
                            </button>
                        </form>

                        <div className="modern-link-row" style={{ marginTop: '25px', marginBottom: '0' }}>
                            Already have an account? <Link to="/login">Sign in</Link>
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
