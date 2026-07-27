import axios from 'axios';

const aiAssistantService = {
    chat: async (message, conversation, currentPage, currentRoute) => {
        return axios.post('/api/ai/chat', {
            message,
            conversation,
            currentPage,
            currentRoute
        }, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
    }
};

export default aiAssistantService;
