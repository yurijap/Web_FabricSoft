const ReferenciasConfig = require('../models/model.referencia');

async function getSingleton() {
  let doc = await ReferenciasConfig.findOne();
  if (!doc) doc = await ReferenciasConfig.create({});
  return doc;
}

function sortRefs(refs) {
  return [...refs].sort((a, b) => (a.orden || 0) - (b.orden || 0));
}

function getWeekIndex(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const diffDays = Math.floor((date - start) / 86400000);
  return Math.floor(diffDays / 7);
}

function pickWeeklyWindow(refs, limit, rotationWeeks = 1) {
  if (refs.length <= limit) return refs;

  const weekIndex = getWeekIndex();
  const cadence = Math.max(1, Number(rotationWeeks) || 1);
  const rotationIndex = Math.floor(weekIndex / cadence);
  const start = rotationIndex % refs.length;
  return Array.from({ length: limit }, (_, offset) => refs[(start + offset) % refs.length]);
}

exports.listarPublicas = async (req, res) => {
  try {
    const doc = await getSingleton();
    const eligible = sortRefs(doc.referencias).filter(ref => ref.disponible);
    const publicLimit = Number(doc.publicLimit || 3);
    const data = pickWeeklyWindow(eligible, publicLimit, doc.rotationWeeks)
      .map(ref => ({
        id: ref._id,
        numero: ref.numero,
        title: ref.title,
        subtitle: ref.subtitle,
        vertical: ref.vertical,
        langs: ref.langs,
      }));

    res.json({
      ok: true,
      data,
      rotationWeeks: doc.rotationWeeks,
      publicLimit,
      totalDisponibles: eligible.length,
    });
  } catch (err) {
    console.error('referencias.listarPublicas error:', err);
    res.status(500).json({ error: 'Error obteniendo referencias.' });
  }
};

exports.listarAdmin = async (req, res) => {
  try {
    const doc = await getSingleton();
    res.json({
      ok: true,
      data: {
        rotationWeeks: doc.rotationWeeks,
        publicLimit: doc.publicLimit || 3,
        referencias: sortRefs(doc.referencias),
      },
    });
  } catch (err) {
    console.error('referencias.listarAdmin error:', err);
    res.status(500).json({ error: 'Error obteniendo referencias.' });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { rotationWeeks, publicLimit, referencias } = req.body;
    const doc = await getSingleton();

    if (rotationWeeks !== undefined) {
      const weeks = Number(rotationWeeks);
      if (!Number.isFinite(weeks) || weeks < 1 || weeks > 52) {
        return res.status(400).json({ error: 'rotationWeeks invalido.' });
      }
      doc.rotationWeeks = weeks;
    }

    if (publicLimit !== undefined) {
      const limit = Number(publicLimit);
      if (!Number.isFinite(limit) || limit < 1 || limit > 10) {
        return res.status(400).json({ error: 'publicLimit invalido.' });
      }
      doc.publicLimit = limit;
    }

    if (Array.isArray(referencias)) {
      doc.referencias = referencias.map((ref, index) => ({
        numero: String(ref.numero || String(index + 1).padStart(2, '0')),
        title: String(ref.title || '').trim(),
        subtitle: String(ref.subtitle || '').trim(),
        vertical: String(ref.vertical || '').trim(),
        langs: Array.isArray(ref.langs) && ref.langs.length ? ref.langs.filter(Boolean) : ['ES'],
        disponible: Boolean(ref.disponible),
        orden: Number(ref.orden || index + 1),
      })).filter(ref => ref.title && ref.subtitle && ref.vertical);
    }

    await doc.save();
    res.json({ ok: true, data: { rotationWeeks: doc.rotationWeeks, publicLimit: doc.publicLimit || 3, referencias: sortRefs(doc.referencias) } });
  } catch (err) {
    console.error('referencias.actualizar error:', err);
    res.status(500).json({ error: 'Error actualizando referencias.' });
  }
};

exports.restaurarDefaults = async (req, res) => {
  try {
    const doc = await getSingleton();
    doc.referencias = ReferenciasConfig.defaults();
    doc.rotationWeeks = 1;
    doc.publicLimit = 3;
    await doc.save();
    res.json({ ok: true, data: { rotationWeeks: doc.rotationWeeks, publicLimit: doc.publicLimit, referencias: sortRefs(doc.referencias) } });
  } catch (err) {
    console.error('referencias.restaurarDefaults error:', err);
    res.status(500).json({ error: 'Error restaurando referencias.' });
  }
};
