const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'agent'],
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 1200,
      required: true,
    },
  },
  { _id: false }
);

const agenteLeadSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      index: true,
    },
    intent: {
      type: String,
      enum: ['rescate_oracle', 'migracion', 'greenfield', 'soporte_post_go_live', 'pricing', 'admision', 'fuera_de_tema', 'desconocido'],
      default: 'desconocido',
      index: true,
    },
    urgency: {
      type: String,
      default: 'No detectada',
      trim: true,
    },
    estimatedRevenue: {
      type: String,
      default: 'No detectado',
      trim: true,
    },
    company: {
      type: String,
      default: 'No detectada',
      trim: true,
    },
    industry: {
      type: String,
      default: 'No detectada',
      trim: true,
    },
    currentSystem: {
      type: String,
      default: 'No detectado',
      trim: true,
    },
    painPoint: {
      type: String,
      default: 'No detectado',
      trim: true,
    },
    fabricFit: {
      type: String,
      enum: ['alto', 'medio', 'bajo', 'pendiente'],
      default: 'pendiente',
    },
    summary: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1200,
    },
    nextStep: {
      type: String,
      default: 'Continuar calificacion',
      trim: true,
    },
    pendingQuestions: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['nuevo', 'calificado', 'aplico', 'abandonado', 'descartado'],
      default: 'nuevo',
      index: true,
    },
    ctaType: {
      type: String,
      enum: ['apply', 'schedule', 'send_case', 'none'],
      default: 'none',
    },
    lastQuestion: {
      type: String,
      default: '',
      trim: true,
      maxlength: 800,
    },
    conversation: {
      type: [messageSchema],
      default: [],
    },
    ip: {
      type: String,
      default: '',
      trim: true,
    },
    userAgent: {
      type: String,
      default: '',
      trim: true,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('AgenteLead', agenteLeadSchema);
