import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import aiAssistantService from '../services/aiAssistantService.js';

export const AIContext = createContext(null);

const WELCOME_MESSAGE = {
    id: 'welcome-msg',
    role: 'assistant',
    content: "👋 Welcome to SentinelCore!\n\nI'm your SentinelCore Internal Assistant. I can help you understand your security operations dashboard and SentinelCore modules.\n\nWhat would you like to explore?",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    suggestions: [
        "Explain Dashboard",
        "Explain Assets",
        "Explain Incidents",
        "Explain Vulnerabilities",
        "Explain Compliance",
        "Explain Reports"
    ]
};

export function AIProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState(() => {
        const saved = sessionStorage.getItem('sentinelcore_ai_chat');
        return saved ? JSON.parse(saved) : [WELCOME_MESSAGE];
    });
    const [loading, setLoading] = useState(false);
    const location = useLocation();

    // Ref to always hold the current messages — avoids stale closure in sendMessage
    const messagesRef = useRef(messages);
    useEffect(() => { messagesRef.current = messages; }, [messages]);

    // Persist messages to session storage
    useEffect(() => {
        sessionStorage.setItem('sentinelcore_ai_chat', JSON.stringify(messages));
    }, [messages]);

    const toggleOpen = useCallback(() => setIsOpen(prev => !prev), []);
    const closePanel = useCallback(() => setIsOpen(false), []);
    const clearChat = useCallback(() => {
        const welcomeTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMessages([{
            ...WELCOME_MESSAGE,
            id: Date.now() + '-welcome',
            timestamp: welcomeTimestamp
        }]);
    }, []);

    const getPageName = (path) => {
        if (path.includes('/infrastructure')) return 'Infrastructure';
        if (path.includes('/assets')) return 'Assets';
        if (path.includes('/incidents')) return 'Incidents';
        if (path.includes('/threat-intelligence')) return 'Threat Intelligence';
        if (path.includes('/vulnerabilities')) return 'Vulnerabilities';
        if (path.includes('/audit-logs')) return 'Audit Logs';
        if (path.includes('/compliance')) return 'Compliance';
        if (path.includes('/users')) return 'Users';
        if (path.includes('/reports')) return 'Reports';
        if (path.includes('/settings')) return 'Settings';
        return 'Dashboard';
    };

    const sendMessage = useCallback(async (text) => {
        if (!text || !text.trim()) return;

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const userMsg = {
            id: Date.now() + '-user',
            role: 'user',
            content: text.trim(),
            timestamp
        };

        // Append user message immediately
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        try {
            const path = location.pathname;
            const pageName = getPageName(path);

            // Use ref to read current history — avoids stale closure
            const history = messagesRef.current.map(m => ({ role: m.role, content: m.content }));

            const response = await aiAssistantService.chat(text, history, pageName, path);

            const botMsg = {
                id: Date.now() + '-bot',
                role: 'assistant',
                content: response.data.text,
                timestamp: response.data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                suggestions: response.data.suggestions || []
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (err) {
            console.error('AI chat failed:', err);
            const botMsg = {
                id: Date.now() + '-bot',
                role: 'assistant',
                content: "I'm having trouble connecting to the SentinelCore SecureOps security brain right now. Please ensure the backend server is running and try again.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                suggestions: []
            };
            setMessages(prev => [...prev, botMsg]);
        } finally {
            setLoading(false);
        }
    }, [location]); // removed `messages` dep — now using messagesRef

    return (
        <AIContext.Provider value={{
            isOpen,
            messages,
            loading,
            toggleOpen,
            closePanel,
            clearChat,
            sendMessage,
            currentPage: getPageName(location.pathname)
        }}>
            {children}
        </AIContext.Provider>
    );
}
