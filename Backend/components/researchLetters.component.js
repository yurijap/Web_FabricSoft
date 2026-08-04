const express             = require('express');
const router              = express.Router();
const ctrl                = require('../controllers/researchLetters.controller');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

// ── Pública ────────────────────────────────────────────────────────────────────
router.post('/solicitar', ctrl.solicitar);

// ── Admin ──────────────────────────────────────────────────────────────────────
router.get('/admin',              ClerkExpressRequireAuth(), ctrl.listar);
router.get('/admin/config',       ClerkExpressRequireAuth(), ctrl.getConfig);
router.put('/admin/config',       ClerkExpressRequireAuth(), ctrl.actualizarConfig);
router.patch('/admin/:id/status', ClerkExpressRequireAuth(), ctrl.actualizarStatus);

module.exports = router;
