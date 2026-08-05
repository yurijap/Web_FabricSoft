const mongoose = require('mongoose');

const agenteTokenLogSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ['openai', 'claude', 'grok'],
      required: true,
      index: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    promptTokens: {
      type: Number,
      required: true,
      min: 0,
    },
    completionTokens: {
      type: Number,
      required: true,
      min: 0,
    },
    totalTokens: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ['test', 'public'],
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('AgenteTokenLog', agenteTokenLogSchema);
