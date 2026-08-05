const mongoose = require('mongoose');
const trackingSchema = require('./schema.tracking');

const answerSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  score: { type: Number, required: true, min: 0, max: 3 },
}, { _id: false });

const rescueAssessmentSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    nombre: { type: String, trim: true, default: '' },
    empresa: { type: String, trim: true, default: '' },
    cargo: { type: String, trim: true, default: '' },
    escenario: {
      type: String,
      enum: ['fusion-fallando', 'migrando', 'greenfield'],
      default: 'fusion-fallando',
    },
    answers: { type: [answerSchema], required: true },
    totalScore: { type: Number, required: true },
    severity: {
      type: String,
      enum: ['BAJO', 'MODERADO', 'ALTO', 'CRÍTICO'],
      required: true,
    },
    ipAddress: { type: String, default: '' },
    emailSent: { type: Boolean, default: false },
    tracking: { type: trackingSchema, default: () => ({}) },
  },
  { timestamps: true, versionKey: false }
);

rescueAssessmentSchema.index({ email: 1 });
rescueAssessmentSchema.index({ severity: 1 });
rescueAssessmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('RescueAssessment', rescueAssessmentSchema);
