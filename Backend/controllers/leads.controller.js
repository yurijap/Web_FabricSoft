const Lead        = require('../models/model.lead');
const emailService = require('../services/email.service');
const { log }     = require('../services/log.service');
const { sanitizeTracking } = require('../utils/tracking');

const PUBLIC_DOMAINS = ['gmail','hotmail','yahoo','outlook','icloud','live','msn','me','proton'];
const VALID_STATUSES = ['Nuevo', 'Aprobado', 'WaitList', 'Revisión', 'Rechazado'];
const QUALIFIED_INDUSTRIES = ['financiero', 'inmobiliario', 'logistica'];

function isPublicEmail(email) {
  const domain = (email.split('@')[1] || '').split('.')[0].toLowerCase();
  return PUBLIC_DOMAINS.includes(domain);
}

function calcScore({ revenue = '', industria = '', plazo = '', iniciativa = '' }) {
  let score = 0;

  const rev = revenue.toLowerCase();
  if (rev.includes('500') || rev.includes('1b') || rev.includes('1,0')) score += 35;
  else if (rev.includes('250') || rev.includes('200')) score += 28;
  else if (rev.includes('100') || rev.includes('150')) score += 20;
  else if (rev.includes('50') || rev.includes('75')) score += 10;

  if (QUALIFIED_INDUSTRIES.includes(industria)) score += 25;

  if (plazo === '<3 meses') score += 25;
  else if (plazo === '3-6 meses') score += 15;
  else if (plazo === '6-12 meses') score += 5;

  if (iniciativa.length > 100) score += 10;
  else if (iniciativa.length > 50) score += 5;

  return Math.min(score, 95);
}

function nowLabel() {
  return new Date().toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

exports.solicitar = async (req, res) => {
  try {
    const { nombre, cargo, empresa, revenue, email, industria, iniciativa, plazo, tracking } = req.body;

    if (!nombre?.trim() || nombre.trim().length < 2)
      return res.status(400).json({ error: 'Nombre requerido.' });
    if (!cargo?.trim() || cargo.trim().length < 2)
      return res.status(400).json({ error: 'Cargo requerido.' });
    if (!empresa?.trim())
      return res.status(400).json({ error: 'Empresa requerida.' });
    if (!email || !email.includes('@'))
      return res.status(400).json({ error: 'Email inválido.' });
    if (isPublicEmail(email))
      return res.status(400).json({ error: 'Usa tu correo corporativo.' });
    if (!iniciativa || iniciativa.trim().length < 10)
      return res.status(400).json({ error: 'Describe la iniciativa Oracle (mínimo 10 caracteres).' });
    if (!plazo)
      return res.status(400).json({ error: 'Selecciona un plazo de decisión.' });

    const score = calcScore({ revenue, industria, plazo, iniciativa: iniciativa.trim() });
    const isQualified = QUALIFIED_INDUSTRIES.includes(industria);
    const status = isQualified ? 'Nuevo' : 'WaitList';

    const lead = await Lead.create({
      nombre:     nombre.trim(),
      cargo:      cargo.trim(),
      empresa:    empresa.trim(),
      revenue:    (revenue || '').trim(),
      email:      email.trim().toLowerCase(),
      industria:  industria || '',
      iniciativa: iniciativa.trim(),
      plazo,
      source:     'aplicar',
      score,
      status,
      ipAddress:  req.ip || '',
      historial:  [{ fecha: nowLabel(), estado: status, autor: 'Sistema' }],
      tracking:   sanitizeTracking(tracking),
    });

    emailService.sendConfirmacionAplicar({
      nombre:  lead.nombre,
      empresa: lead.empresa,
      email:   lead.email,
      status:  lead.status,
    }).catch(e => console.error('email.aplicar error:', e.message));

    log({
      accion:    `CREATE · Lead · ${lead.empresa}`,
      categoria: 'Leads',
      autor:     'system',
      status:    lead.status === 'WaitList' ? 'WARN' : 'OK',
      detalle:   `${lead.nombre} · ${lead.cargo} · ${lead.plazo}`,
    });

    res.status(201).json({ ok: true, data: lead });
  } catch (err) {
    console.error('leads.solicitar error:', err);
    res.status(500).json({ error: 'Error interno al guardar la solicitud.' });
  }
};

exports.listarLeads = async (req, res) => {
  try {
    const { status, industria, page = 1, limit = 100 } = req.query;
    const filter = {};
    if (status && status !== 'Todos') filter.status = status;
    if (industria && industria !== 'Todas') filter.industria = industria.toLowerCase();

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Lead.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Lead.countDocuments(filter),
    ]);

    res.json({ ok: true, data, total });
  } catch (err) {
    console.error('leads.listarLeads error:', err);
    res.status(500).json({ error: 'Error listando leads.' });
  }
};

