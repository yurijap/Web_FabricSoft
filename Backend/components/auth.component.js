const express = require('express');
const router = express.Router();
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const authController = require('../controllers/auth.controller');

router.get('/login',
  ClerkExpressRequireAuth(),
  authController.validarSesion
);

module.exports = router;
