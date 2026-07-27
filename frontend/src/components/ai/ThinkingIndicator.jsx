export default function ThinkingIndicator() {
    return (
        <div className="ai-thinking-row" aria-live="polite" aria-busy="true">
            <span>AI Analyst is correlating security feeds</span>
            <div className="ai-thinking-dots">
                <span />
                <span />
                <span />
            </div>
        </div>
    );
}
