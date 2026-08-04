const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: Number,
      required: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    score: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    totalScore: {
      type: Number,
      default: 0,
      index: true,
    },
    level: {
      type: String,
      enum: ['CRITICO', 'ALTO', 'MEDIO', 'BAJO'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    action: {
      type: String,
      trim: true,
      default: '',
    },
    investment: {
      type: String,
      trim: true,
      default: '',
    },
    roi: {
      type: String,
      trim: true,
      default: '',
    },
    pattern: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    role: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 180,
      index: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 60,
      default: '',
    },
  },
  { _id: false }
);

const diagnosticoOracleSchema = new mongoose.Schema(
  {
    contact: {
      type: contactSchema,
      required: true,
    },
    answers: {
      type: [answerSchema],
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length === 11;
        },
        message: 'El diagnostico debe incluir 11 respuestas.',
      },
    },
    result: {
      type: resultSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ['nuevo', 'en_revision', 'contactado', 'aprobado', 'descartado'],
      default: 'nuevo',
      index: true,
    },
    emailStatus: {
      type: String,
      enum: ['not_sent', 'sent', 'preview', 'failed'],
      default: 'not_sent',
      index: true,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    emailError: {
      type: String,
      trim: true,
      default: '',
      maxlength: 260,
    },
    authorized: {
      type: Boolean,
      required: true,
    },
    ip: {
      type: String,
      trim: true,
      default: '',
    },
    userAgent: {
      type: String,
      trim: true,
      default: '',
    },
    source: {
      type: String,
      trim: true,
      default: 'rescue_diagnostic',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('DiagnosticoOracle', diagnosticoOracleSchema);
