const mongoose = require('mongoose');

const translationCacheSchema = new mongoose.Schema({
  sourceLang: { type: String, required: true, default: 'ES' },
  targetLang: { type: String, required: true },
  sourceText: { type: String, required: true },
  translatedText: { type: String, required: true },
  provider: { type: String, default: 'deepl' },
}, { timestamps: true, versionKey: false });

translationCacheSchema.index({ sourceLang: 1, targetLang: 1, sourceText: 1 }, { unique: true });

module.exports = mongoose.model('TranslationCache', translationCacheSchema);
