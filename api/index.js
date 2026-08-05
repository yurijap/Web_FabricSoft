const app = require('../api_backend/server.js');

module.exports = (req, res) => {
  return app(req, res);
};
