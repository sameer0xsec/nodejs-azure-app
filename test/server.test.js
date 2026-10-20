const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');

const { createServer } = require('../server');

async function makeRequest(pathname, method = 'GET') {
  const server = createServer();
  server.listen(0);
  await once(server, 'listening');

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, { method });
  const body = await response.text();

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  return { response, body };
}

test('serves index.html at root path', async () => {
  const { response, body } = await makeRequest('/');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(body, /Weather Dashboard/);
});

test('returns health endpoint response', async () => {
  const { response, body } = await makeRequest('/api/health');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/json/);
  assert.deepEqual(JSON.parse(body), { status: 'ok' });
});

test('blocks unsupported methods', async () => {
  const { response, body } = await makeRequest('/', 'POST');
  assert.equal(response.status, 405);
  assert.deepEqual(JSON.parse(body), { error: 'Method Not Allowed' });
});
