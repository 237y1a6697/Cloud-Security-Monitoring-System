import { useContext } from 'react';
import { AIContext } from '../context/AIContext.jsx';

export default function useAIChat() {
    const context = useContext(AIContext);
    if (!context) {
        throw new Error('useAIChat must be used within an AIProvider');
    }
    return context;
}
