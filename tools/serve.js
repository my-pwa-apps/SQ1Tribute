const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = Number(process.argv[2] || process.env.PORT || 8080);
const securityHeaders = Object.fromEntries(
    fs.readFileSync(path.join(root, '_headers'), 'utf8')
        .split(/\r?\n/)
        .map((line) => line.trim().match(/^([^/][^:]+):\s*(.+)$/))
        .filter(Boolean)
        .map((match) => [match[1], match[2]])
);
const mimeTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.webmanifest': 'application/manifest+json',
    // Firefox refuses @font-face resources served as octet-stream.
    '.woff2': 'font/woff2'
};

http.createServer((request, response) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    const pathname = decodeURIComponent(requestUrl.pathname);
    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const filePath = path.resolve(root, relativePath);
    if (!filePath.startsWith(root + path.sep)) {
        response.writeHead(403).end('Forbidden');
        return;
    }
    const sendFile = () => fs.readFile(filePath, (error, data) => {
        if (error) {
            response.writeHead(error.code === 'ENOENT' ? 404 : 500).end('Not found');
            return;
        }
        response.writeHead(200, {
            ...securityHeaders,
            'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream',
            'Cache-Control': 'no-cache'
        });
        response.end(data);
    });
    const delay = Math.min(10000, Math.max(0, Number(requestUrl.searchParams.get('delay')) || 0));
    if (delay) setTimeout(sendFile, delay);
    else sendFile();
}).listen(port, '127.0.0.1', () => {
    console.log(`Star Sweeper development server: http://127.0.0.1:${port}`);
});
