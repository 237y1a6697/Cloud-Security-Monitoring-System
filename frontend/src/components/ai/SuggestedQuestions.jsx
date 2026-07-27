export default function SuggestedQuestions({ currentPage, onSelectQuestion }) {
    const getQuestions = () => {
        switch (currentPage) {
            case 'Assets':
                return [
                    "How do I schedule asset maintenance?",
                    "How do I trigger bulk patch upgrades?",
                    "Show active production servers"
                ];
            case 'Incidents':
                return [
                    "Show SLA breach statistics",
                    "How do I resolve ticket INC-102?",
                    "Highlight high severity incidents"
                ];
            case 'Threat Intelligence':
                return [
                    "Explain MITRE ATT&CK Matrix",
                    "Show active blocklisted malware IPs",
                    "What is the current geo attack trend?"
                ];
            case 'Reports':
                return [
                    "Export a compliance PDF report",
                    "How do I schedule a weekly cron report?",
                    "Can I export structured CSV/XLSX logs?"
                ];
            case 'Audit Logs':
                return [
                    "Export access audit trails to CSV",
                    "Who performed the last admin login?",
                    "Filter log events by failure result"
                ];
            case 'Vulnerabilities':
                return [
                    "Check SonarQube quality gate",
                    "How are Trivy CVEs mitigated?",
                    "Show overall compliance policy maps"
                ];
            case 'Settings':
                return [
                    "Show active SIEM correlation rules",
                    "Change audit log retention period",
                    "Configure security password complexity"
                ];
            case 'Infrastructure':
                return [
                    "Show VM cluster nodes health",
                    "What is our telemetry database status?",
                    "Is SecOps vault API HSM responsive?"
                ];
            default:
                return [
                    "Explain the security Dashboard metrics",
                    "How does RBAC auth checking work?",
                    "How do I register a new security user?"
                ];
        }
    };

    const questions = getQuestions();

    return (
        <div className="ai-suggestions-container">
            <div className="ai-suggestions-title">Dynamic Context Suggestions</div>
            <div className="ai-suggestions-scroll">
                {questions.map((q, idx) => (
                    <button
                        key={idx}
                        className="ai-suggest-chip"
                        onClick={() => onSelectQuestion(q)}
                        type="button"
                    >
                        {q}
                    </button>
                ))}
            </div>
        </div>
    );
}
