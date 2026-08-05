const mongoose = require('mongoose');
const trackingSchema = require('./schema.tracking');

const paperAccessSchema = new mongoose.Schema(
  {
    paperId:   { type: String, required: true, trim: true },
    nombre:    { type: String, default: '', trim: true },
    email:     { type: String, required: true, lowercase: true, trim: true },
    cargo:     { type: String, required: true, trim: true },
    empresa:   { type: String, required: true, trim: true },
    ipAddress: { type: String, default: '' },
    tracking:  { type: trackingSchema, default: () => ({}) },
    status: {
      type: String,
      enum: ['descargado', 'pendiente', 'enviado', 'bloqueado'],
      default: 'descargado',
    },
    emailSent: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

// Índice para evitar spam: misma persona mismo paper en < 24h
paperAccessSchema.index({ email: 1, paperId: 1, createdAt: -1 });

module.exports = mongoose.model('PaperAccess', paperAccessSchema);
