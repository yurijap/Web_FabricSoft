import { useEffect, useRef } from 'react';
import { api } from '../config/api';
import { useI18n } from './I18nProvider';

const originalText = new WeakMap<Text, string>();
const translatedText = new WeakMap<Text, string>();

/**
 * Cache por idioma.
 * Así si luego agregas más idiomas, no se mezclan traducciones.
 */
const textCache = new Map<string, string>();

const TRANSLATOR_IGNORE_SELECTOR =
  '[data-no-translate], .notranslate, .admin-main, .fabric-typewriter, script, style, noscript, textarea, input, select, option';

const PROTECTED_TEXTS = new Set([
  'Julio',
  'Álvarez',
  'Alvarez',
  'Julio Álvarez',
  'Julio Alvarez',
]);

function normalize(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function getCacheKey(lang: string, text: string) {
  return `${lang}::${text}`;
}

function shouldSkipElement(element: Element | null) {
  if (!element) return true;
  return Boolean(element.closest(TRANSLATOR_IGNORE_SELECTOR));
}

function shouldTranslate(text: string) {
  const value = normalize(text);

  if (value.length < 2) return false;
  if (value.length > 500) return false;
  if (PROTECTED_TEXTS.has(value)) return false;

  // Evita traducir números, símbolos, códigos cortos, etc.
  if (/^[\d\s.,:;|/\\()[\]{}+\-%$#@!?'"]+$/.test(value)) return false;
  if (/^[A-Z0-9\s.,:;|/\\()[\]{}+\-%$#@!?'"]{1,18}$/.test(value)) return false;

  if (value.includes('@')) return false;
  if (value.startsWith('http')) return false;

  return /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(value);
}

function collectTextNodes(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const textNode = node as Text;

      if (shouldSkipElement(textNode.parentElement)) {
        return NodeFilter.FILTER_REJECT;
      }

      if (!shouldTranslate(textNode.data)) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  let node = walker.nextNode();

  while (node) {
    nodes.push(node as Text);
    node = walker.nextNode();
  }

  return nodes;
}

export default function PageTranslator() {
  const { lang } = useI18n();

  const debounceRef = useRef<number | null>(null);
  const requestId = useRef(0);
  const isApplyingRef = useRef(false);
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;

    const stopObserver = () => {
      observerRef.current?.disconnect();
    };

    const startObserver = () => {
      stopObserver();

      const observer = new MutationObserver(() => {
        if (isApplyingRef.current) return;
        schedule();
      });

      /**
       * IMPORTANTE:
       * No uses characterData: true.
       * Eso provocaba que cada texto cambiado disparara otra traducción.
       */
      observer.observe(root, {
        childList: true,
        subtree: true,
      });

      observerRef.current = observer;
    };

    const restoreSpanish = () => {
      const nodes = collectTextNodes(root);

      isApplyingRef.current = true;
      stopObserver();

      nodes.forEach((node) => {
        const original = originalText.get(node);

        if (original && node.data !== original) {
          node.data = original;
        }
      });

      window.setTimeout(() => {
        isApplyingRef.current = false;
        startObserver();
      }, 0);
    };

    const translatePage = async () => {
      const currentRequest = ++requestId.current;

      const nodes = collectTextNodes(root);

      nodes.forEach((node) => {
        if (!originalText.has(node)) {
          originalText.set(node, node.data);
        }
      });

      const unresolvedTexts: string[] = [];

      isApplyingRef.current = true;
      stopObserver();

      nodes.forEach((node) => {
        const original = normalize(originalText.get(node) ?? node.data);
        const cachedByNode = translatedText.get(node);
        const cachedByText = textCache.get(getCacheKey(lang, original));

        if (cachedByNode) {
          if (node.data !== cachedByNode) node.data = cachedByNode;
          return;
        }

        if (cachedByText) {
          translatedText.set(node, cachedByText);
          if (node.data !== cachedByText) node.data = cachedByText;
          return;
        }

        unresolvedTexts.push(original);
      });

      isApplyingRef.current = false;
      startObserver();

      const uniqueTexts = [...new Set(unresolvedTexts)];

      if (uniqueTexts.length === 0) return;

      try {
        const res = await api.post('/i18n/translate', {
          targetLang: lang,
          texts: uniqueTexts,
        });

        if (currentRequest !== requestId.current) return;

        const translations = res.data.data ?? {};

        Object.entries(translations).forEach(([source, translated]) => {
          if (typeof translated === 'string') {
            textCache.set(getCacheKey(lang, source), translated);
          }
        });

        const freshNodes = collectTextNodes(root);

        isApplyingRef.current = true;
        stopObserver();

        freshNodes.forEach((node) => {
          if (!originalText.has(node)) {
            originalText.set(node, node.data);
          }

          const original = normalize(originalText.get(node) ?? node.data);
          const translated = textCache.get(getCacheKey(lang, original));

          if (translated) {
            translatedText.set(node, translated);

            if (node.data !== translated) {
              node.data = translated;
            }
          }
        });

        window.setTimeout(() => {
          isApplyingRef.current = false;
          startObserver();
        }, 0);
      } catch {
        isApplyingRef.current = false;
        startObserver();
      }
    };

    const schedule = () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }

      debounceRef.current = window.setTimeout(() => {
        if (lang === 'en') {
          translatePage();
        } else {
          requestId.current += 1;
          restoreSpanish();
        }
      }, 120);
    };

    schedule();
    startObserver();

    return () => {
      stopObserver();

      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [lang]);

  return null;
}
