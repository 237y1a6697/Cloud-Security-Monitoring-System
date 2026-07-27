import { createContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import aiAssistantService from '../services/aiAssistantService.js';

export const AIContext = createContext(null);

export function AIProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState(() => {
        const saved = sessionStorage.getItem('sentinelcore_ai_chat');
        return saved ? JSON.parse(saved) : [];
    });
    const [loading, setLoading] = useState(false);
    const location = useLocation();

    // Persist messages to session storage
    useEffect(() => {
        sessionStorage.setItem('sentinelcore_ai_chat', JSON.stringify(messages));
    }, [messages]);

    const toggleOpen = useCallback(() => setIsOpen(prev => !prev), []);
    const closePanel = useCallback(() => setIsOpen(false), []);
    const clearChat = useCallback(() => setMessages([]), []);

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

            // Extract bare history to send to server (role + content)
            const history = messages.map(m => ({ role: m.role, content: m.content }));

            const response = await aiAssistantService.chat(text, history, pageName, path);

            const botMsg = {
                id: Date.now() + '-bot',
                role: 'assistant',
                content: response.data.text,
                timestamp: response.data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (err) {
            console.error('AI chat failed:', err);
            const botMsg = {
                id: Date.now() + '-bot',
                role: 'assistant',
                content: "I'm having trouble connecting to the SentinelCore SecureOps security brain right now. Please ensure the backend server is running and try again.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, botMsg]);
        } finally {
            setLoading(false);
        }
    }, [messages, location]);

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
