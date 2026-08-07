import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { translations, type TranslationKey } from './translations';

export type Lang = 'es' | 'en';

const STORAGE_KEY = 'fabric_lang';

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getInitialLang(): Lang {
  if (typeof window === 'undefined') return 'es';

  // El selector/traductor esta desactivado temporalmente por rendimiento.
  // Forzamos ES para evitar que un valor previo en localStorage deje el sitio en ingles.
  return 'es';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => getInitialLang());

  const setLang = useCallback((next: Lang) => {
    setLangState((current) => {
      if (current === next) return current;
      return next;
    });
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((current) => (current === 'es' ? 'en' : 'es'));
  }, []);

  const t = useCallback(
    (key: TranslationKey) => {
      return translations[lang][key] ?? translations.es[key] ?? key;
    },
    [lang],
  );

  useEffect(() => {
    document.documentElement.lang = lang;

    const timer = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, lang);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [lang]);

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      toggleLang,
      t,
    }),
    [lang, setLang, toggleLang, t],
  );

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);

  if (!ctx) {
    throw new Error('useI18n must be used inside I18nProvider');
  }

  return ctx;
}
