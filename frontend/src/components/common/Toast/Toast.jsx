import { useState, useCallback, createContext, useContext, useEffect, useRef } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(0);

    const showToast = useCallback((message, type = 'success') => {
        const id = ++idRef.current;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3500);
    }, []);

    return (
        <ToastContext.Provider value={showToast}>
            {children}
            <div id="toast-container" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 500, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        id="toast"
                        className={`show ${t.type}`}
                        style={{ position: 'relative', minWidth: 260 }}
                    >
                        {t.message}
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
