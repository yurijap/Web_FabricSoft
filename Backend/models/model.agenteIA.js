const mongoose = require('mongoose');

const llmChainSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ['openai', 'claude', 'grok'],
      required: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const knowledgeFileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: '',
    },
    mimeType: {
      type: String,
      trim: true,
      default: 'text/plain',
    },
    size: {
      type: Number,
      default: 0,
    },
    content: {
      type: String,
      default: '',
      maxlength: 60000,
    },
  },
  { _id: false }
);

const agenteIASchema = new mongoose.Schema(
  {
    ownerClerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
    },
    files: {
      type: [String],
      default: [],
    },
    knowledgeFile: {
      type: knowledgeFileSchema,
      default: null,
    },
    llmChain: {
      type: [llmChainSchema],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length === 3;
        },
        message: 'Debes configurar exactamente 3 modelos IA',
      },
      required: true,
    },
    temperature: {
      type: Number,
      min: 0,
      max: 100,
      default: 32,
    },
    status: {
      type: String,
      enum: ['draft', 'active'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('AgenteIA', agenteIASchema);
