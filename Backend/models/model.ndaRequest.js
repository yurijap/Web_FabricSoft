const mongoose = require('mongoose');
const trackingSchema = require('./schema.tracking');

const ndaRequestSchema = new mongoose.Schema({
  nombre:     { type: String, required: true, trim: true },
  cargo:      { type: String, required: true, trim: true },
  empresa:    { type: String, required: true, trim: true },
  email:      { type: String, required: true, lowercase: true, trim: true },
  caso:       { type: String, required: true, default: 'ape-plazas' },
  documento:  { type: String, required: true, default: 'paper-nda' },
  status:     { type: String, enum: ['pendiente', 'aprobado', 'enviado', 'rechazado'], default: 'pendiente' },
  emailSent:  { type: Boolean, default: false },
  notas:      { type: String, default: '' },
  ipAddress:  { type: String, default: '' },
  tracking:   { type: trackingSchema, default: () => ({}) },
}, { timestamps: true, versionKey: false });

ndaRequestSchema.index({ email: 1, caso: 1, createdAt: -1 });
ndaRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('NdaRequest', ndaRequestSchema);
