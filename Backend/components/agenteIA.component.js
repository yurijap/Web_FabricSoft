const express = require('express');
const router = express.Router();
const multer = require('multer');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const agenteIAController = require('../controllers/agenteIA.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
  },
});

router.get(
  '/',
  ClerkExpressRequireAuth(),
  agenteIAController.obtenerConfiguracion
);

router.post(
  '/',
  ClerkExpressRequireAuth(),
  agenteIAController.guardarConfiguracion
);

router.post(
  '/upload',
  ClerkExpressRequireAuth(),
  upload.single('file'),
  agenteIAController.subirArchivoConocimiento
);

router.post(
  '/public',
  agenteIAController.probarPublico
);

router.post(
  '/public/action',
  agenteIAController.registrarAccionPublica
);

router.get(
  '/leads',
  ClerkExpressRequireAuth(),
  agenteIAController.obtenerLeadsIA
);

router.patch(
  '/leads/:id/status',
  ClerkExpressRequireAuth(),
  agenteIAController.actualizarLeadIA
);

router.delete(
  '/leads/:id',
  ClerkExpressRequireAuth(),
  agenteIAController.eliminarLeadIA
);

router.post(
  '/test',
  ClerkExpressRequireAuth(),
  agenteIAController.probarConfiguracion
);

module.exports = router;
