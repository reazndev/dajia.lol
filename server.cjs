'use strict';

const http = require('http');
const path = require('path');
const fs = require('fs').promises;

const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.js': 'text/javascript; charset=UTF-8',
    '.mjs': 'text/javascript; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

const server = http.createServer(async (req, res) => {
    try {
        console.log(`Received request for: ${req.url}`);
        
        // Remove /dist from the URL if present
        let urlPath = req.url.replace('/dist/', '/');
        
        // Default to index.html for root
        let filePath = path.join(__dirname, 'dist', urlPath === '/' ? 'index.html' : urlPath);
        
        // Remove query parameters from the URL
        filePath = filePath.split('?')[0];
        
        // Check if file exists
        try {
            const stats = await fs.stat(filePath);
            if (stats.isDirectory()) {
                filePath = path.join(filePath, 'index.html');
            }
        } catch (err) {
            // If file doesn't exist, serve index.html for client-side routing
            // But only if it's not an asset request
            if (!urlPath.startsWith('/assets/')) {
                filePath = path.join(__dirname, 'dist', 'index.html');
            } else {
                throw err; // Rethrow for asset 404s
            }
        }

        // Get file extension and content type
        const extname = path.extname(filePath).toLowerCase();
        let contentType = MIME_TYPES[extname] || 'application/octet-stream';

        // Special handling for JavaScript modules
        if (extname === '.js' && req.headers.accept && req.headers.accept.includes('text/javascript')) {
            contentType = 'text/javascript; charset=UTF-8';
        }

        console.log(`Serving ${filePath} with content-type: ${contentType}`);

        // Read and serve the file
        const content = await fs.readFile(filePath);
        
        // Set response headers
        const headers = {
            'Content-Type': contentType,
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': extname === '.html' ? 'no-cache' : 'max-age=31536000'
        };

        // Add CORS headers
        headers['Access-Control-Allow-Origin'] = '*';
        headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
        headers['Access-Control-Allow-Headers'] = 'Content-Type';

        res.writeHead(200, headers);
        res.end(content);
    } catch (err) {
        console.error(`Error serving ${req.url}: ${err}`);
        if (err.code === 'ENOENT') {
            res.writeHead(404);
            res.end('File Not Found');
        } else {
            res.writeHead(500);
            res.end('Server Error');
        }
    }
});

const PORT = process.env.PORT || 3008;

// Handle server errors
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please try a different port or kill the existing process.`);
        process.exit(1);
    } else {
        console.error('Server error:', err);
    }
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Serving static files from: ${path.join(__dirname, 'dist')}`);
}); 