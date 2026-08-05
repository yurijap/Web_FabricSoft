const mongoose = require('mongoose');

const referenciaSchema = new mongoose.Schema({
  numero:      { type: String, required: true, trim: true },
  title:       { type: String, required: true, trim: true },
  subtitle:    { type: String, required: true, trim: true },
  vertical:    { type: String, required: true, trim: true },
  langs:       { type: [String], default: ['ES'] },
  disponible:  { type: Boolean, default: true },
  orden:       { type: Number, default: 0 },
}, { _id: true });

const DEFAULT_REFERENCIAS = [
  {
    numero: '01',
    title: 'CFO de operadora de centros comerciales',
    subtitle: 'Mexico - USD 100M+ revenue - Multi-plaza',
    vertical: 'Inmobiliario',
    langs: ['ES'],
    disponible: true,
    orden: 1,
  },
  {
    numero: '02',
    title: 'CTO de institucion financiera',
    subtitle: 'Mexico - USD 300M+ revenue - Regulada',
    vertical: 'Serv. Financieros',
    langs: ['ES', 'EN'],
    disponible: true,
    orden: 2,
  },
  {
    numero: '03',
    title: 'CFO Controller de fintech regulada',
    subtitle: 'Mexico - USD 80M+ revenue - Credito al consumo',
    vertical: 'Serv. Financieros',
    langs: ['ES'],
    disponible: true,
    orden: 3,
  },
  {
    numero: '04',
    title: 'CISO / CTO de fintech de credito al consumo',
    subtitle: 'Mexico - USD 60M+ revenue - CNBV',
    vertical: 'Serv. Financieros',
    langs: ['ES', 'EN'],
    disponible: true,
    orden: 4,
  },
  {
    numero: '05',
    title: 'Director de Consultoria - Oracle ACS',
    subtitle: 'LATAM - Partner Oracle senior - Externo',
    vertical: 'Partner Oracle',
    langs: ['ES', 'EN'],
    disponible: true,
    orden: 5,
  },
];

const referenciasConfigSchema = new mongoose.Schema({
  rotationWeeks: { type: Number, default: 1 },
  publicLimit:   { type: Number, default: 3 },
  referencias:  { type: [referenciaSchema], default: () => DEFAULT_REFERENCIAS },
}, { timestamps: true, versionKey: false });

referenciasConfigSchema.statics.defaults = () => DEFAULT_REFERENCIAS;

module.exports = mongoose.model('ReferenciasConfig', referenciasConfigSchema);
