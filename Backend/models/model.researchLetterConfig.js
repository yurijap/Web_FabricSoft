const mongoose = require('mongoose');

const researchLetterConfigSchema = new mongoose.Schema(
  {
    cupoActivo:      { type: Boolean, default: true },
    cupoMaximo:      { type: Number, default: 50, min: 1 },
    admisionAbierta: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

researchLetterConfigSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

module.exports = mongoose.model('ResearchLetterConfig', researchLetterConfigSchema);
