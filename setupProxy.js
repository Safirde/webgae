const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/safirde',
    createProxyMiddleware({
      target: 'http://mgt2.pnu.ac.th',
      changeOrigin: true,
      secure: false
    })
  );
};