import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const htmlBypass = (req) => {
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    return req.url;
  }
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy all /api/* and auth endpoints to Spring Boot on port 8081
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      '/login': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
        bypass: htmlBypass,
      },
      '/logout': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      '/register': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
        bypass: htmlBypass,
      },
      '/profile': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
        bypass: htmlBypass,
      },
    },
  },
});
