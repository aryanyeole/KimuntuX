const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Proxies /api/* to FastAPI on 127.0.0.1:8000 (avoids CORS and CRA5 + package.json "proxy" bug).
 */
module.exports = function setupProxy(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://127.0.0.1:8000',
      changeOrigin: true,
    })
  );
};
