import { useEffect, useRef, useCallback } from 'react';
import useAIChat from '../../hooks/useAIChat.js';
import ChatMessage from './ChatMessage.jsx';
import ChatInput from './ChatInput.jsx';
import SuggestedQuestions from './SuggestedQuestions.jsx';
import ThinkingIndicator from './ThinkingIndicator.jsx';
import { useToast } from '../../components/common/Toast/Toast.jsx';

export default function AIChatWindow() {
    const { isOpen, messages, loading, closePanel, clearChat, sendMessage, currentPage } = useAIChat();
    const bodyRef = useRef(null);
    const showToast = useToast();

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (bodyRef.current) {
            bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        }
    }, [messages, loading]);

    // Handle keyboard events (ESC key closes chat)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                closePanel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closePanel]);

    const handleSelectQuestion = useCallback((q) => {
        sendMessage(q);
    }, [sendMessage]);

    const handleQuickAction = (action) => {
        if (action === 'Lock Session') {
            showToast('Console session security lock engaged!', 'warning');
        } else if (action === 'Run Diagnostics') {
            showToast('Starting system cluster self-test probe...');
            setTimeout(() => {
                showToast('Cluster node response health is green (100% SLA).', 'success');
            }, 1200);
        } else if (action === 'Restart Telemetry') {
            showToast('Telemetries pipeline rebooted successfully.', 'info');
        }
    };

    return (
        <div className={`ai-chat-panel ${isOpen ? 'open' : ''}`}>
            {/* Header */}
            <header className="ai-chat-header">
                <div className="ai-header-info">
                    <div className="ai-bot-avatar">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2c1.103 0 2 .897 2 2v1h3c1.654 0 3 1.346 3 3v2c.827 0 1.5.673 1.5 1.5v3c0 .827-.673 1.5-1.5 1.5v3c0 1.654-1.346 3-3 3h-3v1c0 1.103-.897 2-2 2s-2-.897-2-2v-1H7c-1.654 0-3-1.346-3-3v-3c-.827 0-1.5-.673-1.5-1.5v-3c0-.827.673-1.5 1.5-1.5V8c0-1.654 1.346-3 3-3h3V4c0-1.103.897-2 2-2zM6 8v10c0 .552.448 1 1 1h10c.552 0 1-.448 1-1V8H6z" />
                        </svg>
                    </div>
                    <div className="ai-title-group">
                        <h3>SentinelCore AI Assistant</h3>
                        <p style={{ margin: 0, fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                            Active Module: <strong style={{ color: 'var(--highlight-blue)' }}>{currentPage || 'Dashboard'}</strong>
                        </p>
                    </div>
                </div>
                <div className="ai-header-actions">
                    {messages.length > 0 && (
                        <button
                            className="ai-btn-icon"
                            onClick={clearChat}
                            title="Clear entire conversation"
                            aria-label="Clear chat panel"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z" />
                            </svg>
                        </button>
                    )}
                    <button
                        className="ai-btn-icon close-btn"
                        onClick={closePanel}
                        title="Minimize Assistant"
                        aria-label="Close Assistant panel"
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Messages viewport */}
            <section className="ai-chat-body" ref={bodyRef}>
                {messages.length === 0 && (
                    <SuggestedQuestions currentPage={currentPage} onSelectQuestion={handleSelectQuestion} />
                )}

                {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} onSelectQuestion={handleSelectQuestion} />
                ))}

                {loading && (
                    <ThinkingIndicator />
                )}
            </section>

            {/* Quick Actions Panel */}
            <div style={{ display: 'flex', gap: 6, padding: '8px 12px', background: 'var(--bg-inset)', borderTop: '1px solid var(--border-color)', overflowX: 'auto' }}>
                <button className="btn-sm" onClick={() => handleQuickAction('Lock Session')} style={{ padding: '4px 8px', fontSize: '0.72rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <i className="ph ph-lock" /> Lock Console
                </button>
                <button className="btn-sm" onClick={() => handleQuickAction('Run Diagnostics')} style={{ padding: '4px 8px', fontSize: '0.72rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <i className="ph ph-heartbeat" /> Diagnostics
                </button>
                <button className="btn-sm" onClick={() => handleQuickAction('Restart Telemetry')} style={{ padding: '4px 8px', fontSize: '0.72rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <i className="ph ph-arrows-clockwise" /> Reset Simulator
                </button>
            </div>

            {/* Footer input controls */}
            <footer className="ai-chat-footer">
                <ChatInput onSendMessage={sendMessage} disabled={loading} />
            </footer>
        </div>
    );
}
