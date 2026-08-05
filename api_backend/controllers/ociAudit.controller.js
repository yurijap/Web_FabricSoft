const OciAudit          = require('../models/model.ociAudit');
const emailService      = require('../services/email.service');
const { log }           = require('../services/log.service');
const { sanitizeTracking } = require('../utils/tracking');

const PUBLIC_DOMAINS = ['gmail','hotmail','yahoo','outlook','icloud','live','msn','me','proton'];

// Rangos de gasto → valor numérico para scoring
const GASTO_SCORE_MAP = {
  'Menos de USD 5,000 / mes':          10,
  'USD 5,000 – 15,000 / mes':          25,
  'USD 15,000 – 50,000 / mes':         45,
  'USD 50,000 – 150,000 / mes':        70,
  'Más de USD 150,000 / mes':          95,
};

const CARGO_SENIOR = /CFO|CTO|CIO|VP|Director|Head|Chief/i;

function isPublicEmail(email) {
  const domain = (email.split('@')[1] || '').split('.')[0].toLowerCase();
  return PUBLIC_DOMAINS.includes(domain);
}

function calcScore({ gastoOci = '', cargo = '' }) {
  let score = GASTO_SCORE_MAP[gastoOci] ?? 5;
  if (CARGO_SENIOR.test(cargo)) score = Math.min(score + 15, 100);
  return score;
}

function nowLabel() {
  return new Date().toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── POST /oci-audit/solicitar ─────────────────────────────────────────────────

exports.solicitar = async (req, res) => {
  try {
    const { empresa, cargo, email, gastoOci, ndaAceptado, tracking } = req.body;

    if (!empresa?.trim())
      return res.status(400).json({ error: 'Empresa requerida.' });
    if (!cargo?.trim())
      return res.status(400).json({ error: 'Cargo requerido.' });
    if (!email || !email.includes('@'))
      return res.status(400).json({ error: 'Email inválido.' });
    if (isPublicEmail(email))
      return res.status(400).json({ error: 'Usa tu correo corporativo.' });
    if (!gastoOci?.trim())
      return res.status(400).json({ error: 'Selecciona tu gasto mensual aproximado en OCI.' });
    if (!ndaAceptado)
      return res.status(400).json({ error: 'Debes aceptar la revisión bajo NDA.' });

    const score  = calcScore({ gastoOci, cargo });
    const status = 'Nuevo';

    const solicitud = await OciAudit.create({
      empresa:     empresa.trim(),
      cargo:       cargo.trim(),
      email:       email.trim().toLowerCase(),
      gastoOci:    gastoOci.trim(),
      ndaAceptado: true,
      ipAddress:   req.ip || '',
      score,
      status,
      historial: [{ fecha: nowLabel(), estado: status, autor: 'Sistema' }],
      tracking: sanitizeTracking(tracking),
    });

    log({
      accion:    `CREATE - OCI Audit - ${solicitud.empresa}`,
      categoria: 'OCI Audit',
      autor:     'system',
      status:    'OK',
      detalle:   `${solicitud.cargo} · ${solicitud.email} · gasto: ${gastoOci} · score: ${score}`,
    });

    // Email de confirmación al prospecto (fire-and-forget)
    emailService.sendConfirmacionOciAudit({
      empresa: solicitud.empresa,
      cargo:   solicitud.cargo,
      email:   solicitud.email,
      gastoOci: solicitud.gastoOci,
    }).catch(err => console.error('OciAudit email error:', err));

    res.status(201).json({ ok: true, data: { id: solicitud._id, status } });
  } catch (err) {
    console.error('ociAudit.solicitar error:', err);
    res.status(500).json({ error: 'Error interno al registrar la solicitud.' });
  }
};

// ── GET /oci-audit (admin) ────────────────────────────────────────────────────

exports.listar = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [solicitudes, total] = await Promise.all([
      OciAudit.find(filter)
        .sort({ score: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OciAudit.countDocuments(filter),
    ]);

    res.json({
      ok: true,
      data: solicitudes,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('ociAudit.listar error:', err);
    res.status(500).json({ error: 'Error al obtener solicitudes.' });
  }
};

// ── PATCH /oci-audit/:id/status (admin) ──────────────────────────────────────

const VALID_STATUSES = ['Nuevo', 'Contactado', 'Acceso Coordinado', 'Reporte Enviado', 'Descartado'];

exports.actualizarStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, nota, autor = 'Admin' } = req.body;

    if (!VALID_STATUSES.includes(status))
      return res.status(400).json({ error: `Status inválido. Valores: ${VALID_STATUSES.join(', ')}` });

    const solicitud = await OciAudit.findByIdAndUpdate(
      id,
      {
        status,
        $push: { historial: { fecha: nowLabel(), estado: status, autor } },
        ...(nota ? { notas: nota } : {}),
      },
      { new: true }
    );

    if (!solicitud)
      return res.status(404).json({ error: 'Solicitud no encontrada.' });

    log({
      accion:    `UPDATE - OCI Audit status → ${status}`,
      categoria: 'OCI Audit',
      autor,
      status:    'OK',
      detalle:   `${solicitud.empresa} · ${solicitud.email}`,
    });

    res.json({ ok: true, data: solicitud });
  } catch (err) {
    console.error('ociAudit.actualizarStatus error:', err);
    res.status(500).json({ error: 'Error al actualizar status.' });
  }
};

// ── PATCH /oci-audit/:id/notas (admin) ───────────────────────────────────────

exports.actualizarNotas = async (req, res) => {
  try {
    const { id }   = req.params;
    const { notas } = req.body;

    const solicitud = await OciAudit.findByIdAndUpdate(
      id,
      { notas: String(notas || '').slice(0, 2000) },
      { new: true }
    );

    if (!solicitud)
      return res.status(404).json({ error: 'Solicitud no encontrada.' });

    res.json({ ok: true, data: solicitud });
  } catch (err) {
    console.error('ociAudit.actualizarNotas error:', err);
    res.status(500).json({ error: 'Error al actualizar notas.' });
  }
};

// ── GET /oci-audit/stats (admin) ──────────────────────────────────────────────

exports.stats = async (req, res) => {
  try {
    const [total, porStatus, scoreAlto] = await Promise.all([
      OciAudit.countDocuments(),
      OciAudit.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      OciAudit.countDocuments({ score: { $gte: 60 } }),
    ]);

    res.json({
      ok: true,
      data: {
        total,
        porStatus: Object.fromEntries(porStatus.map(s => [s._id, s.count])),
        scoreAlto,
      },
    });
  } catch (err) {
    console.error('ociAudit.stats error:', err);
    res.status(500).json({ error: 'Error al obtener estadísticas.' });
  }
};