exports.actualizarStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status))
      return res.status(400).json({ error: 'Status inválido.' });

    const lead = await Lead.findByIdAndUpdate(
      id,
      {
        status,
        $push: { historial: { fecha: nowLabel(), estado: status, autor: 'Admin' } },
      },
      { new: true },
    );

    if (!lead) return res.status(404).json({ error: 'Lead no encontrado.' });

    log({
      accion:    `${status.toUpperCase()} · Lead · ${lead.empresa}`,
      categoria: 'Leads',
      autor:     'admin',
      status:    status === 'Rechazado' ? 'WARN' : 'OK',
    });

    res.json({ ok: true, data: lead });
  } catch (err) {
    console.error('leads.actualizarStatus error:', err);
    res.status(500).json({ error: 'Error actualizando status.' });
  }
};

exports.actualizarNotas = async (req, res) => {
  try {
    const { id } = req.params;
    const { notas } = req.body;

    const lead = await Lead.findByIdAndUpdate(id, { notas: notas ?? '' }, { new: true });
    if (!lead) return res.status(404).json({ error: 'Lead no encontrado.' });
    res.json({ ok: true, data: lead });
  } catch (err) {
    console.error('leads.actualizarNotas error:', err);
    res.status(500).json({ error: 'Error actualizando notas.' });
  }
};

exports.solicitarWaitlist = async (req, res) => {
  try {
    const { nombre, cargo, empresa, email, revenue, iniciativa, plazo, tracking } = req.body;

    if (!nombre?.trim()) return res.status(400).json({ error: 'Nombre requerido.' });
    if (!empresa?.trim()) return res.status(400).json({ error: 'Empresa requerida.' });
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Email inválido.' });
    if (isPublicEmail(email)) return res.status(400).json({ error: 'Usa tu correo corporativo.' });

    const lead = await Lead.create({
      nombre: nombre.trim(),
      cargo:  cargo?.trim() || 'No especificado',
      empresa: empresa.trim(),
      revenue: revenue?.trim() || '',
      email:  email.trim().toLowerCase(),
      iniciativa: iniciativa?.trim() || '',
      plazo: plazo?.trim() || '',
      source: 'waitlist',
      score: calcScore({ revenue: revenue || '', plazo: plazo || '', iniciativa: iniciativa || '' }),
      status: 'WaitList',
      ipAddress: req.ip || '',
      historial: [{ fecha: nowLabel(), estado: 'WaitList', autor: 'Sistema' }],
      tracking: sanitizeTracking(tracking),
    });

    emailService.sendConfirmacionWaitlist({
      nombre:  lead.nombre,
      empresa: lead.empresa,
      email:   lead.email,
    }).catch(e => console.error('email.waitlist error:', e.message));

    log({
      accion:    `CREATE · WaitList · ${lead.empresa}`,
      categoria: 'Leads',
      autor:     'system',
      status:    'OK',
      detalle:   `${lead.nombre} · waitlist Q3 2026`,
    });

    res.status(201).json({ ok: true, data: lead });
  } catch (err) {
    console.error('leads.solicitarWaitlist error:', err);
    res.status(500).json({ error: 'Error interno al guardar solicitud.' });
  }
};

exports.solicitarReferencia = async (req, res) => {
  try {
    const { nombre, cargo, empresa, email, revenue, iniciativa, tracking } = req.body;

    if (!nombre?.trim())     return res.status(400).json({ error: 'Nombre requerido.' });
    if (!cargo?.trim())      return res.status(400).json({ error: 'Cargo requerido.' });
    if (!empresa?.trim())    return res.status(400).json({ error: 'Empresa requerida.' });
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Email inválido.' });
    if (isPublicEmail(email)) return res.status(400).json({ error: 'Usa tu correo corporativo.' });
    if (!iniciativa?.trim()) return res.status(400).json({ error: 'Describe tu iniciativa Oracle.' });

    const score = calcScore({ revenue: revenue || '', iniciativa: iniciativa.trim() });

    const lead = await Lead.create({
      nombre:     nombre.trim(),
      cargo:      cargo.trim(),
      empresa:    empresa.trim(),
      email:      email.trim().toLowerCase(),
      revenue:    revenue || '',
      iniciativa: iniciativa.trim(),
      score,
      source:     'referencia',
      status:     'Nuevo',
      ipAddress:  req.ip || '',
      historial:  [{ fecha: nowLabel(), estado: 'Nuevo', autor: 'Sistema' }],
      tracking:   sanitizeTracking(tracking),
    });

    emailService.sendConfirmacionReferencia({
      nombre:  lead.nombre,
      empresa: lead.empresa,
      email:   lead.email,
    }).catch(e => console.error('email.referencia error:', e.message));

    res.status(201).json({ ok: true, data: lead });
  } catch (err) {
    console.error('leads.solicitarReferencia error:', err);
    res.status(500).json({ error: 'Error interno al guardar solicitud.' });
  }
};

