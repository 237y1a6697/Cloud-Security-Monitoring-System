import useAIChat from '../../hooks/useAIChat.js';
import AIChatWindow from './AIChatWindow.jsx';

export default function FloatingAIButton() {
    const { toggleOpen } = useAIChat();

    return (
        <>
            <button
                className="ai-floating-btn"
                onClick={toggleOpen}
                aria-label="Toggle AI Security Assistant"
                title="SentinelCore AI Assistant"
            >
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2c1.103 0 2 .897 2 2v1h3c1.654 0 3 1.346 3 3v2c.827 0 1.5.673 1.5 1.5v3c0 .827-.673 1.5-1.5 1.5v3c0 1.654-1.346 3-3 3h-3v1c0 1.103-.897 2-2 2s-2-.897-2-2v-1H7c-1.654 0-3-1.346-3-3v-3c-.827 0-1.5-.673-1.5-1.5v-3c0-.827.673-1.5 1.5-1.5V8c0-1.654 1.346-3 3-3h3V4c0-1.103.897-2 2-2zM6 8v10c0 .552.448 1 1 1h10c.552 0 1-.448 1-1V8H6zm3.5 2.5c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5.672-1.5 1.5-1.5zm5 0c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5.672-1.5 1.5-1.5zm-5 5.5h7c.276 0 .5.224.5.5s-.224.5-.5.5h-7c-.276 0-.5-.224-.5-.5s.224-.5.5-.5z" />
                </svg>
            </button>
            <AIChatWindow />
        </>
    );
}
