/**
 * Navbar.jsx
 *
 * Replaces: <header class="topnav"> in dashboard.html (lines 589–636)
 * Purpose : Top navigation bar with live clock, global search, notification badge,
 *           user role/name display, and logout button.
 *
 * Pixel-perfect port — all CSS classes, icons, and layout preserved from dashboard.html.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import logo from '../../../assets/logo.svg';
import ProfileDropdown from '../../profile/ProfileDropdown.jsx';
import { useToast } from '../../common/Toast/Toast.jsx';
import dashboardService from '../../../services/dashboardService.js';
import assetService from '../../../services/assetService.js';
import incidentService from '../../../services/incidentService.js';
import userService from '../../../services/userService.js';
import vulnerabilityService from '../../../services/vulnerabilityService.js';
import auditService from '../../../services/auditService.js';
import notificationService from '../../../services/notificationService.js';

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_LIMIT = 6;

function normalize(text) {
    return (text || '').toString().toLowerCase();
}

function buildSearchResults(query, assets, incidents, users, vulnerabilities, auditLogs) {
    const term = normalize(query).trim();
    if (!term) return [];

    const matches = [];

    const pushMatch = (type, label, meta, to, score) => {
        matches.push({ type, label, meta, to, score });
    };

    assets.forEach((asset) => {
        const haystack = [asset.assetName, asset.assetType, asset.ipAddress, asset.location, asset.status].map(normalize).join(' ');
        if (haystack.includes(term)) {
            pushMatch('Asset', asset.assetName || `Asset #${asset.id}`, `${asset.assetType || 'Asset'} • ${asset.status || 'Unknown'}`, '/assets', haystack.startsWith(term) ? 100 : 80);
        }
    });

    incidents.forEach((incident) => {
        const haystack = [incident.title, incident.description, incident.status, incident.severity, incident.assignedTeam, incident.assignedTo, incident.incidentId].map(normalize).join(' ');
        if (haystack.includes(term)) {
            pushMatch('Incident', incident.title || `Incident #${incident.id}`, `${incident.severity || 'Unknown'} • ${incident.status || 'Unknown'}`, '/incidents', haystack.startsWith(term) ? 100 : 78);
        }
    });

    users.forEach((user) => {
        const roleName = user.roles?.[0]?.name || user.role || 'ROLE_VIEWER';
        const haystack = [user.username, user.email, user.displayName, user.firstName, user.lastName, roleName].map(normalize).join(' ');
        if (haystack.includes(term)) {
            pushMatch('User', user.displayName || user.username || `User #${user.id}`, `${roleName} • ${user.email || 'No email'}`, '/users', haystack.startsWith(term) ? 98 : 76);
        }
    });

    vulnerabilities.forEach((vuln) => {
        const haystack = [vuln.cve, vuln.remediation, vuln.patchStatus, vuln.affectedAssets, vuln.riskScore, vuln.cvss].map(normalize).join(' ');
        if (haystack.includes(term)) {
            pushMatch('Vulnerability', vuln.cve || `Vulnerability #${vuln.id}`, `${vuln.patchStatus || 'Unknown'} • CVSS ${vuln.cvss ?? '—'}`, '/vulnerabilities', haystack.startsWith(term) ? 100 : 74);
        }
    });

    auditLogs.forEach((log) => {
        const haystack = [log.username, log.action, log.result, log.ipAddress, log.role, log.deviceBrowser].map(normalize).join(' ');
        if (haystack.includes(term)) {
            pushMatch('Audit Log', `${log.username || 'User'} • ${log.action || 'Action'}`, `${log.result || '—'} • ${log.ipAddress || 'Unknown IP'}`, '/audit-logs', haystack.startsWith(term) ? 96 : 72);
        }
    });

    return matches
        .sort((a, b) => b.score - a.score)
        .slice(0, SEARCH_LIMIT);
}

function mapNotificationRoute(notification) {
    const relatedType = normalize(notification?.relatedType);
    if (relatedType.includes('incident')) return '/incidents';
    if (relatedType.includes('vulnerab')) return '/vulnerabilities';
    if (relatedType.includes('asset')) return '/assets';
    if (relatedType.includes('audit')) return '/audit-logs';
    if (relatedType.includes('user')) return '/users';
    return '/dashboard';
}

export default function Navbar() {
    const { user, logout, refetch } = useAuth();
    const navigate = useNavigate();
    const showToast = useToast();
    const [time, setTime] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchIndex, setSearchIndex] = useState(-1);
    const [notifications, setNotifications] = useState([]);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [notificationLoading, setNotificationLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const searchRef = useRef(null);
    const notificationRef = useRef(null);
    const requestRef = useRef(0);

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

    const unreadCount = useMemo(
        () => notifications.filter((notification) => !notification.read).length,
        [notifications]
    );

    const loadNotifications = useCallback(async () => {
        setNotificationLoading(true);
        try {
            const [listRes, countRes] = await Promise.all([
                notificationService.getAll(),
                notificationService.getUnreadCount(),
            ]);
            setNotifications(listRes.data || []);
            if (typeof countRes.data?.count === 'number') {
                setNotifications((current) => current.map((item) => item));
            }
        } catch {
            setNotifications([]);
        } finally {
            setNotificationLoading(false);
        }
    }, []);

    const loadSearchResults = useCallback(async (query) => {
        const trimmed = query.trim();
        if (!trimmed) {
            setSearchResults([]);
            setSearchLoading(false);
            return;
        }

        const currentRequest = ++requestRef.current;
        setSearchLoading(true);

        const settled = await Promise.allSettled([
            assetService.getAll(),
            incidentService.getAll(),
            userService.getAll(),
            vulnerabilityService.getAll(),
            auditService.getAllList(),
        ]);

        if (currentRequest !== requestRef.current) {
            return;
        }

        const assets = settled[0].status === 'fulfilled' ? settled[0].value.data || [] : [];
        const incidents = settled[1].status === 'fulfilled' ? settled[1].value.data || [] : [];
        const users = settled[2].status === 'fulfilled' ? settled[2].value.data || [] : [];
        const vulnerabilities = settled[3].status === 'fulfilled' ? settled[3].value.data || [] : [];
        const auditLogs = settled[4].status === 'fulfilled' ? settled[4].value.data || [] : [];

        setSearchResults(buildSearchResults(trimmed, assets, incidents, users, vulnerabilities, auditLogs));
        setSearchLoading(false);
    }, []);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            loadSearchResults(searchQuery);
        }, SEARCH_DEBOUNCE_MS);

        return () => window.clearTimeout(timer);
    }, [loadSearchResults, searchQuery]);

    useEffect(() => {
        function handlePointerDown(event) {
            const searchNode = searchRef.current;
            const notificationNode = notificationRef.current;
            if (searchNode && !searchNode.contains(event.target)) {
                setSearchOpen(false);
            }
            if (notificationNode && !notificationNode.contains(event.target)) {
                setNotificationOpen(false);
            }
        }

        window.addEventListener('mousedown', handlePointerDown);
        return () => window.removeEventListener('mousedown', handlePointerDown);
    }, []);

    useEffect(() => {
        function handleRefreshEvent() {
            loadNotifications();
        }

        window.addEventListener('sentinelcore:refresh-dashboard', handleRefreshEvent);
        return () => window.removeEventListener('sentinelcore:refresh-dashboard', handleRefreshEvent);
    }, [loadNotifications]);

    async function handleRefresh() {
        setRefreshing(true);
        try {
            await Promise.all([
                refetch(),
                loadNotifications(),
            ]);
            window.dispatchEvent(new CustomEvent('sentinelcore:refresh-dashboard'));
            showToast('Dashboard session and notifications refreshed.', 'success');
        } catch {
            showToast('Unable to refresh dashboard data.', 'error');
        } finally {
            setRefreshing(false);
        }
    }

    async function handleSelectSearchResult(result) {
        setSearchOpen(false);
        setSearchQuery('');
        setSearchIndex(-1);
        navigate(result.to);
    }

    async function handleNotificationClick(notification) {
        try {
            if (!notification.read) {
                await notificationService.markAsRead(notification.id);
            }
            await loadNotifications();
            setNotificationOpen(false);
            navigate(mapNotificationRoute(notification));
        } catch {
            showToast('Unable to open notification details.', 'error');
        }
    }

    async function handleMarkAllNotificationsRead() {
        try {
            await notificationService.markAllAsRead();
            await loadNotifications();
            showToast('All notifications marked as read.', 'success');
        } catch {
            showToast('Unable to update notifications.', 'error');
        }
    }

    function handleSearchKeyDown(event) {
        if (!searchResults.length) {
            if (event.key === 'Escape') {
                setSearchOpen(false);
            }
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSearchIndex((current) => (current + 1) % searchResults.length);
            setSearchOpen(true);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSearchIndex((current) => (current <= 0 ? searchResults.length - 1 : current - 1));
            setSearchOpen(true);
        } else if (event.key === 'Enter' && searchIndex >= 0) {
            event.preventDefault();
            handleSelectSearchResult(searchResults[searchIndex]);
        } else if (event.key === 'Escape') {
            setSearchOpen(false);
        }
    }

    function handleSearchFocus() {
        setSearchOpen(Boolean(searchQuery.trim() && searchResults.length));
    }

    async function handleLogout() {
        await logout();
        navigate('/login?logout', { replace: true });
    }

    return (
        <header className="topnav">
            {/* Brand section — mirrors .brand-section */}
            <div className="brand-section">
                <img src={logo} alt="Logo" className="brand-logo" />
                <span className="brand-name">CSMS-IMA</span>
            </div>

            {/* Global search — mirrors .global-search-container */}
            <div className="global-search-container" ref={searchRef}>
                <i className="ph ph-magnifying-glass search-icon" />
                <input
                    type="text"
                    placeholder="Search Assets, Incidents, Users..."
                    className="global-search"
                    id="globalSearchInput"
                    value={searchQuery}
                    onChange={(event) => {
                        setSearchQuery(event.target.value);
                        setSearchOpen(true);
                        setSearchIndex(-1);
                    }}
                    onFocus={handleSearchFocus}
                    onKeyDown={handleSearchKeyDown}
                />
                <kbd className="search-shortcut">/</kbd>
                {(searchOpen || searchLoading) && searchQuery.trim() && (
                    <div className="global-search-results" role="listbox">
                        {searchLoading ? (
                            <div className="global-search-empty">Searching across SOC datasets...</div>
                        ) : searchResults.length ? (
                            searchResults.map((result, index) => (
                                <button
                                    type="button"
                                    key={`${result.type}-${result.label}-${index}`}
                                    className={`global-search-result${index === searchIndex ? ' active' : ''}`}
                                    onMouseEnter={() => setSearchIndex(index)}
                                    onClick={() => handleSelectSearchResult(result)}
                                >
                                    <span className="global-search-result-type">{result.type}</span>
                                    <span className="global-search-result-label">{result.label}</span>
                                    <span className="global-search-result-meta">{result.meta}</span>
                                </button>
                            ))
                        ) : (
                            <div className="global-search-empty">No results found.</div>
                        )}
                    </div>
                )}
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
                    onClick={handleRefresh}
                    aria-label="Refresh dashboard"
                >
                    <i className={`ph ${refreshing ? 'ph-spinner-gap' : 'ph-arrows-clockwise'}`} />
                </button>

                {/* Notification button — mirrors .notification-center */}
                <div className="notification-center" ref={notificationRef}>
                    <button
                        className="nav-icon-btn"
                        id="notifBtn"
                        onClick={() => setNotificationOpen((current) => !current)}
                        aria-label="Open notifications"
                    >
                        <i className="ph ph-bell" />
                        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                    </button>

                    {notificationOpen && (
                        <div className="notification-dropdown" role="menu">
                            <div className="notification-dropdown-header">
                                <div>
                                    <strong>Notifications</strong>
                                    <div className="notification-dropdown-subtitle">
                                        {notificationLoading ? 'Loading...' : `${unreadCount} unread`}
                                    </div>
                                </div>
                                <button type="button" className="notification-mark-all" onClick={handleMarkAllNotificationsRead}>
                                    Mark all read
                                </button>
                            </div>
                            <div className="notification-dropdown-list">
                                {notifications.length ? notifications.map((notification) => (
                                    <button
                                        type="button"
                                        key={notification.id}
                                        className={`notification-dropdown-item${notification.read ? '' : ' unread'}`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <span className="notification-item-title">{notification.title}</span>
                                        <span className="notification-item-message">{notification.message}</span>
                                        <span className="notification-item-meta">
                                            {notification.category || 'GENERAL'} • {new Date(notification.createdAt).toLocaleString()}
                                        </span>
                                    </button>
                                )) : (
                                    <div className="notification-empty">No notifications available.</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile menu dropdown replacing exit icon and old profile details */}
                <ProfileDropdown />
            </div>
        </header>
    );
}
