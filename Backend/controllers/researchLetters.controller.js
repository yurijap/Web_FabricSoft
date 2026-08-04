const ResearchLetterSuscriptor = require('../models/model.researchLetterSuscriptor');
const ResearchLetterConfig     = require('../models/model.researchLetterConfig');
const { sendResearchLetterConfirmacion, sendResearchLetterBienvenida } = require('../services/email.service');
const { log } = require('../services/log.service');
const { sanitizeTracking } = require('../utils/tracking');

const PUBLIC_DOMAINS = ['gmail', 'hotmail', 'yahoo', 'outlook', 'icloud', 'live', 'msn', 'me', 'proton', 'aol'];

function isPublicEmail(email) {
  const domain = email.split('@')[1]?.split('.')[0]?.toLowerCase() ?? '';
  return PUBLIC_DOMAINS.includes(domain);
}

// ─── POST /api/research-letters/solicitar ─────────────────────────────────────
exports.solicitar = async (req, res) => {
  try {
    const { email, nombre, empresa, cargo, revenueAprox, iniciativaOracle, industria, tracking } = req.body;

    if (!email || !nombre || !empresa || !cargo || !iniciativaOracle) {
      return res.status(400).json({ error: 'Email, nombre, empresa, cargo e iniciativa Oracle son requeridos.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(422).json({ error: 'Email no válido.' });
    }
    if (isPublicEmail(email)) {
      return res.status(422).json({ error: 'Acceso requiere correo corporativo. Gmail, Hotmail y similares no aplican.' });
    }

    const config = await ResearchLetterConfig.getSingleton();

    if (!config.admisionAbierta) {
      return res.status(409).json({ error: 'La admisión a Research Letters está cerrada temporalmente.' });
    }

    if (config.cupoActivo) {
      const aprobados = await ResearchLetterSuscriptor.countDocuments({ status: 'aprobado' });
      if (aprobados >= config.cupoMaximo) {
        return res.status(409).json({
          error: 'La membresía está en cupo máximo. Te notificaremos cuando haya disponibilidad.',
          cupoLleno: true,
        });
      }
    }

    const existente = await ResearchLetterSuscriptor.findOne({ email: email.toLowerCase() });
    if (existente) {
      return res.status(200).json({
        ok: true,
        duplicate: true,
        message: 'Ya tenemos tu solicitud. Te notificaremos cuando tu acceso sea aprobado.',
      });
    }

    const suscriptor = new ResearchLetterSuscriptor({
      email:            email.toLowerCase().trim(),
      nombre:           nombre.trim(),
      empresa:          empresa.trim(),
      cargo:            cargo.trim(),
      revenueAprox:     revenueAprox || 'No especificado',
      iniciativaOracle,
      industria:        industria?.trim() || '',
      ipAddress:        req.ip ?? '',
      tracking:         sanitizeTracking(tracking),
    });
    await suscriptor.save();

    sendResearchLetterConfirmacion({
      nombre:  nombre.trim(),
      empresa: empresa.trim(),
      email:   email.toLowerCase(),
    }).catch(err => console.error('🚨 researchLetters.sendConfirmacion:', err.message));

    log({
      accion:    `CREATE · Research Letter · ${suscriptor.empresa}`,
      categoria: 'Research Letters',
      autor:     'system',
      detalle:   `${suscriptor.nombre} · ${suscriptor.cargo} · oracle: ${suscriptor.iniciativaOracle}`,
    });

    return res.status(201).json({
      ok: true,
      message: 'Solicitud registrada. Validaremos tu perfil y recibirás confirmación en tu correo corporativo.',
    });
  } catch (error) {
    console.error('🚨 researchLetters.solicitar:', error);
    return res.status(500).json({ error: 'Error interno. Intenta de nuevo.' });
  }
};

// ─── GET /api/research-letters/admin ──────────────────────────────────────────
exports.listar = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status) query.status = status;

    const [total, aprobados, suscriptores, config] = await Promise.all([
      ResearchLetterSuscriptor.countDocuments(query),
      ResearchLetterSuscriptor.countDocuments({ status: 'aprobado' }),
      ResearchLetterSuscriptor.find(query)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      ResearchLetterConfig.getSingleton(),
    ]);

    return res.json({ ok: true, total, aprobados, config, data: suscriptores });
  } catch (error) {
    console.error('🚨 researchLetters.listar:', error);
    return res.status(500).json({ error: 'Error interno.' });
  }
};

// ─── PATCH /api/research-letters/admin/:id/status ─────────────────────────────
exports.actualizarStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pendiente', 'aprobado', 'rechazado'].includes(status)) {
      return res.status(400).json({ error: 'Estado no válido.' });
    }

    const suscriptor = await ResearchLetterSuscriptor.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!suscriptor) return res.status(404).json({ error: 'Suscriptor no encontrado.' });

    if (status === 'aprobado') {
      sendResearchLetterBienvenida({
        nombre:  suscriptor.nombre,
        empresa: suscriptor.empresa,
        email:   suscriptor.email,
      }).catch(err => console.error('🚨 researchLetters.sendBienvenida:', err.message));
    }

    log({
      accion:    `${status.toUpperCase()} · Research Letter · ${suscriptor.empresa}`,
      categoria: 'Research Letters',
      autor:     'admin',
      status:    status === 'rechazado' ? 'WARN' : 'OK',
    });

    return res.json({ ok: true, data: suscriptor });
  } catch (error) {
    console.error('🚨 researchLetters.actualizarStatus:', error);
    return res.status(500).json({ error: 'Error interno.' });
  }
};

// ─── GET /api/research-letters/admin/config ───────────────────────────────────
exports.getConfig = async (req, res) => {
  try {
    const config = await ResearchLetterConfig.getSingleton();
    return res.json({ ok: true, data: config });
  } catch (error) {
    console.error('🚨 researchLetters.getConfig:', error);
    return res.status(500).json({ error: 'Error interno.' });
  }
};

// ─── PUT /api/research-letters/admin/config ───────────────────────────────────
exports.actualizarConfig = async (req, res) => {
  try {
    const { cupoActivo, cupoMaximo, admisionAbierta } = req.body;

    const config = await ResearchLetterConfig.getSingleton();

    if (typeof cupoActivo === 'boolean')      config.cupoActivo      = cupoActivo;
    if (typeof cupoMaximo === 'number' && cupoMaximo > 0) config.cupoMaximo = cupoMaximo;
    if (typeof admisionAbierta === 'boolean') config.admisionAbierta = admisionAbierta;

    await config.save();
    return res.json({ ok: true, data: config });
  } catch (error) {
    console.error('🚨 researchLetters.actualizarConfig:', error);
    return res.status(500).json({ error: 'Error interno.' });
  }
};
