const mongoose = require('mongoose');
const trackingSchema = require('./schema.tracking');

const historialEntrySchema = new mongoose.Schema(
  {
    fecha: { type: String, required: true },
    estado: { type: String, required: true },
    autor: { type: String, default: 'Sistema' },
  },
  { _id: false }
);

const breakdownSchema = new mongoose.Schema(
  {
    compute: { type: Number, default: 0 },
    storage: { type: Number, default: 0 },
    database: { type: Number, default: 0 },
    networking: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },
  { _id: false }
);

const cloudComparatorLeadSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    cargo: { type: String, required: true, trim: true },
    empresa: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    telefono: { type: String, default: '', trim: true },
    provider: { type: String, required: true, trim: true },
    monthlySpend: { type: Number, required: true, min: 0 },
    analysisPeriod: { type: String, default: '', trim: true },
    criticalApplication: { type: String, required: true, trim: true },
    objective: { type: String, required: true, trim: true },
    workload: { type: String, required: true, trim: true },
    breakdown: { type: breakdownSchema, default: () => ({}) },
    ndaAccepted: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Nuevo', 'Revision', 'Aprobado', 'WaitList', 'Rechazado'],
      default: 'Nuevo',
    },
    notas: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    historial: [historialEntrySchema],
    tracking: { type: trackingSchema, default: () => ({}) },
  },
  { timestamps: true, versionKey: false }
);

cloudComparatorLeadSchema.index({ email: 1, createdAt: -1 });
cloudComparatorLeadSchema.index({ status: 1, createdAt: -1 });
cloudComparatorLeadSchema.index({ score: -1, createdAt: -1 });

module.exports = mongoose.model('CloudComparatorLead', cloudComparatorLeadSchema);
