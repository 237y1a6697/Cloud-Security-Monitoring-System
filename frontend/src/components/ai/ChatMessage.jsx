import { useState, useCallback } from 'react';
import MarkdownRenderer from './MarkdownRenderer.jsx';

export default function ChatMessage({ message, onSelectQuestion }) {
    const { role, content, timestamp, suggestions } = message;
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [content]);

    return (
        <div className={`ai-msg-row ${role === 'user' ? 'user' : 'assistant'}`}>
            <div className="ai-msg-container" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div className="ai-msg-bubble">
                    <MarkdownRenderer content={content} />
                    <div className="ai-msg-meta">
                        <span>{timestamp}</span>
                        <button
                            className="copy-btn"
                            onClick={handleCopy}
                            title="Copy message text"
                            aria-label="Copy message"
                        >
                            {copied ? 'Copied!' : (
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {role === 'assistant' && suggestions && suggestions.length > 0 && (
                    <div className="ai-suggestions-container" style={{ borderBottom: 'none', paddingBottom: 0, marginTop: 6, width: '100%', maxWidth: '85%' }}>
                        <div className="ai-suggestions-scroll" style={{ flexWrap: 'wrap', gap: 6 }}>
                            {suggestions.map((q, idx) => (
                                <button
                                    key={idx}
                                    className="ai-suggest-chip"
                                    onClick={() => onSelectQuestion && onSelectQuestion(q)}
                                    type="button"
                                    style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: '12px' }}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
