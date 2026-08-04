const fs              = require('fs');
const path            = require('path');
const PaperAccess     = require('../models/model.paperAccess');
const PaperCatalog    = require('../models/model.paperCatalog');
const BenchmarkAccess = require('../models/model.benchmarkAccess');
const { sendPaperEntrega } = require('../services/email.service');
const { log } = require('../services/log.service');
const { sanitizeTracking } = require('../utils/tracking');
const { ensureSimulatedPaperPdf } = require('../utils/simulatedPaperPdf');

const PUBLIC_DOMAINS = ['gmail', 'hotmail', 'yahoo', 'outlook', 'icloud', 'live', 'msn', 'me', 'proton', 'aol'];

function isPublicEmail(email) {
  const domain = email.split('@')[1]?.split('.')[0]?.toLowerCase() ?? '';
  return PUBLIC_DOMAINS.includes(domain);
}

const DEFAULT_PAPERS = [
  {
    paperId: '01',
    titulo: 'Por qué fallan los go-live de Oracle Fusion',
    subtitulo: 'Research Note · FABRIC · 2026',
    tag: 'Research Note · Mercado',
    abstract: 'Análisis de patrones de fracaso en implementaciones LATAM: abandono post go-live, cierre contable como primera crisis, adopción débil, integraciones incompletas y reportes manuales paralelos.',
    meta: '8-10 pp · PDF ES · 15 min · May 2026',
    visible: true,
    orden: 1,
    toc: ["El patrón \"abandono post go-live\"", "Los tres síntomas iniciales", "Modelo de entrega FABRIC"],
  },
  {
    paperId: '02',
    titulo: 'IA aplicada a cierre contable en Fusion Cloud',
    subtitulo: 'Technical Framework · FABRIC · 2026',
    tag: 'Technical Framework · IA',
    abstract: 'Framework FABRIC para aplicar IA al cierre contable: anomalías, conciliación inteligente, predicción de pendientes, notas automatizadas y tablero ejecutivo predictivo.',
    meta: '10-12 pp · PDF ES · 20 min · May 2026',
    visible: true,
    orden: 2,
    toc: ["Anatomía del cierre contable", "Capa de agentes IA aplicables", "Casos APE Plazas + Aplazo"],
  },
  {
    paperId: '03',
    titulo: 'Modelo de entrega en primer ciclo crítico',
    subtitulo: 'Doctrina Operativa · FABRIC · 2026',
    tag: 'Doctrina Operativa · SOW',
    abstract: 'La doctrina contractual de FABRIC: definición de entrega en primer ciclo crítico, cláusulas modelo, fase STABILIZE, gobierno y documentación obligatoria.',
    meta: '6-8 pp · PDF ES · 12 min · May 2026',
    visible: true,
    orden: 3,
    toc: ["Las 5 cláusulas doctrinales", "Cómo redactarlas en RFP", "Validación legal y contractual"],
  },
];

async function ensureDefaultPapers() {
  const count = await PaperCatalog.countDocuments();
  if (!count) await PaperCatalog.insertMany(DEFAULT_PAPERS);
}

async function findPaper(paperId, includeHidden = false) {
  await ensureDefaultPapers();
  const query = { paperId };
  if (!includeHidden) query.visible = true;
  return PaperCatalog.findOne(query);
}

function str(val, max = 1000) {
  return String(val ?? '').trim().slice(0, max);
}

