const express = require('express');
const router = express.Router();
const referenciasController = require('../controllers/referencias.controller');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

router.get('/', referenciasController.listarPublicas);

router.get('/admin', ClerkExpressRequireAuth(), referenciasController.listarAdmin);
router.put('/admin', ClerkExpressRequireAuth(), referenciasController.actualizar);
router.post('/admin/reset', ClerkExpressRequireAuth(), referenciasController.restaurarDefaults);

module.exports = router;
