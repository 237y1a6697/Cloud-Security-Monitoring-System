/**
 * SentinelCore SecureOps - Dev Server
 * Standard self-contained HTTP server mapping static components
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

let PORT = 8000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.json': 'application/json',
};

const server = http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0];

    // Root redirect
    if (urlPath === '/' || urlPath === '/index.html') {
        res.writeHead(302, { 'Location': '/templates/login.html' });
        res.end();
        return;
    }

    // Match local structure (resolve templates or static folders)
    const filePath = path.join(__dirname, '../..', urlPath);

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end(`404 File Not Found: ${urlPath}`);
            } else {
                res.writeHead(500);
                res.end(`Server System Error: ${error.code}`);
            }
        } else {
            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';

            // Inject standard security response headers
            res.writeHead(200, {
                'Content-Type': contentType,
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY'
            });
            res.end(content, 'utf-8');
        }
    });
});

function startServer() {
    server.listen(PORT);
}

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.warn(`[SentinelCore DevServer] Port ${PORT} is in use. Attempting next port ${PORT + 1}...`);
        PORT++;
        startServer();
    } else {
        console.error(`[SentinelCore DevServer] Global error: ${e.message}`);
    }
});

server.on('listening', () => {
    console.log(`[SentinelCore DevServer] Started successfully on port ${PORT}`);
    console.log(`Local Access URL: http://localhost:${PORT}/templates/login.html`);
});

startServer();