exports.solicitarMigrationRoadmap = async (req, res) => {
  try {
    const {
      nombre, cargo, empresa, email,
      sistema, modulos, industria, geografia, plazo, compliance,
      patrocinio, presupuesto, integraciones, datos, equipo, experiencia,
      riskLevel, estimatedTimeline,
      tracking,
    } = req.body;

    if (!nombre?.trim()) return res.status(400).json({ error: 'Nombre requerido.' });
    if (!cargo?.trim())  return res.status(400).json({ error: 'Cargo requerido.' });
    if (!empresa?.trim()) return res.status(400).json({ error: 'Empresa requerida.' });
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Email inválido.' });
    if (isPublicEmail(email)) return res.status(400).json({ error: 'Usa tu correo corporativo.' });
    if (!sistema) return res.status(400).json({ error: 'Sistema de origen requerido.' });
    if (!riskLevel) return res.status(400).json({ error: 'Nivel de riesgo requerido.' });

    const industriaMap = {
      'Servicios Financieros / Fintech': 'financiero',
      'Inmobiliario / Centros Comerciales': 'inmobiliario',
      'Logística / Distribución': 'logistica',
    };
    const industriaNorm = industriaMap[industria] || '';

    const iniciativa = [
      `Migration Roadmap: ${sistema}.`,
      industria ? `Industria: ${industria}.` : '',
      modulos?.length ? `Módulos: ${Array.isArray(modulos) ? modulos.join(', ') : modulos}.` : '',
      `Riesgo: ${riskLevel}. Plazo estimado: ${estimatedTimeline}.`,
    ].filter(Boolean).join(' ');

    const score = calcScore({
      revenue:    '',
      industria:  industriaNorm,
      plazo:      plazo === 'Próximos 3 meses' ? '<3 meses' : plazo === 'En 3 – 6 meses' ? '3-6 meses' : '6-12 meses',
      iniciativa,
    });

    const lead = await Lead.create({
      nombre:    nombre.trim(),
      cargo:     cargo.trim(),
      empresa:   empresa.trim(),
      email:     email.trim().toLowerCase(),
      industria: industriaNorm,
      iniciativa,
      plazo:     plazo || '',
      source:    'migration-roadmap',
      score,
      status:    'Nuevo',
      ipAddress: req.ip || '',
      historial: [{ fecha: nowLabel(), estado: 'Nuevo', autor: 'Sistema' }],
      tracking:  sanitizeTracking(tracking),
      migrationRoadmap: {
        sistema:       sistema || '',
        modulos:       Array.isArray(modulos) ? modulos : [],
        industria:     industria || '',
        geografia:     geografia || '',
        plazo:         plazo || '',
        compliance:    compliance || '',
        patrocinio:    patrocinio || '',
        presupuesto:   presupuesto || '',
        integraciones: integraciones || '',
        datos:         datos || '',
        equipo:        equipo || '',
        experiencia:   experiencia || '',
        riskLevel:     riskLevel || '',
        estimatedTimeline: estimatedTimeline || '',
      },
    });

    log({
      accion:    `CREATE · Migration Roadmap · ${lead.empresa}`,
      categoria: 'Leads',
      autor:     'system',
      status:    'OK',
      detalle:   `${lead.nombre} · ${sistema} → Fusion · Riesgo: ${riskLevel}`,
    });

    res.status(201).json({ ok: true, data: lead });
  } catch (err) {
    console.error('leads.solicitarMigrationRoadmap error:', err);
    res.status(500).json({ error: 'Error interno al guardar el roadmap.' });
  }
};

