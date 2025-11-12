import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml'
};

function serveStaticFile(filePath, res) {
    const extname = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // File not found
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>', 'utf-8');
            } else {
                // Server error
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            // Success
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
}

const server = http.createServer((req, res) => {
    // Enable CORS for development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    let filePath = '';
    
    if (req.url === '/') {
        filePath = path.join(__dirname, 'public', 'index.html');
    } else if (req.url.startsWith('/dist/')) {
        // Serve compiled TypeScript files
        filePath = path.join(__dirname, req.url);
    } else {
        // Serve static files from public directory
        filePath = path.join(__dirname, 'public', req.url);
    }

    serveStaticFile(filePath, res);
});

server.listen(PORT, () => {
    console.log(`🌐 Expense Tracker Web Server running on http://localhost:${PORT}`);
    console.log('📊 Open your browser and navigate to the URL above to view the expense tracker!');
    console.log('');
    console.log('Features available:');
    console.log('• View all expenses in a beautiful table');
    console.log('• Add new expenses through the web form');
    console.log('• Filter expenses by category and date');
    console.log('• View expense summaries and reports');
    console.log('• Manage categories');
    console.log('');
    console.log('Press Ctrl+C to stop the server');
});