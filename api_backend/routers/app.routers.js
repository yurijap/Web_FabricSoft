const express = require('express');
const router = express.Router();

const authRoutes           = require('../components/auth.component');
const papersRoutes         = require('../components/papers.component');
const leadsRoutes          = require('../components/leads.component');
const officeHoursRoutes    = require('../components/officeHours.component');
const capacidadRoutes      = require('../components/capacidad.component');
const statsRoutes          = require('../components/stats.component');
const metricasRoutes       = require('../components/metricas.component');
const ndaRoutes            = require('../components/nda.component');
const referenciasRoutes    = require('../components/referencias.component');
const transparenciaRoutes  = require('../components/transparencia.component');
const researchLettersRoutes = require('../components/researchLetters.component');
const logsRoutes           = require('../components/logs.component');
const i18nRoutes           = require('../components/i18n.component');
const agenteIARoutes       = require('../components/agenteIA.component');
const diagnosticoOracleRoutes  = require('../components/diagnosticoOracle.component');
const rescueAssessmentRoutes   = require('../components/rescueAssessment.component');
const ociAuditRoutes           = require('../components/ociAudit.component');
const cloudComparatorRoutes    = require('../components/cloudComparator.component');
const erpTcoRoutes             = require('../components/erpTco.component');

router.get('/', (req, res) => {
  res.json({ ok: true, message: '✅ API FABRIC SOFT funcionando.' });
});

router.use('/auth',              authRoutes);
router.use('/papers',            papersRoutes);
router.use('/leads',             leadsRoutes);
router.use('/office-hours',      officeHoursRoutes);
router.use('/capacidad',         capacidadRoutes);
router.use('/stats',             statsRoutes);
router.use('/metricas',          metricasRoutes);
router.use('/nda',               ndaRoutes);
router.use('/referencias',       referenciasRoutes);
router.use('/transparencia',     transparenciaRoutes);
router.use('/research-letters',  researchLettersRoutes);
router.use('/logs',              logsRoutes);
router.use('/i18n',              i18nRoutes);
router.use('/agente-ia',         agenteIARoutes);
router.use('/diagnostico-oracle',   diagnosticoOracleRoutes);
router.use('/rescue-assessment',    rescueAssessmentRoutes);
router.use('/oci-audit',            ociAuditRoutes);
router.use('/cloud-comparator',     cloudComparatorRoutes);
router.use('/erp-tco',              erpTcoRoutes);

router.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
  });
});

router.use((err, req, res, next) => {
  console.error(`⚠️ Error en ruta ${req.method} ${req.originalUrl}:`, err.stack);
  res.status(500).json({
    error: 'Error interno del servidor',
    ...(process.env.NODE_ENV !== 'production' && { message: err.message }),
  });
});

module.exports = router;
