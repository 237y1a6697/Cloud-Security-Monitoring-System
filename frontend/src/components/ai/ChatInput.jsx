import { useState, useRef, useEffect, useCallback } from 'react';

export default function ChatInput({ onSendMessage, disabled }) {
    const [text, setText] = useState('');
    const textareaRef = useRef(null);

    // Auto-resize textarea matching typing height dynamically
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
        }
    }, [text]);

    const handleSubmit = useCallback((e) => {
        if (e) e.preventDefault();
        if (!text || !text.trim() || disabled) return;
        onSendMessage(text);
        setText('');
    }, [text, disabled, onSendMessage]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }, [handleSubmit]);

    return (
        <form onSubmit={handleSubmit} className="ai-input-wrapper">
            <textarea
                ref={textareaRef}
                className="ai-textarea"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask SentinelCore Assistant..."
                rows={1}
                disabled={disabled}
                aria-label="Chat input message"
            />
            <button
                type="submit"
                className="ai-btn-send"
                disabled={!text.trim() || disabled}
                title="Send Message"
                aria-label="Send message to AI"
            >
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
            </button>
        </form>
    );
}
