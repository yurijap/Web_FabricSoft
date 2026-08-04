const express = require('express');
const router = express.Router();
const ndaController = require('../controllers/nda.controller');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

router.post('/solicitar', ndaController.solicitar);

router.get('/admin', ClerkExpressRequireAuth(), ndaController.listar);
router.patch('/admin/:id/status', ClerkExpressRequireAuth(), ndaController.actualizarStatus);
router.post('/admin/:id/aprobar-enviar', ClerkExpressRequireAuth(), ndaController.aprobarYEnviar);

module.exports = router;
