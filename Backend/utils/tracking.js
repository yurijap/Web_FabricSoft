const TRACKING_FIELDS = [
  'sourceSection',
  'interactionType',
  'pagePath',
  'referrer',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'locale',
];

function cleanString(value, maxLength = 500) {
  if (value === undefined || value === null) return '';
  return String(value).trim().slice(0, maxLength);
}

function sanitizeTracking(tracking = {}) {
  if (!tracking || typeof tracking !== 'object') return {};

  return TRACKING_FIELDS.reduce((safeTracking, field) => {
    safeTracking[field] = cleanString(tracking[field]);
    return safeTracking;
  }, {});
}

module.exports = { sanitizeTracking };
