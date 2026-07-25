/**
 * Navbar.jsx
 *
 * Replaces: <header class="topnav"> in dashboard.html (lines 589–636)
 * Purpose : Top navigation bar with live clock, global search, notification badge,
 *           user role/name display, and logout button.
 *
 * Pixel-perfect port — all CSS classes, icons, and layout preserved from dashboard.html.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import logo from '../../../assets/logo.svg';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [time, setTime] = useState('');

    // Live clock — mirrors #currentTimeDisplay in dashboard.html
    useEffect(() => {
        function tick() {
            const now = new Date();
            setTime(now.toLocaleTimeString('en-US', { hour12: false }));
        }
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    async function handleLogout() {
        await logout();
        navigate('/login?logout', { replace: true });
    }

    // Display role badge — mirrors Thymeleaf authority substring logic
    function formatRole(role) {
        if (!role) return 'VIEWER';
        return role.replace('ROLE_', '').replace(/_/g, ' ');
    }

    return (
        <header className="topnav">
            {/* Brand section — mirrors .brand-section */}
            <div className="brand-section">
                <img src={logo} alt="Logo" className="brand-logo" />
                <span className="brand-name">SentinelCore SecureOps</span>
            </div>

            {/* Global search — mirrors .global-search-container */}
            <div className="global-search-container">
                <i className="ph ph-magnifying-glass search-icon" />
                <input
                    type="text"
                    placeholder="Search Assets, Incidents, Users..."
                    className="global-search"
                    id="globalSearchInput"
                />
                <kbd className="search-shortcut">/</kbd>
            </div>

            {/* User controls — mirrors .user-controls */}
            <div className="user-controls">
                {/* Environment badge */}
                <div className="env-badge">
                    <i className="ph ph-shield-check" /> PROD
                </div>

                {/* Live clock */}
                <div className="time-display" id="currentTimeDisplay">{time}</div>

                {/* Refresh button */}
                <button
                    className="nav-icon-btn tooltip-parent"
                    id="refreshBtn"
                    title="Refresh Dashboard"
                    onClick={() => window.location.reload()}
                >
                    <i className="ph ph-arrows-clockwise" />
                </button>

                {/* Notification button — mirrors .notification-center */}
                <div className="notification-center">
                    <button className="nav-icon-btn" id="notifBtn">
                        <i className="ph ph-bell" />
                        <span className="notif-badge">3</span>
                    </button>
                </div>

                {/* User profile block — mirrors .user-profile-block */}
                <div className="user-profile-block">
                    <div className="user-info">
                        <span className="user-badge">{formatRole(user?.role)}</span>
                        <span>{user?.username || 'Operator'}</span>
                    </div>
                </div>

                {/* Logout button — mirrors .btn-logout */}
                <button className="btn-logout" type="button" id="logoutBtn" title="Sign Out" onClick={handleLogout}>
                    <i className="ph ph-sign-out" />
                </button>
            </div>
        </header>
    );
}
