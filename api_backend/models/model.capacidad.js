const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  id:             { type: Number, required: true },
  status:         { type: String, enum: ['disponible', 'activo', 'reservado'], default: 'disponible' },
  assignedLeadId: { type: String, default: '' },
  assignedLead:   { type: String, default: '' },
  notas:          { type: String, default: '' },
  updatedAt:      { type: String, default: '' },
}, { _id: false });

const admissionQuarterSchema = new mongoose.Schema({
  quarter:     { type: String, required: true },
  status:      { type: String, enum: ['closed', 'open', 'upcoming'], required: true },
  label:       { type: String, required: true },
  description: { type: String, default: '' },
  deadline:    { type: String, default: '' },
}, { _id: false });

const DEFAULT_ADMISSION_QUARTERS = [
  { quarter: 'Q1 2026', status: 'closed',   label: 'Cerrado',  description: '3 proyectos aceptados',      deadline: 'Completo' },
  { quarter: 'Q2 2026', status: 'closed',   label: 'Cerrado',  description: '2 proyectos aceptados',      deadline: 'Completo' },
  { quarter: 'Q3 2026', status: 'open',     label: 'Abierto',  description: 'Evaluando aplicaciones',     deadline: 'Plazo - 30 julio' },
  { quarter: 'Q4 2026', status: 'upcoming', label: 'Proximo',  description: 'Aplicaciones desde 01 sept', deadline: 'Proximo' },
];

// Singleton: un solo documento en la colección
const capacidadSchema = new mongoose.Schema({
  slots:             { type: [slotSchema], default: () => Array.from({ length: 12 }, (_, i) => ({ id: i + 1, status: 'disponible' })) },
  admissionQuarters: { type: [admissionQuarterSchema], default: () => DEFAULT_ADMISSION_QUARTERS },
  deadlineQ3:        { type: String, default: '2026-07-30T23:59:59-06:00' },
  waitlist:          { type: [String], default: [] },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Capacidad', capacidadSchema);
