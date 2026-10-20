const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const publicDir = path.join(__dirname, 'public');
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function createServer() {
  return http.createServer((req, res) => {
    const requestUrl = new URL(req.url, 'http://localhost');

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      sendJson(res, 405, { error: 'Method Not Allowed' });
      return;
    }

    if (requestUrl.pathname === '/api/health') {
      sendJson(res, 200, { status: 'ok' });
      return;
    }

    const sanitizedPath = requestUrl.pathname === '/'
      ? '/index.html'
      : requestUrl.pathname;
    const decodedPath = decodeURIComponent(sanitizedPath);
    const normalizedPath = path
      .normalize(decodedPath)
      .replace(/^([\\/])+/, '')
      .replace(/^([.]{2}(?:[\\/]|$))+/, '');

    const filePath = path.resolve(publicDir, normalizedPath);

    if (!filePath.startsWith(publicDir)) {
      sendJson(res, 400, { error: 'Bad Request' });
      return;
    }

    fs.stat(filePath, (statErr, stat) => {
      if (statErr || !stat.isFile()) {
        sendJson(res, 404, { error: 'Not Found' });
        return;
      }

      const extension = path.extname(filePath).toLowerCase();
      const contentType = contentTypes[extension] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': contentType });

      if (req.method === 'HEAD') {
        res.end();
        return;
      }

      const stream = fs.createReadStream(filePath);
      stream.on('error', () => {
        sendJson(res, 500, { error: 'Internal Server Error' });
      });
      stream.pipe(res);
    });
  });
}

if (require.main === module) {
  const port = Number.parseInt(process.env.PORT, 10) || 3000;
  const server = createServer();

  server.listen(port, () => {
    console.log(`Weather dashboard server listening on port ${port}`);
  });
}

module.exports = { createServer };
