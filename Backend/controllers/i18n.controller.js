const TranslationCache = require('../models/model.translationCache');

const DEEPL_FREE_URL = 'https://api-free.deepl.com/v2/translate';
const DEEPL_PRO_URL = 'https://api.deepl.com/v2/translate';
const PROTECTED_TERMS = ['Julio Álvarez', 'Julio Alvarez', 'Julio', 'Álvarez', 'Alvarez'];

function normalizeText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function deeplTarget(lang) {
  if (lang === 'en') return 'EN-US';
  if (lang === 'es') return 'ES';
  return String(lang || '').toUpperCase();
}

function deeplUrl() {
  if (process.env.DEEPL_API_URL) return process.env.DEEPL_API_URL;
  const key = process.env.DEEPL_API_KEY || '';
  return key.endsWith(':fx') ? DEEPL_FREE_URL : DEEPL_PRO_URL;
}

function maskProtectedTerms(text) {
  let masked = text;
  const replacements = [];

  PROTECTED_TERMS.forEach((term, index) => {
    const token = `FABRICPROTECTED${index}`;
    if (!masked.includes(term)) return;

    masked = masked.split(term).join(token);
    replacements.push([token, term]);
  });

  return { masked, replacements };
}

function restoreProtectedTerms(text, replacements) {
  return replacements.reduce(
    (current, [token, term]) => current.split(token).join(term),
    text,
  );
}

function preserveProtectedTerms(source, translated) {
  let safeText = translated;

  if (source.includes('Julio')) {
    safeText = safeText.replace(/\bJuly\b/g, 'Julio');
  }

  if (source.includes('Álvarez')) {
    safeText = safeText.replace(/\bAlvarez\b/g, 'Álvarez');
  } else if (source.includes('Alvarez')) {
    safeText = safeText.replace(/\bAlvarez\b/g, 'Alvarez');
  }

  return safeText;
}

async function translateWithDeepL(texts, targetLang) {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) return {};

  const maskedTexts = texts.map(maskProtectedTerms);

  const body = new URLSearchParams();
  body.set('source_lang', 'ES');
  body.set('target_lang', deeplTarget(targetLang));
  body.set('preserve_formatting', '1');
  maskedTexts.forEach(({ masked }) => body.append('text', masked));

  const response = await fetch(deeplUrl(), {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`DeepL ${response.status}: ${errText || response.statusText}`);
  }

  const data = await response.json();
  const result = {};
  (data.translations || []).forEach((item, index) => {
    result[texts[index]] = restoreProtectedTerms(item.text, maskedTexts[index].replacements);
  });
  return result;
}

exports.translate = async (req, res) => {
  try {
    const targetLang = req.body.targetLang === 'en' ? 'en' : 'es';
    const incoming = Array.isArray(req.body.texts) ? req.body.texts : [];
    const texts = [...new Set(incoming.map(normalizeText).filter(Boolean))]
      .filter(text => text.length <= 900)
      .slice(0, 120);

    if (targetLang === 'es' || texts.length === 0) {
      return res.json({ ok: true, data: {} });
    }

    const cached = await TranslationCache.find({
      sourceLang: 'ES',
      targetLang,
      sourceText: { $in: texts },
    });

    const translations = {};
    texts.forEach(text => {
      if (PROTECTED_TERMS.includes(text)) {
        translations[text] = text;
      }
    });

    cached.forEach(item => {
      if (translations[item.sourceText]) return;
      translations[item.sourceText] = preserveProtectedTerms(item.sourceText, item.translatedText);
    });

    const missing = texts.filter(text => !translations[text]);
    if (missing.length > 0 && process.env.DEEPL_API_KEY) {
      const fresh = await translateWithDeepL(missing, targetLang);
      Object.assign(translations, fresh);

      await Promise.all(Object.entries(fresh).map(([sourceText, translatedText]) =>
        TranslationCache.updateOne(
          { sourceLang: 'ES', targetLang, sourceText },
          { $set: { translatedText, provider: 'deepl' } },
          { upsert: true },
        ).catch(err => console.error('translation cache write failed:', err.message))
      ));
    }

    res.json({
      ok: true,
      data: translations,
      providerReady: Boolean(process.env.DEEPL_API_KEY),
      missing: process.env.DEEPL_API_KEY ? [] : missing,
    });
  } catch (err) {
    console.error('i18n.translate error:', err.message);
    res.status(500).json({ error: 'Error traduciendo contenido.' });
  }
};
