const mongoose = require('mongoose');
const trackingSchema = require('./schema.tracking');

const historialEntrySchema = new mongoose.Schema({
  fecha:  { type: String, required: true },
  estado: { type: String, required: true },
  autor:  { type: String, default: 'Sistema' },
}, { _id: false });

const ociAuditSchema = new mongoose.Schema({
  empresa:     { type: String, required: true, trim: true },
  cargo:       { type: String, required: true, trim: true },
  email:       { type: String, required: true, lowercase: true, trim: true },
  gastoOci:    { type: String, required: true, trim: true },
  ndaAceptado: { type: Boolean, default: true },
  ipAddress:   { type: String, default: '' },

  // Scoring interno (no se expone al cliente)
  score:   { type: Number, default: 0 },
  status:  {
    type: String,
    enum: ['Nuevo', 'Contactado', 'Acceso Coordinado', 'Reporte Enviado', 'Descartado'],
    default: 'Nuevo',
  },

  historial: [historialEntrySchema],
  notas:     { type: String, default: '' },
  tracking:  { type: trackingSchema, default: () => ({}) },
}, { timestamps: true, versionKey: false });

ociAuditSchema.index({ email: 1 });
ociAuditSchema.index({ status: 1, createdAt: -1 });
ociAuditSchema.index({ score: -1 });

module.exports = mongoose.model('OciAudit', ociAuditSchema);
