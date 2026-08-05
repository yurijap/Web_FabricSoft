const mongoose = require('mongoose');

const trackingSchema = new mongoose.Schema(
  {
    sourceSection: { type: String, default: '', trim: true },
    interactionType: { type: String, default: '', trim: true },
    pagePath: { type: String, default: '', trim: true },
    referrer: { type: String, default: '', trim: true },
    utm_source: { type: String, default: '', trim: true },
    utm_medium: { type: String, default: '', trim: true },
    utm_campaign: { type: String, default: '', trim: true },
    utm_term: { type: String, default: '', trim: true },
    utm_content: { type: String, default: '', trim: true },
    locale: { type: String, default: '', trim: true },
  },
  { _id: false }
);

module.exports = trackingSchema;
