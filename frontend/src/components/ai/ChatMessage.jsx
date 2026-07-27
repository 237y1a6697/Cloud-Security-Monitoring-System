import { useState, useCallback } from 'react';
import MarkdownRenderer from './MarkdownRenderer.jsx';

export default function ChatMessage({ message }) {
    const { role, content, timestamp } = message;
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [content]);

    return (
        <div className={`ai-msg-row ${role === 'user' ? 'user' : 'assistant'}`}>
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
        </div>
    );
}
