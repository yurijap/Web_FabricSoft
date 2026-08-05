const Log = require('../models/model.log');

exports.listar = async (req, res) => {
  try {
    const { categoria, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (categoria && categoria !== 'Todas') filter.categoria = categoria;

    const p = Math.max(1, parseInt(page) || 1);
    const lim = Math.max(1, parseInt(limit) || 50);

    const total = await Log.countDocuments(filter);
    const data = await Log.find(filter)
      .sort({ createdAt: -1 })
      .skip((p - 1) * lim)
      .limit(lim);

    res.json({ ok: true, data, total });
  } catch (err) {
    console.error('logs.listar error:', err);
    res.status(500).json({ error: 'Error listando logs.' });
  }
};