// ─── POST /api/papers/solicitar ───────────────────────────────────────────────
exports.solicitar = async (req, res) => {
  try {
    const { paperId, nombre, email, cargo, empresa, tracking } = req.body;

    const paper = await findPaper(paperId);
    if (!paper) return res.status(400).json({ error: 'Paper no válido.' });
    if (!email || !cargo || !empresa) {
      return res.status(400).json({ error: 'Email, cargo y empresa son requeridos.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(422).json({ error: 'Email no válido.' });
    }
    if (isPublicEmail(email)) {
      return res.status(422).json({ error: 'FABRIC trabaja con organizaciones. Usa tu correo corporativo.' });
    }

    // Anti-spam: misma persona + mismo paper en las últimas 24h
    const ventana24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const duplicado = await PaperAccess.findOne({
      email: email.toLowerCase(),
      paperId,
      createdAt: { $gte: ventana24h },
    });

    if (duplicado) {
      return res.status(200).json({
        ok: true,
        duplicate: true,
        message: 'Ya registramos tu solicitud. Revisa tu correo (incluyendo spam).',
        accessId: duplicado._id,
        downloadUrl: `/papers/download/${duplicado._id}`,
      });
    }

    const acceso = new PaperAccess({
      paperId,
      nombre:    nombre?.trim() || '',
      email:     email.toLowerCase().trim(),
      cargo:     cargo.trim(),
      empresa:   empresa.trim(),
      ipAddress: req.ip ?? '',
      tracking:  sanitizeTracking(tracking),
      status:    'descargado',
    });
    await acceso.save();

    log({
      accion:    `CREATE · Paper ${paperId} · ${empresa}`,
      categoria: 'Papers',
      autor:     'system',
      detalle:   paper.titulo,
    });

    return res.status(201).json({
      ok: true,
      message: `Datos registrados. Ya puedes descargar el Paper ${paperId}.`,
      paperId,
      paperTitle: paper.titulo,
      accessId: acceso._id,
      downloadUrl: `/papers/download/${acceso._id}`,
    });
  } catch (error) {
    console.error('🚨 papers.solicitar:', error);
    return res.status(500).json({ error: 'Error interno. Intenta de nuevo.' });
  }
};

// ─── GET /api/papers/catalog ──────────────────────────────────────────────────
exports.catalogoPublico = async (req, res) => {
  try {
    await ensureDefaultPapers();
    const papers = await PaperCatalog.find({ visible: true }).sort({ orden: 1, paperId: 1 });
    return res.json({ ok: true, data: papers });
  } catch (error) {
    console.error('🚨 papers.catalogoPublico:', error);
    return res.status(500).json({ error: 'Error obteniendo papers.' });
  }
};

// ─── GET /api/papers/catalog/:paperId ─────────────────────────────────────────
exports.detallePublico = async (req, res) => {
  try {
    const paper = await findPaper(req.params.paperId);
    if (!paper) return res.status(404).json({ error: 'Paper no encontrado.' });
    return res.json({ ok: true, data: paper });
  } catch (error) {
    console.error('🚨 papers.detallePublico:', error);
    return res.status(500).json({ error: 'Error obteniendo paper.' });
  }
};

// ─── GET /api/papers/download/:id ─────────────────────────────────────────────
exports.descargar = async (req, res) => {
  try {
    const acceso = await PaperAccess.findById(req.params.id);
    if (!acceso) return res.status(404).json({ error: 'Solicitud no encontrada.' });
    if (acceso.status === 'bloqueado') return res.status(403).json({ error: 'Acceso bloqueado.' });

    const pdfPath = ensureSimulatedPaperPdf(acceso.paperId);
    const filename = `FABRIC-Paper-${acceso.paperId}-DEMO.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.sendFile(pdfPath);
  } catch (error) {
    console.error('🚨 papers.descargar:', error);
    return res.status(500).json({ error: 'Error descargando paper.' });
  }
};

// ─── POST /api/papers/benchmark ───────────────────────────────────────────────
exports.benchmarkEarlyAccess = async (req, res) => {
  try {
    const { nombre, empresa, email, tracking } = req.body;

    if (!nombre || !empresa || !email) {
      return res.status(400).json({ error: 'Todos los campos son requeridos.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(422).json({ error: 'Email no válido.' });
    }
    if (isPublicEmail(email)) {
      return res.status(422).json({ error: 'FABRIC trabaja con organizaciones. Usa tu correo corporativo.' });
    }

    // Email único — si ya existe, responder sin error (evitar enumeración)
    const existente = await BenchmarkAccess.findOne({ email: email.toLowerCase() });
    if (existente) {
      return res.status(200).json({
        ok: true,
        duplicate: true,
        message: 'Ya tienes reservado tu early access. Te notificaremos al lanzamiento Q4 2026.',
      });
    }

    const acceso = new BenchmarkAccess({
      nombre:    nombre.trim(),
      empresa:   empresa.trim(),
      email:     email.toLowerCase().trim(),
      ipAddress: req.ip ?? '',
      tracking:  sanitizeTracking(tracking),
    });
    await acceso.save();

    log({
      accion:    `CREATE · Benchmark Early Access · ${empresa}`,
      categoria: 'Papers',
      autor:     'system',
    });

    return res.status(201).json({
      ok: true,
      message: 'Lugar reservado. Te notificaremos cuando el Benchmark Index se publique en Q4 2026.',
    });
  } catch (error) {
    console.error('🚨 papers.benchmarkEarlyAccess:', error);
    return res.status(500).json({ error: 'Error interno. Intenta de nuevo.' });
  }
};

// ─── GET /api/admin/papers ─────────────────────────────────────────────────────
exports.listarAccesos = async (req, res) => {
  try {
    const { status, paperId, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status)  query.status  = status;
    if (paperId) query.paperId = paperId;

    const total   = await PaperAccess.countDocuments(query);
    const accesos = await PaperAccess.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return res.json({ ok: true, total, page: Number(page), data: accesos });
  } catch (error) {
    console.error('🚨 papers.listarAccesos:', error);
    return res.status(500).json({ error: 'Error interno.' });
  }
};

// ─── GET /api/admin/papers/benchmark ─────────────────────────────────────────
exports.listarBenchmark = async (req, res) => {
  try {
    const total   = await BenchmarkAccess.countDocuments();
    const accesos = await BenchmarkAccess.find().sort({ createdAt: -1 }).limit(200);
    return res.json({ ok: true, total, data: accesos });
  } catch (error) {
    console.error('🚨 papers.listarBenchmark:', error);
    return res.status(500).json({ error: 'Error interno.' });
  }
};

// ─── GET /api/papers/admin/catalog ────────────────────────────────────────────
exports.catalogoAdmin = async (req, res) => {
  try {
    await ensureDefaultPapers();
    const papers = await PaperCatalog.find().sort({ orden: 1, paperId: 1 });
    return res.json({ ok: true, data: papers });
  } catch (error) {
    console.error('🚨 papers.catalogoAdmin:', error);
    return res.status(500).json({ error: 'Error obteniendo catálogo.' });
  }
};

// ─── PUT /api/papers/admin/catalog ────────────────────────────────────────────
exports.guardarCatalogo = async (req, res) => {
  try {
    const items = Array.isArray(req.body?.papers) ? req.body.papers : [];
    if (!items.length) return res.status(400).json({ error: 'Catálogo vacío.' });

    const clean = items
      .map((p, i) => ({
        paperId: str(p.paperId, 20),
        titulo: str(p.titulo, 200),
        subtitulo: str(p.subtitulo, 200),
        tag: str(p.tag, 120),
        abstract: str(p.abstract, 800),
        meta: str(p.meta, 120),
        visible: Boolean(p.visible),
        orden: Number.isFinite(Number(p.orden)) ? Number(p.orden) : i + 1,
        toc: Array.isArray(p.toc) ? p.toc.map(t => str(t, 200)) : [],
      }))
      .filter(p => p.paperId && p.titulo);

    if (!clean.length) return res.status(400).json({ error: 'Cada paper necesita ID y título.' });

    for (const item of clean) {
      await PaperCatalog.findOneAndUpdate({ paperId: item.paperId }, item, { upsert: true, new: true });
    }

    const keepIds = clean.map(p => p.paperId);
    await PaperCatalog.deleteMany({ paperId: { $nin: keepIds } });
    const papers = await PaperCatalog.find().sort({ orden: 1, paperId: 1 });
    return res.json({ ok: true, data: papers });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ error: 'Hay IDs de paper duplicados.' });
    console.error('🚨 papers.guardarCatalogo:', error);
    return res.status(500).json({ error: 'Error guardando catálogo.' });
  }
};

// ─── POST /api/papers/admin/:paperId/pdf ──────────────────────────────────────
exports.subirPdf = async (req, res) => {
  try {
    const { paperId } = req.params;
    const paper = await findPaper(paperId, true);
    if (!paper) return res.status(400).json({ error: 'Paper no válido.' });
    if (!req.file) {
      return res.status(400).json({ error: 'Archivo PDF requerido.' });
    }
    const isPdf = req.file.mimetype === 'application/pdf' || /\.pdf$/i.test(req.file.originalname || '');
    if (!isPdf) {
      return res.status(422).json({ error: 'Solo se aceptan archivos PDF.' });
    }

    const dir = path.join(__dirname, '..', 'assets', 'papers');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const pdfPath = path.join(dir, `paper-${paperId}.pdf`);
    fs.writeFileSync(pdfPath, req.file.buffer);

    log({
      accion:    `UPLOAD · Paper ${paperId} PDF`,
      categoria: 'Papers',
      autor:     req.auth?.userId || 'admin',
      detalle:   req.file.originalname || '',
    });

    return res.json({
      ok: true,
      message: `PDF del Paper ${paperId} actualizado.`,
      file: `paper-${paperId}.pdf`,
      bytes: req.file.size,
    });
  } catch (error) {
    console.error('🚨 papers.subirPdf:', error);
    return res.status(500).json({ error: 'Error subiendo PDF.' });
  }
};

// ─── PATCH /api/admin/papers/:id/status ──────────────────────────────────────
exports.actualizarStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['descargado', 'pendiente', 'enviado', 'bloqueado'].includes(status)) {
      return res.status(400).json({ error: 'Estado no válido.' });
    }

    const acceso = await PaperAccess.findById(id);
    if (!acceso) return res.status(404).json({ error: 'Solicitud no encontrada.' });

    // Verificar PDF antes de marcar como enviado
    if (status === 'enviado') {
      const pdfPath = ensureSimulatedPaperPdf(acceso.paperId);
      if (!fs.existsSync(pdfPath)) {
        return res.status(409).json({
          error: `PDF paper-${acceso.paperId}.pdf no encontrado. Colócalo en Backend/assets/papers/ antes de enviar.`,
        });
      }
    }

    acceso.status = status;
    if (status === 'enviado') acceso.emailSent = true;
    await acceso.save();

    if (status === 'enviado') {
      sendPaperEntrega({
        empresa: acceso.empresa,
        email:   acceso.email,
        paperId: acceso.paperId,
      }).catch(err => console.error('🚨 papers.sendPaperEntrega:', err.message));
    }

    log({
      accion:    `${status.toUpperCase()} · Paper ${acceso.paperId} · ${acceso.empresa}`,
      categoria: 'Papers',
      autor:     'admin',
      status:    status === 'bloqueado' ? 'WARN' : 'OK',
    });

    return res.json({ ok: true, data: acceso });
  } catch (error) {
    console.error('🚨 papers.actualizarStatus:', error);
    return res.status(500).json({ error: 'Error interno.' });
  }
};
