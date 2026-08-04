const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/logs.controller');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

router.get('/admin', ClerkExpressRequireAuth(), ctrl.listar);

module.exports = router;
