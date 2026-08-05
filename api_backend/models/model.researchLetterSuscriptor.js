const mongoose = require('mongoose');
const trackingSchema = require('./schema.tracking');

const researchLetterSuscriptorSchema = new mongoose.Schema(
  {
    email:            { type: String, required: true, lowercase: true, trim: true, unique: true },
    nombre:           { type: String, required: true, trim: true },
    empresa:          { type: String, required: true, trim: true },
    cargo:            { type: String, required: true, trim: true },
    revenueAprox:     {
      type: String,
      enum: ['USD 50M-250M', 'USD 250M-1B', 'Más de USD 1B', 'No especificado'],
      default: 'No especificado',
    },
    iniciativaOracle: { type: String, enum: ['activa', 'planeada', 'evaluando'], required: true },
    industria:        { type: String, trim: true, default: '' },
    ipAddress:        { type: String, default: '' },
    tracking:         { type: trackingSchema, default: () => ({}) },
    status:           { type: String, enum: ['pendiente', 'aprobado', 'rechazado'], default: 'pendiente' },
  },
  { timestamps: true, versionKey: false }
);

researchLetterSuscriptorSchema.index({ status: 1 });

module.exports = mongoose.model('ResearchLetterSuscriptor', researchLetterSuscriptorSchema);
