import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import ProfileAvatar from './ProfileAvatar.jsx';

export default function ProfileDropdown() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const toggleDropdown = useCallback(() => setIsOpen(prev => !prev), []);
    const closeDropdown = useCallback(() => setIsOpen(false), []);

    const handleLogoutClick = useCallback(async () => {
        closeDropdown();
        await logout();
        navigate('/login?logout', { replace: true });
    }, [logout, navigate, closeDropdown]);

    // Click outside listener
    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                closeDropdown();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [closeDropdown]);

    // Escape key listener
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === 'Escape' && isOpen) {
                closeDropdown();
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closeDropdown]);

    // Format display role text
    const displayRole = user?.role ? user?.role.replace('ROLE_', '').replace(/_/g, ' ') : 'OPERATOR';

    // Read mock metadata or save local mock details
    const empId = user?.username === 'admin' ? 'EMP-SC-001' : 'EMP-SC-108';
    const department = user?.username === 'admin' ? 'Security Operations' : 'Threat Response Team';
    const emailVal = user?.username === 'admin' ? 'admin@sentinelcore.com' : `${user?.username || 'operator'}@sentinelcore.com`;
    const fullName = user?.username === 'admin' ? 'John Anderson' : (user?.username || 'Operator Name');

    // Hardcode or retrieve last login formatted
    const lastLoginStr = '25 Jul 2026 • 9:38 PM';

    return (
        <div className="profile-dropdown-container" ref={dropdownRef}>
            {/* Target button replacing Exit icon */}
            <button
                className={`user-profile-menu-btn ${isOpen ? 'open' : ''}`}
                onClick={toggleDropdown}
                aria-haspopup="true"
                aria-expanded={isOpen}
                aria-label="User Profile Menu"
                type="button"
            >
                <ProfileAvatar user={user} size="sm" showStatus={true} />
                <span className="user-profile-username-label">{user?.username || 'Operator'}</span>
                <span className="dropdown-arrow">▼</span>
            </button>

            {/* Slide down panel content */}
            <div className={`profile-dropdown-menu ${isOpen ? 'open' : ''}`} role="menu">
                {/* Header card info */}
                <header className="profile-dropdown-header">
                    <ProfileAvatar user={user} size="md" />
                    <div className="profile-detail-info">
                        <h4 className="profile-detail-name">{fullName}</h4>
                        <span className="profile-detail-email">{emailVal}</span>

                        <div className="profile-meta-row">
                            <span className="profile-meta-badge">{displayRole}</span>
                            <span>{empId}</span>
                        </div>

                        <div className="profile-meta-row">
                            <span>{department}</span>
                        </div>

                        <div className="profile-status-online">
                            <span className="profile-status-dot" />
                            <span>Online</span>
                        </div>

                        <div className="profile-last-login">
                            Last Login: {lastLoginStr}
                        </div>
                    </div>
                </header>

                {/* Categories panel */}
                <section className="profile-dropdown-content">
                    {/* Group 1: My Account */}
                    <div className="profile-dropdown-section-title">My Account</div>
                    <Link to="/profile?tab=general" className="profile-dropdown-item" onClick={closeDropdown} role="menuitem">
                        <span className="item-icon">👤</span> My Profile
                    </Link>
                    <Link to="/profile?tab=general" className="profile-dropdown-item" onClick={closeDropdown} role="menuitem">
                        <span className="item-icon">✏️</span> Edit Profile
                    </Link>
                    <Link to="/profile?tab=general" className="profile-dropdown-item" onClick={closeDropdown} role="menuitem">
                        <span className="item-icon">📷</span> Change Profile Picture
                    </Link>

                    <div className="profile-dropdown-divider" />

                    {/* Group 2: Security */}
                    <div className="profile-dropdown-section-title">Security</div>
                    <Link to="/profile?tab=security" className="profile-dropdown-item" onClick={closeDropdown} role="menuitem">
                        <span className="item-icon">🔐</span> Change Password
                    </Link>
                    <Link to="/profile?tab=security" className="profile-dropdown-item" onClick={closeDropdown} role="menuitem">
                        <span className="item-icon">🛡️</span> Security Settings
                    </Link>
                    <Link to="/profile?tab=security" className="profile-dropdown-item" onClick={closeDropdown} role="menuitem">
                        <span className="item-icon">📜</span> Login Activity
                    </Link>
                    <Link to="/profile?tab=security" className="profile-dropdown-item" onClick={closeDropdown} role="menuitem">
                        <span className="item-icon">💻</span> Active Sessions
                    </Link>
                    <Link to="/profile?tab=security" className="profile-dropdown-item" onClick={closeDropdown} role="menuitem">
                        <span className="item-icon">🔑</span> Multi-Factor Authentication
                    </Link>

                    <div className="profile-dropdown-divider" />

                    {/* Group 3: Preferences */}
                    <div className="profile-dropdown-section-title">Preferences</div>
                    <Link to="/profile?tab=preferences" className="profile-dropdown-item" onClick={closeDropdown} role="menuitem">
                        <span className="item-icon">🔔</span> Notification Preferences
                    </Link>
                    <Link to="/profile?tab=preferences" className="profile-dropdown-item" onClick={closeDropdown} role="menuitem">
                        <span className="item-icon">🌙</span> Dark / Light Theme
                    </Link>
                    <Link to="/profile?tab=preferences" className="profile-dropdown-item" onClick={closeDropdown} role="menuitem">
                        <span className="item-icon">🌐</span> Language
                    </Link>

                    <div className="profile-dropdown-divider" />

                    {/* Group 4: Organization */}
                    <div className="profile-dropdown-section-title">Organization</div>
                    <Link to="/profile?tab=general" className="profile-dropdown-item" onClick={closeDropdown} role="menuitem">
                        <span className="item-icon">🏢</span> Organization Details
                    </Link>
                    <Link to="/profile?tab=general" className="profile-dropdown-item" onClick={closeDropdown} role="menuitem">
                        <span className="item-icon">👥</span> My Team
                    </Link>
                    <Link to="/profile?tab=general" className="profile-dropdown-item" onClick={closeDropdown} role="menuitem">
                        <span className="item-icon">📋</span> My Permissions
                    </Link>

                    <div className="profile-dropdown-divider" />

                    {/* Group 5: Support */}
                    <div className="profile-dropdown-section-title">Support</div>
                    <Link to="/profile?tab=support" className="profile-dropdown-item" onClick={closeDropdown} role="menuitem">
                        <span className="item-icon">📖</span> Help Center
                    </Link>
                    <Link to="/profile?tab=support" className="profile-dropdown-item" onClick={closeDropdown} role="menuitem">
                        <span className="item-icon">💬</span> Contact Support
                    </Link>
                    <Link to="/profile?tab=support" className="profile-dropdown-item" onClick={closeDropdown} role="menuitem">
                        <span className="item-icon">🐞</span> Report Bug
                    </Link>
                    <Link to="/profile?tab=support" className="profile-dropdown-item" onClick={closeDropdown} role="menuitem">
                        <span className="item-icon">💡</span> Send Feedback
                    </Link>
                    <Link to="/profile?tab=support" className="profile-dropdown-item" onClick={closeDropdown} role="menuitem">
                        <span className="item-icon">ℹ️</span> About SentinelCore SecureOps
                    </Link>
                </section>

                {/* Log out footer */}
                <footer className="profile-dropdown-footer">
                    <button
                        type="button"
                        className="profile-dropdown-logout-btn"
                        onClick={handleLogoutClick}
                        role="menuitem"
                    >
                        <span>🚪</span> Logout
                    </button>
                </footer>
            </div>
        </div>
    );
}
