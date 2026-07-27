import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './components/common/Toast/Toast.jsx';
import { AIProvider } from './context/AIContext.jsx';
import './styles/main.css';
import './index.css';
import './styles/aiAssistant.css';
import './styles/profile.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AIProvider>
            <App />
          </AIProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);

