const mongoose = require('mongoose');

const paperCatalogSchema = new mongoose.Schema({
  paperId:   { type: String, required: true, unique: true, trim: true },
  titulo:    { type: String, required: true, trim: true },
  subtitulo: { type: String, default: 'Research Note · FABRIC · 2026', trim: true },
  tag:       { type: String, default: 'Research Note', trim: true },
  abstract:  { type: String, default: '', trim: true },
  meta:      { type: String, default: '', trim: true },
  visible:   { type: Boolean, default: true },
  orden:     { type: Number, default: 0 },
  toc:       { type: [String], default: [] },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('PaperCatalog', paperCatalogSchema);
