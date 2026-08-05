const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  accion:    { type: String, required: true },
  categoria: {
    type: String, required: true,
    enum: ['Leads', 'Papers', 'Office Hours', 'Research Letters', 'NDA', 'Capacidad', 'Sistema', 'OCI Audit'],
  },
  autor:   { type: String, default: 'system' },
  status:  { type: String, default: 'OK', enum: ['OK', 'WARN', 'ERR'] },
  detalle: { type: String, default: '' },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Log', logSchema);
