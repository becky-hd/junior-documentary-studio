import http from 'node:http';
import healthHandler from '../api/health.js';
import bootstrapHandler from '../api/bootstrap.js';
import sessionHandler from '../api/session.js';
import warmupsHandler from '../api/warmups.js';
import draftsHandler from '../api/drafts.js';

const PORT = 3001;
const HOST = '127.0.0.1';

const routes = {
  '/api/health': healthHandler,
  '/api/bootstrap': bootstrapHandler,
  '/api/session': sessionHandler,
  '/api/warmups': warmupsHandler,
  '/api/drafts': draftsHandler,
};

const server = http.createServer(async (req, res) => {
  const pathname = (req.url || '/').split('?')[0];
  const handler = routes[pathname];
  if (!handler) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }
  await handler(req, res);
});

server.listen(PORT, HOST, () => {
  console.log(`Local BFF API listening strictly on http://${HOST}:${PORT}`);
});
