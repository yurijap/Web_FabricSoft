const TransparenciaConfig = require('../models/model.transparencia');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getSingleton() {
  let doc = await TransparenciaConfig.findOne();
  if (!doc) doc = await TransparenciaConfig.create({});
  return doc;
}

function sortBy(arr) {
  return [...arr].sort((a, b) => (a.orden || 0) - (b.orden || 0));
}

function latestAudit(arr) {
  return [...(arr || [])]
    .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0))
    .slice(0, 50);
}

// Sanitize string — trim y máximo de longitud
function str(val, max = 1000) {
  return String(val ?? '').trim().slice(0, max);
}

const ESTADOS_EDITORIALES = ['borrador', 'revision', 'aprobada_interna', 'verificada_cliente', 'publicada', 'retirada'];
const RIESGOS = ['bajo', 'medio', 'alto'];
const EVIDENCIA_TIPOS = ['acta', 'reporte', 'contrato', 'certificacion', 'correo_cliente', 'portal', 'otro'];
const EVIDENCIA_ESTADOS = ['simulada', 'pendiente', 'disponible_nda', 'validada'];

function enumVal(val, allowed, fallback) {
  return allowed.includes(val) ? val : fallback;
}

function isoDateOrUndefined(val) {
  if (!val) return undefined;
  const date = new Date(val);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function sanitizePublicada(item, index) {
  return {
    label:               str(item.label, 200),
    valor:               str(item.valor, 100),
    unidad:              str(item.unidad, 100),
    metodologia:         str(item.metodologia, 2000),
    definicion:          str(item.definicion, 1200),
    universo:            str(item.universo, 1200),
    n:                   str(item.n, 120),
    formula:             str(item.formula, 1200),
    validacion:          str(item.validacion, 1200),
    auditoria:           str(item.auditoria, 1200),
    editorialEstado:     enumVal(item.editorialEstado, ESTADOS_EDITORIALES, 'borrador'),
    riesgo:              enumVal(item.riesgo, RIESGOS, 'medio'),
    evidencia: {
      titulo: str(item.evidencia?.titulo, 200),
      tipo:   enumVal(item.evidencia?.tipo, EVIDENCIA_TIPOS, 'otro'),
      estado: enumVal(item.evidencia?.estado, EVIDENCIA_ESTADOS, 'pendiente'),
      fecha:  isoDateOrUndefined(item.evidencia?.fecha),
      notas:  str(item.evidencia?.notas, 1000),
    },
    periodo:             str(item.periodo, 100),
    fuente: {
      tipo:        ['interna', 'auditoria_externa', 'cliente'].includes(item.fuente?.tipo)
                     ? item.fuente.tipo
                     : 'interna',
      descripcion: str(item.fuente?.descripcion, 300),
    },
    verificadoPor:       str(item.verificadoPor, 200),
    ultimaActualizacion: item.ultimaActualizacion
                           ? new Date(item.ultimaActualizacion)
                           : new Date(),
    visible:             Boolean(item.visible),
    verified:            Boolean(item.verified),
    proximaRevision:     isoDateOrUndefined(item.proximaRevision),
    notaInterna:         str(item.notaInterna, 1500),
    orden:               Number.isFinite(Number(item.orden)) ? Number(item.orden) : index + 1,
  };
}

function metodologiaFallback(p) {
  return {
    definicion: p.definicion || p.metodologia || 'Definición documentada en metodología pública FABRIC.',
    universo:   p.universo || 'Universo verificable indicado por fuente y período de la métrica.',
    n:          p.n || 'N documentado bajo NDA',
    formula:    p.formula || p.metodologia || 'Cálculo documentado en metodología pública FABRIC.',
    validacion: p.validacion || 'Evidencia disponible bajo NDA mutuo para prospectos calificados.',
    auditoria:  p.auditoria || 'Revisión interna formal FABRIC.',
  };
}

function normalizeForDiff(item) {
  if (!item) return null;
  return {
    label: item.label || '',
    valor: item.valor || '',
    unidad: item.unidad || '',
    metodologia: item.metodologia || '',
    definicion: item.definicion || '',
    universo: item.universo || '',
    n: item.n || '',
    formula: item.formula || '',
    validacion: item.validacion || '',
    auditoria: item.auditoria || '',
    editorialEstado: item.editorialEstado || 'borrador',
    riesgo: item.riesgo || 'medio',
    evidencia: {
      titulo: item.evidencia?.titulo || '',
      tipo: item.evidencia?.tipo || 'otro',
      estado: item.evidencia?.estado || 'pendiente',
      fecha: item.evidencia?.fecha ? new Date(item.evidencia.fecha).toISOString().slice(0, 10) : '',
      notas: item.evidencia?.notas || '',
    },
    periodo: item.periodo || '',
    fuente: {
      tipo: item.fuente?.tipo || 'interna',
      descripcion: item.fuente?.descripcion || '',
    },
    verificadoPor: item.verificadoPor || '',
    ultimaActualizacion: item.ultimaActualizacion ? new Date(item.ultimaActualizacion).toISOString().slice(0, 10) : '',
    visible: Boolean(item.visible),
    verified: Boolean(item.verified),
    proximaRevision: item.proximaRevision ? new Date(item.proximaRevision).toISOString().slice(0, 10) : '',
    notaInterna: item.notaInterna || '',
  };
}

function buildAuditEntries(beforePublicadas, afterPublicadas, autor) {
  const beforeByKey = new Map(beforePublicadas.map((item, index) => [String(item._id || item.label || index), item]));
  return afterPublicadas.flatMap((item, index) => {
    const key = String(item._id || item.label || index);
    const before = beforeByKey.get(key);
    if (!before) {
      return [{ autor, accion: 'métrica creada', detalle: item.label }];
    }
    const prev = normalizeForDiff(before);
    const next = normalizeForDiff(item);
    const changed = Object.keys(next).filter(field => JSON.stringify(prev[field]) !== JSON.stringify(next[field]));
    if (!changed.length) return [];
    return [{
      autor,
      accion: 'métrica actualizada',
      detalle: `${item.label}: ${changed.slice(0, 8).join(', ')}${changed.length > 8 ? '...' : ''}`,
    }];
  });
}

function sanitizeProxima(item, index) {
  return {
    label:         str(item.label, 200),
    fechaObjetivo: str(item.fechaObjetivo, 100),
    descripcion:   str(item.descripcion, 500),
    visible:       Boolean(item.visible),
    orden:         Number.isFinite(Number(item.orden)) ? Number(item.orden) : index + 1,
  };
}

function sanitizeCompromiso(item, index) {
  return {
    titulo: str(item.titulo, 200),
    cuerpo: str(item.cuerpo, 2000),
    orden:  Number.isFinite(Number(item.orden)) ? Number(item.orden) : index + 1,
  };
}

// ---------------------------------------------------------------------------
// GET /api/transparencia  — público
// Regla: publicadas solo si visible === true && verified === true
//        proximas solo si visible === true
//        compromisos todos
// ---------------------------------------------------------------------------
exports.listarPublico = async (req, res) => {
  try {
    const doc = await getSingleton();

    const publicadas = sortBy(doc.publicadas)
      .filter(p => p.visible && p.verified && (!p.editorialEstado || p.editorialEstado === 'publicada'))
      .map((p, i) => ({
        ...metodologiaFallback(p),
        id:                  String(i + 1).padStart(2, '0'),
        label:               p.label,
        valor:               p.valor,
        unidad:              p.unidad,
        metodologia:         p.metodologia,
        periodo:             p.periodo,
        fuente:              { tipo: p.fuente?.tipo, descripcion: p.fuente?.descripcion },
        verificadoPor:       p.verificadoPor,
        ultimaActualizacion: p.ultimaActualizacion,
      }));

    const proximas = sortBy(doc.proximas)
      .filter(p => p.visible)
      .map(p => ({
        id:            p._id,
        label:         p.label,
        fechaObjetivo: p.fechaObjetivo,
        descripcion:   p.descripcion,
      }));

    const compromisos = sortBy(doc.compromisos).map((c, i) => ({
      id:     String(i + 1).padStart(2, '0'),
      titulo: c.titulo,
      cuerpo: c.cuerpo,
    }));

    res.json({
      ok: true,
      data: {
        publicadas,
        proximas,
        compromisos,
        ultimaActualizacion: doc.updatedAt,
      },
    });
  } catch (err) {
    console.error('transparencia.listarPublico error:', err);
    res.status(500).json({ error: 'Error obteniendo datos de transparencia.' });
  }
};

// ---------------------------------------------------------------------------
// GET /api/transparencia/admin  — privado
// Devuelve todos los campos incluyendo visible, verified y _id
// ---------------------------------------------------------------------------
exports.listarAdmin = async (req, res) => {
  try {
    const doc = await getSingleton();
    res.json({
      ok: true,
      data: {
        publicadas:  sortBy(doc.publicadas),
        proximas:    sortBy(doc.proximas),
        compromisos: sortBy(doc.compromisos),
        auditLog:    latestAudit(doc.auditLog),
        ultimaActualizacion: doc.updatedAt,
      },
    });
  } catch (err) {
    console.error('transparencia.listarAdmin error:', err);
    res.status(500).json({ error: 'Error obteniendo datos de transparencia.' });
  }
};

// ---------------------------------------------------------------------------
// PUT /api/transparencia/admin  — privado
// ---------------------------------------------------------------------------
exports.actualizar = async (req, res) => {
  try {
    const { publicadas, proximas, compromisos } = req.body;
    const doc = await getSingleton();
    const beforePublicadas = sortBy(doc.publicadas).map(item => item.toObject ? item.toObject() : item);
    const autor = req.auth?.userId || req.user?.id || 'admin';

    if (Array.isArray(publicadas)) {
      const clean = publicadas
        .map((item, i) => sanitizePublicada(item, i))
        .filter(item => item.label && item.valor && item.unidad);
      if (!clean.length) {
        return res.status(400).json({ error: 'publicadas no puede quedar vacío.' });
      }
      doc.publicadas = clean;
      const entries = buildAuditEntries(beforePublicadas, clean, autor);
      if (entries.length) {
        doc.auditLog.push(...entries);
        doc.auditLog = doc.auditLog.slice(-100);
      }
    }

    if (Array.isArray(proximas)) {
      const clean = proximas
        .map((item, i) => sanitizeProxima(item, i))
        .filter(item => item.label && item.fechaObjetivo);
      doc.proximas = clean;
    }

    if (Array.isArray(compromisos)) {
      const clean = compromisos
        .map((item, i) => sanitizeCompromiso(item, i))
        .filter(item => item.titulo && item.cuerpo);
      if (!clean.length) {
        return res.status(400).json({ error: 'compromisos no puede quedar vacío.' });
      }
      doc.compromisos = clean;
    }

    await doc.save();

    res.json({
      ok: true,
      data: {
        publicadas:  sortBy(doc.publicadas),
        proximas:    sortBy(doc.proximas),
        compromisos: sortBy(doc.compromisos),
        auditLog:    latestAudit(doc.auditLog),
        ultimaActualizacion: doc.updatedAt,
      },
    });
  } catch (err) {
    console.error('transparencia.actualizar error:', err);
    res.status(500).json({ error: 'Error actualizando transparencia.' });
  }
};

// ---------------------------------------------------------------------------
// POST /api/transparencia/admin/reset  — privado
// ---------------------------------------------------------------------------
exports.restaurarDefaults = async (req, res) => {
  try {
    const doc = await getSingleton();
    const defaults = TransparenciaConfig.defaults();
    doc.publicadas  = defaults.publicadas;
    doc.proximas    = defaults.proximas;
    doc.compromisos = defaults.compromisos;
    doc.auditLog.push({
      autor: req.auth?.userId || req.user?.id || 'admin',
      accion: 'defaults restaurados',
      detalle: 'Se restauró la configuración editorial base de transparencia.',
    });
    doc.auditLog = doc.auditLog.slice(-100);
    await doc.save();

    res.json({
      ok: true,
      data: {
        publicadas:  sortBy(doc.publicadas),
        proximas:    sortBy(doc.proximas),
        compromisos: sortBy(doc.compromisos),
        auditLog:    latestAudit(doc.auditLog),
        ultimaActualizacion: doc.updatedAt,
      },
    });
  } catch (err) {
    console.error('transparencia.restaurarDefaults error:', err);
    res.status(500).json({ error: 'Error restaurando defaults.' });
  }
};
