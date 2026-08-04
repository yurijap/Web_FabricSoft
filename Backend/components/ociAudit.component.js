const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/ociAudit.controller');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

// Público — prospecto solicita diagnóstico
router.post('/solicitar', controller.solicitar);

// Admin — gestión de solicitudes (requiere autenticación Clerk)
router.get('/',             ClerkExpressRequireAuth(), controller.listar);
router.get('/stats',        ClerkExpressRequireAuth(), controller.stats);
router.patch('/:id/status', ClerkExpressRequireAuth(), controller.actualizarStatus);
router.patch('/:id/notas',  ClerkExpressRequireAuth(), controller.actualizarNotas);

module.exports = router;
