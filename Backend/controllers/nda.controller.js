const NdaRequest = require('../models/model.ndaRequest');
const { sendNdaPdfAccess } = require('../services/email.service');
const { log } = require('../services/log.service');
const { sanitizeTracking } = require('../utils/tracking');

const PUBLIC_DOMAINS = ['gmail', 'hotmail', 'yahoo', 'outlook', 'icloud', 'live', 'msn', 'me', 'proton', 'aol'];

function isPublicEmail(email) {
  const domain = email.split('@')[1]?.split('.')[0]?.toLowerCase() ?? '';
  return PUBLIC_DOMAINS.includes(domain);
}

exports.solicitar = async (req, res) => {
  try {
    const { nombre, cargo, empresa, email, caso = 'ape-plazas', documento = 'paper-nda', tracking } = req.body;

    if (!nombre?.trim() || !cargo?.trim() || !empresa?.trim() || !email?.trim()) {
      return res.status(400).json({ error: 'Nombre, cargo, empresa y email son requeridos.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(422).json({ error: 'Email no valido.' });
    }
    if (isPublicEmail(email)) {
      return res.status(422).json({ error: 'Usa tu correo corporativo.' });
    }

    const ventana24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const duplicado = await NdaRequest.findOne({
      email: email.toLowerCase().trim(),
      caso,
      documento,
      createdAt: { $gte: ventana24h },
    });

    if (duplicado) {
      return res.status(200).json({
        ok: true,
        duplicate: true,
        message: 'Ya registramos tu solicitud. La revisaremos desde el panel admin.',
      });
    }

    const request = await NdaRequest.create({
      nombre: nombre.trim(),
      cargo: cargo.trim(),
      empresa: empresa.trim(),
      email: email.toLowerCase().trim(),
      caso,
      documento,
      ipAddress: req.ip || '',
      tracking: sanitizeTracking(tracking),
    });

    log({
      accion:    `CREATE · NDA · ${request.empresa}`,
      categoria: 'NDA',
      autor:     'system',
      detalle:   `${request.nombre} · ${request.cargo} · caso: ${request.caso}`,
    });

    res.status(201).json({
      ok: true,
      data: request,
      message: 'Solicitud NDA registrada. Te contactaremos si el acceso es aprobado.',
    });
  } catch (err) {
    console.error('nda.solicitar error:', err);
    res.status(500).json({ error: 'Error registrando solicitud NDA.' });
  }
};

exports.listar = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'Todos') filter.status = status;

    const [data, total] = await Promise.all([
      NdaRequest.find(filter).sort({ createdAt: -1 }).limit(200),
      NdaRequest.countDocuments(filter),
    ]);

    res.json({ ok: true, data, total });
  } catch (err) {
    console.error('nda.listar error:', err);
    res.status(500).json({ error: 'Error listando solicitudes NDA.' });
  }
};

exports.actualizarStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['pendiente', 'aprobado', 'enviado', 'rechazado'].includes(status)) {
      return res.status(400).json({ error: 'Estado no valido.' });
    }

    const request = await NdaRequest.findByIdAndUpdate(id, { status }, { new: true });
    if (!request) return res.status(404).json({ error: 'Solicitud NDA no encontrada.' });

    log({
      accion:    `${status.toUpperCase()} · NDA · ${request.empresa}`,
      categoria: 'NDA',
      autor:     'admin',
      status:    status === 'rechazado' ? 'WARN' : 'OK',
    });

    res.json({ ok: true, data: request });
  } catch (err) {
    console.error('nda.actualizarStatus error:', err);
    res.status(500).json({ error: 'Error actualizando solicitud NDA.' });
  }
};

exports.aprobarYEnviar = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await NdaRequest.findById(id);
    if (!request) return res.status(404).json({ error: 'Solicitud NDA no encontrada.' });

    const pdfUrl = process.env.NDA_APE_PLAZAS_PDF_URL;
    if (!pdfUrl) {
      return res.status(500).json({ error: 'Falta configurar NDA_APE_PLAZAS_PDF_URL en backend/.env.' });
    }

    await sendNdaPdfAccess({
      nombre: request.nombre,
      empresa: request.empresa,
      email: request.email,
      caso: request.caso,
      pdfUrl,
    });

    const updated = await NdaRequest.findByIdAndUpdate(id, {
      status: 'enviado',
      emailSent: true,
    }, { new: true });

    log({
      accion:    `ENVIADO · NDA PDF · ${request.empresa}`,
      categoria: 'NDA',
      autor:     'admin',
      detalle:   `caso: ${request.caso} · ${request.email}`,
    });

    res.json({ ok: true, data: updated });
  } catch (err) {
    console.error('nda.aprobarYEnviar error:', err);
    res.status(500).json({ error: err.message || 'Error enviando PDF NDA.' });
  }
};
