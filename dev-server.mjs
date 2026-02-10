/**
 * Dev server with increased max header size to fix 431.
 * Run: node dev-server.mjs
 * Then open http://localhost:3000
 */
import http from 'http';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer as createViteServer } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname);
const port = 3000;

// Load .env.local into process.env
function loadEnv() {
  const path = join(root, '.env.local');
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}
loadEnv();

// Add .json() to Node's ServerResponse
function wrapRes(res) {
  const _status = res.statusCode;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
  };
  return res;
}

// Collect request body and call handler
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const createOrder = (await import('./api/create-order.js')).default;
const verifyPayment = (await import('./api/verify-payment.js')).default;
const register = (await import('./api/register.js')).default;
const sendTicketEmail = (await import('./api/send-ticket-email.js')).default;

const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'spa',
});

const server = http.createServer(
  { maxHeaderSize: 32768 },
  async (req, res) => {
    wrapRes(res);
    const url = req.url?.split('?')[0] || '';

    const runApi = async (handler) => {
      const body = await readBody(req);
      const fakeReq = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: body ? JSON.parse(body) : {},
        on: () => {},
      };
      await handler(fakeReq, res);
    };

    if (req.method === 'OPTIONS' && url.startsWith('/api/')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.statusCode = 200;
      res.end();
      return;
    }

    function makeFakeReq(body) {
      const cbs = {};
      const fakeReq = {
        method: 'POST',
        headers: req.headers,
        body: undefined,
        on(ev, fn) {
          cbs[ev] = fn;
          if (cbs.data && cbs.end) setImmediate(() => { cbs.data(Buffer.from(body)); cbs.end(); });
        },
      };
      return fakeReq;
    }

    if (req.method === 'POST' && url === '/api/create-order') {
      const body = await readBody(req);
      return createOrder(makeFakeReq(body), res);
    }
    if (req.method === 'POST' && url === '/api/verify-payment') {
      const body = await readBody(req);
      return verifyPayment(makeFakeReq(body), res);
    }
    if (req.method === 'POST' && url === '/api/register') {
      const body = await readBody(req);
      return register(makeFakeReq(body), res);
    }
    if (req.method === 'POST' && url === '/api/send-ticket-email') {
      const body = await readBody(req);
      return sendTicketEmail(makeFakeReq(body), res);
    }

    vite.middlewares(req, res, () => {
      res.statusCode = 404;
      res.end();
    });
  }
);

server.listen(port, () => {
  console.log(`\n  Dev server (431 fix): http://localhost:${port}\n`);
});
