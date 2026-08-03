import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import ProfileCard from '../../components/profile/ProfileCard.jsx';
import ProfileMenu from '../../components/profile/ProfileMenu.jsx';
import { useToast } from '../../components/common/Toast/Toast.jsx';
import userService from '../../services/userService.js';

export default function ProfilePage() {
    const { user, refetch } = useAuth();
    const showToast = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'general';

    const [personalInfo, setPersonalInfo] = useState({
        fullName: '',
        email: '',
        phone: '',
        designation: '',
        department: '',
        empId: ''
    });

    const [preferences, setPreferences] = useState({
        theme: 'light',
        notifications: 'all',
        language: 'en',
        timezone: 'GMT+05:30'
    });

    const [passwordState, setPasswordState] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    // Hydrate form states when user shifts
    useEffect(() => {
        if (user) {
            setPersonalInfo({
                fullName: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Operator Name',
                email: user.email || '',
                phone: user.phone || '',
                designation: user.designation || 'Cyber Security Analyst',
                department: user.department || 'Threat Response Team',
                empId: user.employeeId || 'EMP-SC-108'
            });
            setPreferences({
                theme: user.theme || 'light',
                notifications: user.notifications || 'all',
                language: user.language || 'en',
                timezone: user.timezone || 'GMT+05:30'
            });
        }
    }, [user]);

    const handlePersonalInfoChange = (e) => {
        const { name, value } = e.target;
        setPersonalInfo(prev => ({ ...prev, [name]: value }));
    };

    const handlePreferencesChange = (e) => {
        const { name, value } = e.target;
        setPreferences(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordState(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveInfo = async (e) => {
        e.preventDefault();
        setErrors({});

        // Personal Validation
        if (!personalInfo.email.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setErrors({ email: 'Please enter a valid email address.' });
            return;
        }

        setSaving(true);
        const parts = personalInfo.fullName.trim().split(/\s+/);
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';

        try {
            await userService.updateProfile({
                firstName,
                lastName,
                email: personalInfo.email,
                phone: personalInfo.phone,
                designation: personalInfo.designation,
                department: personalInfo.department
            });
            showToast('Profile updated successfully!', 'success');
            await refetch();
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Unable to update profile. Please try again.';
            showToast(errorMsg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSavePrefs = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await userService.updateProfile({
                theme: preferences.theme,
                notifications: preferences.notifications,
                language: preferences.language,
                timezone: preferences.timezone
            });
            showToast('System preferences saved!', 'success');
            await refetch();
        } catch (err) {
            showToast('Failed to save preferences.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setErrors({});
        let hasError = false;
        const newErrors = {};

        if (!passwordState.currentPassword) {
            newErrors.currentPassword = 'Current password is required.';
            hasError = true;
        }
        if (!passwordState.newPassword) {
            newErrors.newPassword = 'New password is required.';
            hasError = true;
        } else if (passwordState.newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters.';
            hasError = true;
        }
        if (passwordState.newPassword !== passwordState.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match.';
            hasError = true;
        }

        if (hasError) {
            setErrors(newErrors);
            return;
        }

        setSaving(true);
        try {
            await userService.updateProfile({
                currentPassword: passwordState.currentPassword,
                newPassword: passwordState.newPassword
            });
            showToast('Password updated successfully!', 'success');
            setPasswordState({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Password update failed. Please check your credentials.';
            showToast(errorMsg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSelectTab = (tabId) => {
        setSearchParams({ tab: tabId });
    };

    const handleCancel = () => {
        if (user) {
            setPersonalInfo({
                fullName: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Operator Name',
                email: user.email || '',
                phone: user.phone || '',
                designation: user.designation || 'Cyber Security Analyst',
                department: user.department || 'Threat Response Team',
                empId: user.employeeId || 'EMP-SC-108'
            });
            setPreferences({
                theme: user.theme || 'light',
                notifications: user.notifications || 'all',
                language: user.language || 'en',
                timezone: user.timezone || 'GMT+05:30'
            });
        }
        showToast('Form fields reset to saved profile data.', 'info');
    };

    const displayRole = user?.role ? user?.role.replace('ROLE_', '').replace(/_/g, ' ') : 'OPERATOR';

    return (
        <DashboardLayout>
            <section className="content-header" style={{ marginBottom: 20 }}>
                <h1>User Profile <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>Security Center Settings</span></h1>
            </section>

            <div className="profile-page-container">
                {/* Left Side info */}
                <div>
                    <ProfileCard
                        user={user}
                        fullName={personalInfo.fullName}
                        emailVal={personalInfo.email}
                        empId={personalInfo.empId}
                        department={personalInfo.department}
                        displayRole={displayRole}
                    />
                    <ProfileMenu activeTab={activeTab} onSelectTab={handleSelectTab} />
                </div>

                {/* Right Side */}
                <div className="profile-content-card">

                    {/* TAB 1: GENERAL PERSONAL INFORMATION */}
                    {activeTab === 'general' && (
                        <form onSubmit={handleSaveInfo} className="profile-form-section">
                            <h3 className="profile-section-heading">Personal Information</h3>
                            <div className="profile-fields-grid">
                                <div className="profile-field-group">
                                    <label htmlFor="fullName">Full Name</label>
                                    <input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        value={personalInfo.fullName}
                                        onChange={handlePersonalInfoChange}
                                        required
                                        disabled={saving}
                                    />
                                </div>
                                <div className="profile-field-group">
                                    <label htmlFor="username">Username</label>
                                    <input
                                        type="text"
                                        id="username"
                                        value={user?.username || 'operator'}
                                        disabled
                                    />
                                </div>
                                <div className="profile-field-group">
                                    <label htmlFor="email">Email Address</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={personalInfo.email}
                                        onChange={handlePersonalInfoChange}
                                        required
                                        disabled={saving}
                                        style={errors.email ? { borderColor: 'var(--danger-red)' } : {}}
                                    />
                                    {errors.email && (
                                        <span style={{ color: 'var(--danger-red)', fontSize: '0.75rem', marginTop: 4 }}>
                                            {errors.email}
                                        </span>
                                    )}
                                </div>
                                <div className="profile-field-group">
                                    <label htmlFor="phone">Phone Number</label>
                                    <input
                                        type="text"
                                        id="phone"
                                        name="phone"
                                        value={personalInfo.phone}
                                        onChange={handlePersonalInfoChange}
                                        disabled={saving}
                                    />
                                </div>
                                <div className="profile-field-group">
                                    <label htmlFor="empId">Employee ID</label>
                                    <input
                                        type="text"
                                        id="empId"
                                        value={personalInfo.empId}
                                        disabled
                                    />
                                </div>
                                <div className="profile-field-group">
                                    <label htmlFor="role">Security Role</label>
                                    <input
                                        type="text"
                                        id="role"
                                        value={displayRole}
                                        disabled
                                    />
                                </div>
                                <div className="profile-field-group">
                                    <label htmlFor="designation">Designation</label>
                                    <input
                                        type="text"
                                        id="designation"
                                        name="designation"
                                        value={personalInfo.designation}
                                        onChange={handlePersonalInfoChange}
                                        disabled={saving}
                                    />
                                </div>
                                <div className="profile-field-group">
                                    <label htmlFor="department">Department</label>
                                    <input
                                        type="text"
                                        id="department"
                                        name="department"
                                        value={personalInfo.department}
                                        onChange={handlePersonalInfoChange}
                                        disabled={saving}
                                    />
                                </div>
                            </div>

                            <div className="profile-forms-actions">
                                <button type="button" className="profile-btn-cancel" disabled={saving} onClick={handleCancel}>Cancel</button>
                                <button type="submit" className="profile-btn-submit" disabled={saving}>
                                    {saving ? (
                                        <>
                                            <div className="btn-spinner" style={{ marginRight: 6 }} />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* TAB 2: SECURITY SETTINGS */}
                    {activeTab === 'security' && (
                        <div className="profile-form-section">
                            <form onSubmit={handleUpdatePassword} className="profile-form-section">
                                <h3 className="profile-section-heading">Change Password</h3>
                                <div className="profile-fields-grid">
                                    <div className="profile-field-group">
                                        <label htmlFor="currentPassword">Current Password</label>
                                        <input
                                            type="password"
                                            id="currentPassword"
                                            name="currentPassword"
                                            value={passwordState.currentPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            disabled={saving}
                                            style={errors.currentPassword ? { borderColor: 'var(--danger-red)' } : {}}
                                        />
                                        {errors.currentPassword && (
                                            <span style={{ color: 'var(--danger-red)', fontSize: '0.75rem', marginTop: 4 }}>
                                                {errors.currentPassword}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'none' }} />
                                    <div className="profile-field-group">
                                        <label htmlFor="newPassword">New Password</label>
                                        <input
                                            type="password"
                                            id="newPassword"
                                            name="newPassword"
                                            value={passwordState.newPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            disabled={saving}
                                            style={errors.newPassword ? { borderColor: 'var(--danger-red)' } : {}}
                                        />
                                        {errors.newPassword && (
                                            <span style={{ color: 'var(--danger-red)', fontSize: '0.75rem', marginTop: 4 }}>
                                                {errors.newPassword}
                                            </span>
                                        )}
                                    </div>
                                    <div className="profile-field-group">
                                        <label htmlFor="confirmPassword">Confirm Password</label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={passwordState.confirmPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            disabled={saving}
                                            style={errors.confirmPassword ? { borderColor: 'var(--danger-red)' } : {}}
                                        />
                                        {errors.confirmPassword && (
                                            <span style={{ color: 'var(--danger-red)', fontSize: '0.75rem', marginTop: 4 }}>
                                                {errors.confirmPassword}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="profile-forms-actions" style={{ border: 'none', paddingTop: 0 }}>
                                    <button type="submit" className="profile-btn-submit" disabled={saving}>
                                        {saving ? (
                                            <>
                                                <div className="btn-spinner" style={{ marginRight: 6 }} />
                                                Updating...
                                            </>
                                        ) : (
                                            'Update Password'
                                        )}
                                    </button>
                                </div>
                            </form>

                            <div className="profile-dropdown-divider" />

                            <div>
                                <h3 className="profile-section-heading">Authentication &amp; MFA</h3>
                                <div className="profile-logs-list" style={{ marginTop: 10 }}>
                                    <div className="profile-log-item">
                                        <div>
                                            <div className="profile-log-title">Multi-Factor Authentication (MFA)</div>
                                            <div className="profile-log-meta">Adds an extra layer of protection to your security operator profile.</div>
                                        </div>
                                        <span className="profile-log-status" style={{ color: 'var(--highlight-blue)' }}>Enabled (App Authenticator)</span>
                                    </div>
                                    <div className="profile-log-item">
                                        <div>
                                            <div className="profile-log-title">Last Password Change Date</div>
                                            <div className="profile-log-meta">Forced operational password age compliance check.</div>
                                        </div>
                                        <span className="profile-log-status" style={{ color: 'var(--text-secondary)' }}>Changed 12 days ago</span>
                                    </div>
                                </div>
                            </div>

                            <div className="profile-dropdown-divider" />

                            <div>
                                <h3 className="profile-section-heading">Active Operator Sessions</h3>
                                <div className="profile-logs-list" style={{ marginTop: 10 }}>
                                    <div className="profile-log-item">
                                        <div>
                                            <div className="profile-log-title">Edge Browser • Windows Current Session</div>
                                            <div className="profile-log-meta">Active session IP: Private session</div>
                                        </div>
                                        <span className="profile-log-status">Active now</span>
                                    </div>
                                    <div className="profile-log-item">
                                        <div>
                                            <div className="profile-log-title">Chrome Browser • Windows Server Console</div>
                                            <div className="profile-log-meta">Session last pinged: {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : '25 Jul 2026 18:22'}</div>
                                        </div>
                                        <span className="profile-log-status" style={{ color: 'var(--text-muted)' }}>Inactive</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: SYSTEM PREFERENCES */}
                    {activeTab === 'preferences' && (
                        <form onSubmit={handleSavePrefs} className="profile-form-section">
                            <h3 className="profile-section-heading">Preferences</h3>
                            <div className="profile-fields-grid">
                                <div className="profile-field-group">
                                    <label htmlFor="theme">Application Theme</label>
                                    <select
                                        id="theme"
                                        name="theme"
                                        value={preferences.theme}
                                        onChange={handlePreferencesChange}
                                        disabled={saving}
                                    >
                                        <option value="light">Light Theme (Classic)</option>
                                        <option value="dark">Dark Theme (SOC Operations Overlay)</option>
                                    </select>
                                </div>
                                <div className="profile-field-group">
                                    <label htmlFor="notifications">Notifications</label>
                                    <select
                                        id="notifications"
                                        name="notifications"
                                        value={preferences.notifications}
                                        onChange={handlePreferencesChange}
                                        disabled={saving}
                                    >
                                        <option value="all">Deliver All Feeds (Critical &amp; Info)</option>
                                        <option value="critical">Critical Feed Notifications Only</option>
                                        <option value="none">Mute Notifications</option>
                                    </select>
                                </div>
                                <div className="profile-field-group">
                                    <label htmlFor="language">Interface Language</label>
                                    <select
                                        id="language"
                                        name="language"
                                        value={preferences.language}
                                        onChange={handlePreferencesChange}
                                        disabled={saving}
                                    >
                                        <option value="en">English (US)</option>
                                        <option value="es">Español (ES)</option>
                                        <option value="de">Deutsch (DE)</option>
                                    </select>
                                </div>
                                <div className="profile-field-group">
                                    <label htmlFor="timezone">Operational Timezone</label>
                                    <select
                                        id="timezone"
                                        name="timezone"
                                        value={preferences.timezone}
                                        onChange={handlePreferencesChange}
                                        disabled={saving}
                                    >
                                        <option value="GMT+05:30">GMT+05:30 (India Standard Time)</option>
                                        <option value="UTC">UTC / GMT</option>
                                        <option value="EST">EST (Eastern Standard Time)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="profile-forms-actions">
                                <button type="button" className="profile-btn-cancel" disabled={saving} onClick={handleCancel}>Cancel</button>
                                <button type="submit" className="profile-btn-submit" disabled={saving}>
                                    {saving ? (
                                        <>
                                            <div className="btn-spinner" style={{ marginRight: 6 }} />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Settings'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* TAB 4: RECENT ACTIVITY LOGS */}
                    {activeTab === 'activity' && (
                        <div className="profile-form-section">
                            <h3 className="profile-section-heading">Operational Access Activity</h3>
                            <div className="profile-logs-list">
                                <div className="profile-log-item">
                                    <div>
                                        <div className="profile-log-title">User Authentication Successful</div>
                                        <div className="profile-log-meta">Login source: Console authentication page. IP: Private session</div>
                                    </div>
                                    <span className="profile-log-meta">25 Jul 2026 21:54</span>
                                </div>
                                <div className="profile-log-item">
                                    <div>
                                        <div className="profile-log-title">Security Key Checked (MFA Verify)</div>
                                        <div className="profile-log-meta">Verification challenge completed successfully.</div>
                                    </div>
                                    <span className="profile-log-meta">25 Jul 2026 21:54</span>
                                </div>
                                <div className="profile-log-item">
                                    <div>
                                        <div className="profile-log-title">Audit log entries view query</div>
                                        <div className="profile-log-meta">Request to /api/audit-logs by Admin user.</div>
                                    </div>
                                    <span className="profile-log-meta">25 Jul 2026 21:32</span>
                                </div>
                                <div className="profile-log-item">
                                    <div>
                                        <div className="profile-log-title">User Profile modified</div>
                                        <div className="profile-log-meta">Updated personal contact properties.</div>
                                    </div>
                                    <span className="profile-log-meta">25 Jul 2026 19:15</span>
                                </div>
                            </div>

                            <div style={{ marginTop: 10, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Account Status: <strong style={{ color: 'var(--success-green)' }}>● Active Operational State</strong>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </DashboardLayout>
    );
}
