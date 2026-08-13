import axiosInstance from '../api/axios.js';

/**
 * SentinelCore AI Assistant service.
 *
 * All calls go through axiosInstance which:
 *  - resolves the correct backend base URL (Vite proxy in dev, Render URL in production)
 *  - sends session cookies (withCredentials: true)
 *
 * The MOONSHOT_API_KEY is handled entirely on the backend (Render env var).
 * It is NEVER sent to or from the browser.
 */
const aiAssistantService = {
    /**
     * @param {string} message         - the user's chat message
     * @param {Array}  conversation    - prior { role, content } messages for context
     * @param {string} currentPage     - active SentinelCore module name (e.g. "Reports")
     * @param {string} currentRoute    - current browser route (e.g. "/reports")
     * @returns {Promise<AxiosResponse>} response.data: { text: string, timestamp: string }
     */
    chat: async (message, conversation, currentPage, currentRoute) => {
        return axiosInstance.post('/api/ai/chat', {
            message,
            conversation,
            currentPage,
            currentRoute
        });
    }
};

export default aiAssistantService;
