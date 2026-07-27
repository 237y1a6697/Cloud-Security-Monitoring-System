import { useState, useCallback, createContext, useContext, useEffect, useRef } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(0);

    const showToast = useCallback((message, type = 'success') => {
        const id = ++idRef.current;
        setToasts((prev) => [...prev, { id, message, type, isPaused: false, progress: 100 }]);
    }, []);

    const hideToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    // Timer loop for tracking progress and auto-dismissal
    useEffect(() => {
        if (toasts.length === 0) return;

        const interval = setInterval(() => {
            setToasts((prev) => {
                const next = prev.map((t) => {
                    if (t.isPaused) return t;
                    // Decrease progress: 2.5% every 75ms -> total delay 3 seconds
                    return { ...t, progress: t.progress - 2.5 };
                });

                return next.filter((t) => t.progress > 0);
            });
        }, 75);

        return () => clearInterval(interval);
    }, [toasts]);

    const setHoverState = (id, isPaused) => {
        setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, isPaused } : t))
        );
    };

    return (
        <ToastContext.Provider value={showToast}>
            {children}
            <div
                id="toast-container"
                style={{
                    position: 'fixed',
                    top: 24,
                    right: 24,
                    zIndex: 99999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    pointerEvents: 'none'
                }}
            >
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`toast-item ${t.type}`}
                        style={{
                            pointerEvents: 'auto',
                            position: 'relative',
                            minWidth: 280,
                            maxWidth: 400,
                            background: 'var(--bg-card, #ffffff)',
                            color: 'var(--text-primary, #1a1f2e)',
                            borderRadius: '8px',
                            padding: '12px 36px 12px 14px',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                            border: '1px solid var(--border-color, #e2e6ee)',
                            borderLeft: `4px solid ${t.type === 'success' ? '#27ae60' :
                                    t.type === 'error' ? '#c62828' :
                                        t.type === 'warning' ? '#f39c12' : '#3a7bd5'
                                }`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: '0.84rem',
                            fontWeight: 500,
                            animation: 'toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={() => setHoverState(t.id, true)}
                        onMouseLeave={() => setHoverState(t.id, false)}
                    >
                        <span>
                            {t.type === 'success' && '✔'}
                            {t.type === 'error' && '❌'}
                            {t.type === 'warning' && '⚠'}
                            {t.type === 'info' && 'ℹ'}
                        </span>
                        <div style={{ flex: 1 }}>{t.message}</div>
                        <button
                            onClick={() => hideToast(t.id)}
                            style={{
                                position: 'absolute',
                                top: '50%',
                                right: 10,
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                border: 'none',
                                fontSize: '1.1rem',
                                color: 'var(--text-muted, #8a94a6)',
                                cursor: 'pointer',
                                padding: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            type="button"
                        >
                            &times;
                        </button>
                        <div
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                height: 3,
                                width: `${t.progress}%`,
                                backgroundColor:
                                    t.type === 'success' ? '#27ae60' :
                                        t.type === 'error' ? '#c62828' :
                                            t.type === 'warning' ? '#f39c12' : '#3a7bd5',
                                transition: 'width 75ms linear'
                            }}
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be inside ToastProvider');
    return ctx;
}
