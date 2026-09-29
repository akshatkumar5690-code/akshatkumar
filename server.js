/**
 * BR06ai Local Development & Production Node Server
 * 
 * Zero-dependency server that serves the portfolio static files
 * and routes /api/chat to the serverless handler in api/chat.js.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const chatHandler = require('./api/chat.js');

// Minimal zero-dependency .env file loader
function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        try {
            const content = fs.readFileSync(envPath, 'utf8');
            content.split('\n').forEach(line => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    const eqIndex = trimmed.indexOf('=');
                    if (eqIndex > 0) {
                        const key = trimmed.slice(0, eqIndex).trim();
                        const val = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '');
                        if (!process.env[key]) {
                            process.env[key] = val;
                        }
                    }
                }
            });
            console.log(' Loaded environment variables from .env');
        } catch (e) {
            console.warn('⚠️ Could not load .env file:', e.message);
        }
    }
}

loadEnv();

const PORT = parseInt(process.env.PORT, 10) || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    // Handle /api/chat
    if (pathname === '/api/chat') {
        return chatHandler(req, res);
    }

    // Static file routing
    let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\') {
        safePath = '/index.html';
    }

    const filePath = path.join(PUBLIC_DIR, safePath);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.statusCode = 200;
        res.setHeader('Content-Type', contentType);

        // Stream file response
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
        stream.on('error', () => {
            res.statusCode = 500;
            res.end('Internal Server Error');
        });
    });
});

server.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`🚀 BR06ai & Portfolio Server running at:`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`   Chat API Endpoint: http://localhost:${PORT}/api/chat`);
    console.log(`=================================================\n`);
});
