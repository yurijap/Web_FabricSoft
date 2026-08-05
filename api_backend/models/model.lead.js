const mongoose = require('mongoose');
const trackingSchema = require('./schema.tracking');

const historialEntrySchema = new mongoose.Schema({
  fecha:  { type: String, required: true },
  estado: { type: String, required: true },
  autor:  { type: String, default: 'Sistema' },
}, { _id: false });

const leadSchema = new mongoose.Schema({
  nombre:     { type: String, required: true, trim: true },
  cargo:      { type: String, required: true, trim: true },
  empresa:    { type: String, required: true, trim: true },
  revenue:    { type: String, default: '' },
  email:      { type: String, required: true, lowercase: true, trim: true },
  industria:  { type: String, default: '' },
  iniciativa: { type: String, default: '' },
  plazo:      { type: String, default: '' },
  source:     { type: String, default: 'aplicar' },
  score:      { type: Number, default: 0 },
  status:     { type: String, enum: ['Nuevo', 'Aprobado', 'WaitList', 'Revisión', 'Rechazado'], default: 'Nuevo' },
  notas:      { type: String, default: '' },
  ipAddress:  { type: String, default: '' },
  historial:  [historialEntrySchema],
  queryChat:  { type: String, default: '' },
  tracking:   { type: trackingSchema, default: () => ({}) },
}, { timestamps: true, versionKey: false });

leadSchema.index({ email: 1 });
leadSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);
