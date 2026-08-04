const CloudComparatorLead = require('../models/model.cloudComparatorLead');
const { log } = require('../services/log.service');
const { sanitizeTracking } = require('../utils/tracking');

const PUBLIC_DOMAINS = ['gmail', 'hotmail', 'yahoo', 'outlook', 'icloud', 'live', 'msn', 'me', 'proton'];
const VALID_STATUSES = ['Nuevo', 'Revision', 'Aprobado', 'WaitList', 'Rechazado'];

function isPublicEmail(email = '') {
  const domain = (email.split('@')[1] || '').split('.')[0].toLowerCase();
  return PUBLIC_DOMAINS.includes(domain);
}

function asNumber(value) {
  const next = Number(value);
  if (!Number.isFinite(next)) return 0;
  return Math.max(0, next);
}

function nowLabel() {
  return new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function calcCloudComparatorScore({ monthlySpend = 0, criticalApplication = '', objective = '', workload = '' }) {
  let score = 35;

  if (monthlySpend >= 100000) score += 35;
  else if (monthlySpend >= 50000) score += 28;
  else if (monthlySpend >= 25000) score += 20;
  else if (monthlySpend >= 10000) score += 12;

  if (/SAP|Oracle|Dynamics|NetSuite/i.test(criticalApplication)) score += 15;
  if (/business case|migrar|migracion|OCI|sobrecostos|reducir/i.test(objective)) score += 10;
  if (String(workload).trim().length >= 40) score += 5;

  return Math.min(score, 98);
}

exports.submit = async (req, res) => {
  try {
    const {
      nombre,
      cargo,
      empresa,
      email,
      telefono,
      cloudProvider,
      monthlySpend,
      analysisPeriod,
      criticalApplication,
      objective,
      workload,
      breakdown = {},
      ndaAccepted,
      tracking,
    } = req.body;

    const spend = asNumber(monthlySpend);

    if (!nombre?.trim()) return res.status(400).json({ error: 'Nombre requerido.' });
    if (!cargo?.trim()) return res.status(400).json({ error: 'Cargo requerido.' });
    if (!empresa?.trim()) return res.status(400).json({ error: 'Empresa requerida.' });
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Email invalido.' });
    if (isPublicEmail(email)) return res.status(400).json({ error: 'Usa tu correo corporativo.' });
    if (!cloudProvider?.trim()) return res.status(400).json({ error: 'Selecciona tu cloud actual.' });
    if (spend <= 0) return res.status(400).json({ error: 'Captura un gasto mensual aproximado.' });
    if (!criticalApplication?.trim()) return res.status(400).json({ error: 'Selecciona la aplicacion critica.' });
    if (!objective?.trim()) return res.status(400).json({ error: 'Selecciona el objetivo del analisis.' });
    if (!workload?.trim() || workload.trim().length < 10) {
      return res.status(400).json({ error: 'Describe brevemente tu workload principal.' });
    }
    if (!ndaAccepted) return res.status(400).json({ error: 'Debes aceptar la revision bajo NDA.' });

    const score = calcCloudComparatorScore({
      monthlySpend: spend,
      criticalApplication,
      objective,
      workload,
    });
    const status = score >= 65 ? 'Nuevo' : 'WaitList';

    const lead = await CloudComparatorLead.create({
      nombre: nombre.trim(),
      cargo: cargo.trim(),
      empresa: empresa.trim(),
      email: email.trim().toLowerCase(),
      telefono: telefono?.trim() || '',
      provider: cloudProvider.trim(),
      monthlySpend: spend,
      analysisPeriod: analysisPeriod?.trim() || '',
      criticalApplication: criticalApplication.trim(),
      objective: objective.trim(),
      workload: workload.trim(),
      breakdown: {
        compute: asNumber(breakdown.compute),
        storage: asNumber(breakdown.storage),
        database: asNumber(breakdown.database),
        networking: asNumber(breakdown.networking),
        other: asNumber(breakdown.other),
      },
      ndaAccepted: Boolean(ndaAccepted),
      score,
      status,
      ipAddress: req.ip || '',
      historial: [{ fecha: nowLabel(), estado: status, autor: 'Sistema' }],
      tracking: sanitizeTracking(tracking),
    });

    log({
      accion: `CREATE - Cloud Comparator - ${lead.empresa}`,
      categoria: 'Cloud Comparator',
      autor: 'system',
      status: status === 'WaitList' ? 'WARN' : 'OK',
      detalle: `${lead.nombre} - ${lead.cargo} - USD ${spend}`,
    });

    res.status(201).json({ ok: true, data: lead });
  } catch (err) {
    console.error('cloudComparator.submit error:', err);
    res.status(500).json({ error: 'Error interno al guardar la solicitud.' });
  }
};

exports.listAdmin = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);

    if (status && status !== 'Todos') filter.status = status;

    const [data, total] = await Promise.all([
      CloudComparatorLead.find(filter)
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      CloudComparatorLead.countDocuments(filter),
    ]);

    res.json({ ok: true, data, total });
  } catch (err) {
    console.error('cloudComparator.listAdmin error:', err);
    res.status(500).json({ error: 'Error listando solicitudes Cloud Comparator.' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Status invalido.' });
    }

    const lead = await CloudComparatorLead.findByIdAndUpdate(
      id,
      {
        status,
        $push: { historial: { fecha: nowLabel(), estado: status, autor: 'Admin' } },
      },
      { new: true }
    );

    if (!lead) return res.status(404).json({ error: 'Solicitud no encontrada.' });

    log({
      accion: `${status.toUpperCase()} - Cloud Comparator - ${lead.empresa}`,
      categoria: 'Cloud Comparator',
      autor: 'admin',
      status: status === 'Rechazado' ? 'WARN' : 'OK',
    });

    res.json({ ok: true, data: lead });
  } catch (err) {
    console.error('cloudComparator.updateStatus error:', err);
    res.status(500).json({ error: 'Error actualizando status.' });
  }
};

exports.updateNotas = async (req, res) => {
  try {
    const { id } = req.params;
    const { notas } = req.body;

    const lead = await CloudComparatorLead.findByIdAndUpdate(
      id,
      { notas: notas ?? '' },
      { new: true }
    );

    if (!lead) return res.status(404).json({ error: 'Solicitud no encontrada.' });
    res.json({ ok: true, data: lead });
  } catch (err) {
    console.error('cloudComparator.updateNotas error:', err);
    res.status(500).json({ error: 'Error actualizando notas.' });
  }
};
