import ProfileAvatar from './ProfileAvatar.jsx';
import userService from '../../services/userService.js';

export default function ProfileCard({ user, fullName, emailVal, empId, department, displayRole }) {
    return (
        <div className="profile-side-card">
            <ProfileAvatar user={user} size="lg" showStatus={true} />
            <h3 className="profile-side-name">{fullName}</h3>
            <span className="profile-side-role">{displayRole}</span>
            <div className="profile-side-username">@{user?.username || 'operator'}</div>
            <div className="profile-side-email">{emailVal}</div>
            <div style={{ marginTop: 15, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Department: <strong>{department}</strong>
            </div>
            <div className="profile-upload-actions">
                <label className="btn-upload-avatar" style={{ display: 'inline-block', textAlign: 'center', cursor: 'pointer' }}>
                    Upload Photo
                    <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = async () => {
                                    localStorage.setItem('sentinelcore_profile_avatar', reader.result);
                                    try {
                                        await userService.updateProfile({
                                            avatar: reader.result
                                        });
                                    } catch (err) {
                                        console.error('Failed to sync avatar with backend', err);
                                    }
                                    window.location.reload();
                                };
                                reader.readAsDataURL(file);
                            }
                        }}
                    />
                </label>
                <button
                    className="btn-upload-avatar"
                    type="button"
                    onClick={async () => {
                        localStorage.removeItem('sentinelcore_profile_avatar');
                        try {
                            await userService.updateProfile({
                                avatar: ""
                            });
                        } catch (err) {
                            console.error('Failed to clear avatar on backend', err);
                        }
                        window.location.reload();
                    }}
                >
                    Remove
                </button>
            </div>
        </div>
    );
}
