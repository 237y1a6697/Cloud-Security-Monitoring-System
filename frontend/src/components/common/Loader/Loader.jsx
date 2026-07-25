/**
 * Loader.jsx — spinner overlay
 * Usage: <Loader /> or <Loader fullPage />
 */
export default function Loader({ fullPage = false }) {
    if (fullPage) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100vh', background: 'var(--bg-base, #0f1320)'
            }}>
                <div className="spinner" style={{ width: 36, height: 36, borderWidth: 4 }} />
            </div>
        );
    }
    return (
        <div className="loading-overlay">
            <div className="spinner" />
            <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>Loading…</span>
        </div>
    );
}
