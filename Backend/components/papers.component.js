const express                   = require('express');
const router                    = express.Router();
const papersController          = require('../controllers/papers.controller');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const multer                    = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ── Rutas públicas ─────────────────────────────────────────────────────────────
router.post('/solicitar',   papersController.solicitar);
router.post('/benchmark',   papersController.benchmarkEarlyAccess);
router.get('/catalog',      papersController.catalogoPublico);
router.get('/catalog/:paperId', papersController.detallePublico);
router.get('/download/:id', papersController.descargar);

// ── Rutas admin ────────────────────────────────────────────────────────────────
router.get('/admin',               ClerkExpressRequireAuth(), papersController.listarAccesos);
router.get('/admin/benchmark',     ClerkExpressRequireAuth(), papersController.listarBenchmark);
router.get('/admin/catalog',       ClerkExpressRequireAuth(), papersController.catalogoAdmin);
router.put('/admin/catalog',       ClerkExpressRequireAuth(), papersController.guardarCatalogo);
router.post('/admin/:paperId/pdf', ClerkExpressRequireAuth(), upload.single('pdf'), papersController.subirPdf);
router.patch('/admin/:id/status',  ClerkExpressRequireAuth(), papersController.actualizarStatus);

module.exports = router;
