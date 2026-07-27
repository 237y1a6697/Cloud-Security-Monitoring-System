export default function ProfileMenu({ activeTab, onSelectTab }) {
    const sections = [
        { id: 'general', label: '👤 Personal Info' },
        { id: 'security', label: '🔐 Security Settings' },
        { id: 'preferences', label: '⚙️ Preferences' },
        { id: 'activity', label: '📜 Recent Activity' }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', marginTop: 20 }}>
            {sections.map((sect) => (
                <button
                    key={sect.id}
                    className={`profile-tab-btn ${activeTab === sect.id ? 'active' : ''}`}
                    style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 14px',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        border: 'none',
                        background: activeTab === sect.id ? 'var(--highlight-blue-bg, rgba(58, 123, 213, 0.15))' : 'transparent',
                        color: activeTab === sect.id ? 'var(--highlight-blue, #3a7bd5)' : 'var(--text-secondary, #4a5568)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onClick={() => onSelectTab(sect.id)}
                    type="button"
                >
                    {sect.label}
                </button>
            ))}
        </div>
    );
}
