const express = require('express');
const router = express.Router();
const transparenciaController = require('../controllers/transparencia.controller');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

// Público
router.get('/', transparenciaController.listarPublico);

// Admin
router.get('/admin',       ClerkExpressRequireAuth(), transparenciaController.listarAdmin);
router.put('/admin',       ClerkExpressRequireAuth(), transparenciaController.actualizar);
router.post('/admin/reset', ClerkExpressRequireAuth(), transparenciaController.restaurarDefaults);

module.exports = router;
