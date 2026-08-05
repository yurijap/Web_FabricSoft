const mongoose = require('mongoose');

const DEFAULTS = [
  { id: 'rescue',          label: 'Rescue Counter',                         value: 14,  unit: 'rescates', publicLabel: 'Rescates Oracle · 2024–2026',            period: '2024–2026', visible: true,  appearsIn: 'Hero · S07 · OG image',  version: 12 },
  { id: 'nps',             label: 'NPS clientes activos',                   value: 72,  unit: 'pts',      publicLabel: 'NPS · Publicación Q4 2026',               period: 'Q1 2026',   visible: false, appearsIn: 'S13 Transparencia',       version: 1  },
  { id: 'senior',          label: '% Senior consultants',                   value: 100, unit: '%',        publicLabel: '100% Senior Team',                        period: 'Vigente',   visible: true,  appearsIn: 'S15 Founder',             version: 3  },
  { id: 'fixed_price',     label: '% Proyectos Fixed-Price en presupuesto', value: 100, unit: '%',        publicLabel: '100% dentro de presupuesto Fixed-Price',  period: 'Q1 2026',   visible: false, appearsIn: 'S13 Transparencia',       version: 1  },
  { id: 'retencion',       label: 'Retención clientes 24 meses',            value: 0,   unit: '%',        publicLabel: 'No publicado',                             period: 'Q1 2026',   visible: false, appearsIn: 'S13 Transparencia',       version: 1  },
  { id: 'tiempo_respuesta',label: 'Tiempo medio respuesta crítico',          value: 0,   unit: 'min',      publicLabel: 'No publicado',                             period: 'Q1 2026',   visible: false, appearsIn: 'S13 Transparencia',       version: 1  },
];

const metricaSchema = new mongoose.Schema({
  id:          { type: String, required: true },
  label:       { type: String, required: true },
  value:       { type: Number, default: 0 },
  unit:        { type: String, default: '' },
  publicLabel: { type: String, default: '' },
  period:      { type: String, default: '' },
  visible:     { type: Boolean, default: true },
  appearsIn:   { type: String, default: '' },
  version:     { type: Number, default: 1 },
}, { _id: false });

// Singleton: un solo documento con el array de métricas editables
const metricasDocSchema = new mongoose.Schema({
  metricas: { type: [metricaSchema], default: () => DEFAULTS },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Metricas', metricasDocSchema);