exports.solicitarOfficeHours = async (req, res) => {
  try {
    const { nombre, cargo, empresa, email, iniciativaOracle, tracking } = req.body;

    if (!nombre?.trim())  return res.status(400).json({ error: 'Nombre requerido.' });
    if (!cargo?.trim())   return res.status(400).json({ error: 'Cargo requerido.' });
    if (!empresa?.trim()) return res.status(400).json({ error: 'Empresa requerida.' });
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Email inválido.' });
    if (isPublicEmail(email)) return res.status(400).json({ error: 'Usa tu correo corporativo.' });

    const iniciativa = iniciativaOracle?.trim()
      ? `Office Hours: ${iniciativaOracle.trim()}`
      : 'Office Hours: solicitud de sesión.';

    const score = calcScore({ revenue: '', industria: '', plazo: '', iniciativa });

    const lead = await Lead.create({
      nombre:    nombre.trim(),
      cargo:     cargo.trim(),
      empresa:   empresa.trim(),
      email:     email.trim().toLowerCase(),
      iniciativa,
      source:    'office-hours',
      score,
      status:    'Nuevo',
      ipAddress: req.ip || '',
      historial: [{ fecha: nowLabel(), estado: 'Nuevo', autor: 'Sistema' }],
      tracking:  sanitizeTracking(tracking),
      officeHours: { iniciativaOracle: iniciativaOracle?.trim() || '' },
    });

    log({
      accion:    `CREATE · Office Hours · ${lead.empresa}`,
      categoria: 'Leads',
      autor:     'system',
      status:    'OK',
      detalle:   `${lead.nombre} · ${lead.email}`,
    });

    res.status(201).json({ ok: true, data: lead });
  } catch (err) {
    console.error('leads.solicitarOfficeHours error:', err);
    res.status(500).json({ error: 'Error interno al guardar la solicitud.' });
  }
};

exports.solicitarReadinessScore = async (req, res) => {
  try {
    const {
      nombre, cargo, empresa, email,
      respuestas, scoreTotal, nivel,
      tracking,
    } = req.body;

    if (!nombre?.trim())  return res.status(400).json({ error: 'Nombre requerido.' });
    if (!cargo?.trim())   return res.status(400).json({ error: 'Cargo requerido.' });
    if (!empresa?.trim()) return res.status(400).json({ error: 'Empresa requerida.' });
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Email inválido.' });
    if (isPublicEmail(email)) return res.status(400).json({ error: 'Usa tu correo corporativo.' });
    if (typeof scoreTotal !== 'number') return res.status(400).json({ error: 'Score requerido.' });
    if (!nivel) return res.status(400).json({ error: 'Nivel requerido.' });

    const iniciativa = `Oracle Readiness Score: ${scoreTotal}/100 · Nivel: ${nivel}.`;

    const leadScore = calcScore({
      revenue: '',
      industria: '',
      plazo: '',
      iniciativa,
    });

    const lead = await Lead.create({
      nombre:    nombre.trim(),
      cargo:     cargo.trim(),
      empresa:   empresa.trim(),
      email:     email.trim().toLowerCase(),
      iniciativa,
      source:    'readiness-score',
      score:     leadScore,
      status:    'Nuevo',
      ipAddress: req.ip || '',
      historial: [{ fecha: nowLabel(), estado: 'Nuevo', autor: 'Sistema' }],
      tracking:  sanitizeTracking(tracking),
      readinessScore: {
        patrocinio:    respuestas?.patrocinio    || '',
        presupuesto:   respuestas?.presupuesto   || '',
        procesos:      respuestas?.procesos      || '',
        datos:         respuestas?.datos         || '',
        equipo:        respuestas?.equipo        || '',
        integraciones: respuestas?.integraciones || '',
        plazo:         respuestas?.plazo         || '',
        usuarios:      respuestas?.usuarios      || '',
        compliance:    respuestas?.compliance    || '',
        experiencia:   respuestas?.experiencia   || '',
        consultora:    respuestas?.consultora    || '',
        alcance:       respuestas?.alcance       || '',
        gobierno:      respuestas?.gobierno      || '',
        ciclo:         respuestas?.ciclo         || '',
        comunicacion:  respuestas?.comunicacion  || '',
        scoreTotal,
        nivel,
      },
    });

    log({
      accion:    `CREATE · Readiness Score · ${lead.empresa}`,
      categoria: 'Leads',
      autor:     'system',
      status:    'OK',
      detalle:   `${lead.nombre} · Score: ${scoreTotal}/100 · Nivel: ${nivel}`,
    });

    res.status(201).json({ ok: true, data: lead });
  } catch (err) {
    console.error('leads.solicitarReadinessScore error:', err);
    res.status(500).json({ error: 'Error interno al guardar el readiness score.' });
  }
};
