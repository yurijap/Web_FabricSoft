const express = require('express');
const router = express.Router();
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const diagnosticoOracleController = require('../controllers/diagnosticoOracle.controller');

router.post(
  '/',
  diagnosticoOracleController.crearDiagnostico
);

router.get(
  '/',
  ClerkExpressRequireAuth(),
  diagnosticoOracleController.obtenerDiagnosticos
);

router.patch(
  '/:id/status',
  ClerkExpressRequireAuth(),
  diagnosticoOracleController.actualizarDiagnostico
);

router.post(
  '/:id/send',
  ClerkExpressRequireAuth(),
  diagnosticoOracleController.enviarDiagnostico
);

router.delete(
  '/:id',
  ClerkExpressRequireAuth(),
  diagnosticoOracleController.eliminarDiagnostico
);

module.exports = router;
