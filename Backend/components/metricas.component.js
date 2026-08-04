const express = require('express');
const router = express.Router();
const metricasController = require('../controllers/metricas.controller');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

// Público — el home puede leer las métricas visibles
router.get('/', metricasController.get);

// Admin — actualiza una métrica por id
router.patch('/:id', ClerkExpressRequireAuth(), metricasController.updateOne);

module.exports = router;
