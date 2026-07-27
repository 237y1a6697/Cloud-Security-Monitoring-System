import { useMemo } from 'react';

export default function ProfileAvatar({ user, size = 'sm', showStatus = false }) {
    const initials = useMemo(() => {
        if (!user) return 'OP';

        // Split full name if available
        if (user.fullName) {
            const parts = user.fullName.trim().split(/\s+/);
            if (parts.length >= 2) {
                return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            }
            return parts[0].slice(0, 2).toUpperCase();
        }

        // Underneath username
        if (user.username) {
            if (user.username.toLowerCase() === 'admin') return 'AD';
            return user.username.slice(0, 2).toUpperCase();
        }

        return 'OP';
    }, [user]);

    const colorClass = useMemo(() => {
        const name = user?.username || user?.fullName || 'operator';
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const idx = Math.abs(hash) % 5;
        return `color-${idx}`;
    }, [user]);

    // Read upload avatar from user object or localStorage (fallback)
    const savedAvatar = useMemo(() => {
        return user?.avatar || localStorage.getItem('sentinelcore_profile_avatar');
    }, [user]);

    return (
        <div className={`profile-avatar size-${size} ${colorClass}`}>
            {savedAvatar ? (
                <img src={savedAvatar} alt={user?.username || 'Avatar'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <span>{initials}</span>
            )}
            {showStatus && <span className="avatar-status-ring" title="Online" />}
        </div>
    );
}
