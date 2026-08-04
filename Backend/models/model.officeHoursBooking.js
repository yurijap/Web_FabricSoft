const mongoose = require('mongoose');
const trackingSchema = require('./schema.tracking');

const officeHoursBookingSchema = new mongoose.Schema({
  nombre:    { type: String, required: true, trim: true },
  cargo:     { type: String, default: '', trim: true },
  empresa:   { type: String, required: true, trim: true },
  email:     { type: String, required: true, lowercase: true, trim: true },
  revenue:   { type: String, default: '' },
  iniciativaOracle: { type: String, default: '' },
  plazo:     { type: String, default: '' },
  dia:       { type: String, default: '' },
  slot:      { type: String, default: '' },
  status:    { type: String, enum: ['pendiente', 'confirmado', 'cancelado'], default: 'pendiente' },
  emailEnviado: { type: Boolean, default: false },
  calendarEnviado: { type: Boolean, default: false },
  calendarEventId: { type: String, default: '' },
  notas:     { type: String, default: '' },
  ipAddress: { type: String, default: '' },
  tracking:  { type: trackingSchema, default: () => ({}) },
}, { timestamps: true, versionKey: false });

officeHoursBookingSchema.index({ email: 1, createdAt: -1 });
officeHoursBookingSchema.index({ dia: 1, slot: 1 });

module.exports = mongoose.model('OfficeHoursBooking', officeHoursBookingSchema);
