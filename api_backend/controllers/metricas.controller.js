const Metricas = require('../models/model.metricas');

async function getSingleton() {
  let doc = await Metricas.findOne();
  if (!doc) doc = await Metricas.create({});
  return doc;
}

exports.get = async (req, res) => {
  try {
    const doc = await getSingleton();
    res.json({ ok: true, data: doc.metricas });
  } catch (err) {
    console.error('metricas.get error:', err);
    res.status(500).json({ error: 'Error obteniendo métricas.' });
  }
};

exports.updateOne = async (req, res) => {
  try {
    const { id } = req.params;
    const { value, publicLabel, visible, period } = req.body;

    const doc = await getSingleton();
    const metrica = doc.metricas.find(m => m.id === id);
    if (!metrica) return res.status(404).json({ error: 'Métrica no encontrada.' });

    if (value       !== undefined) metrica.value       = Number(value);
    if (publicLabel !== undefined) metrica.publicLabel = publicLabel;
    if (visible     !== undefined) metrica.visible     = Boolean(visible);
    if (period      !== undefined) metrica.period      = period;
    metrica.version = (metrica.version || 1) + 1;

    doc.markModified('metricas');
    await doc.save();
    res.json({ ok: true, data: metrica });
  } catch (err) {
    console.error('metricas.updateOne error:', err);
    res.status(500).json({ error: 'Error actualizando métrica.' });
  }
};
