const express = require('express');
const router = express.Router();
const leadsController = require('../controllers/leads.controller');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

// Público — formulario /aplicar
router.post('/solicitar',   leadsController.solicitar);
router.post('/waitlist',    leadsController.solicitarWaitlist);
router.post('/referencia',  leadsController.solicitarReferencia);


// Admin
router.get('/admin',               ClerkExpressRequireAuth(), leadsController.listarLeads);
router.patch('/admin/:id/status',  ClerkExpressRequireAuth(), leadsController.actualizarStatus);
router.patch('/admin/:id/notas',   ClerkExpressRequireAuth(), leadsController.actualizarNotas);

module.exports = router;
