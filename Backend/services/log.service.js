const Log = require('../models/model.log');

/**
 * Fire-and-forget: nunca lanza excepciones, nunca bloquea al caller.
 * @param {{ accion: string, categoria: string, autor?: string, status?: 'OK'|'WARN'|'ERR', detalle?: string }} entry
 */
exports.log = (entry) => {
  Log.create(entry).catch(err => console.error('log.service write failed:', err.message));
};
