const express = require('express');
const router = express.Router();
const Lead     = require('../models/model.lead');
const Capacidad = require('../models/model.capacidad');

router.get('/', async (req, res) => {
  try {
    const [capDoc, solicitudesEvaluadas, enListaEspera] = await Promise.all([
      Capacidad.findOne(),
      Lead.countDocuments(),
      Lead.countDocuments({ status: 'WaitList' }),
    ]);

    // Proyectos activos = slots marcados 'activo' en DB de capacidad
    let proyectosActivos = 0;
    if (capDoc?.slots?.length) {
      proyectosActivos = capDoc.slots.filter(s => s.status === 'activo').length;
    }

    res.json({ ok: true, data: { proyectosActivos, solicitudesEvaluadas, enListaEspera } });
  } catch (err) {
    console.error('stats error:', err);
    res.status(500).json({ error: 'Error obteniendo estadísticas.' });
  }
});

module.exports = router;
