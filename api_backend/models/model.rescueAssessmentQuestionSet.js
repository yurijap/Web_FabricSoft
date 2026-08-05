const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  score: { type: Number, required: true, min: 0, max: 3 },
}, { _id: false });

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true, trim: true },
  text: { type: String, required: true, trim: true },
  options: {
    type: [optionSchema],
    validate: {
      validator: (options) => Array.isArray(options) && options.length >= 2,
      message: 'Cada pregunta necesita al menos dos opciones.',
    },
  },
}, { _id: false });

const rescueAssessmentQuestionSetSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    questions: {
      type: [questionSchema],
      validate: {
        validator: (questions) => Array.isArray(questions) && questions.length === 12,
        message: 'Rescue Assessment requiere exactamente 12 preguntas.',
      },
    },
    updatedBy: { type: String, trim: true, default: '' },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('RescueAssessmentQuestionSet', rescueAssessmentQuestionSetSchema);
