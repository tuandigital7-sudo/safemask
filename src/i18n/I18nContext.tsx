import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Language } from '../types';
import { translations } from './translations';

const LANG_KEY = 'safemask_lang_v1';

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

function detectInitialLang(): Language {
  try {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('lang');
    if (q === 'vi' || q === 'en') return q;
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'vi' || saved === 'en') return saved;
    // English is the primary global market default; Vietnamese available via 1-tap toggle
    return 'en';
  } catch {
    return 'en';
  }
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(detectInitialLang);

  const setLang = (next: Language) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_KEY, next);
      document.documentElement.lang = next;
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: string): string => {
    return translations[lang][key] ?? translations.en[key] ?? key;
  };

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
};

export function useI18n() {
  return useContext(I18nContext);
}
