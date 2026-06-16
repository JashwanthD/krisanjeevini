import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

type Language = 'en' | 'kn';

interface TranslationDict {
  [key: string]: string | TranslationDict;
}

interface LanguageContextType {
  lang: Language;
  translations: TranslationDict;
  t: (key: string) => string;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Resolve a dot-notation key path against a nested translation dictionary.
 * e.g. t('sowing.crops.rice') -> 'ಭತ್ತ'
 */
function resolveKey(dict: TranslationDict, keyPath: string): string {
  const keys = keyPath.split('.');
  let current: string | TranslationDict = dict;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return keyPath; // Fallback: return the key itself
    }
  }
  return typeof current === 'string' ? current : keyPath;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('kri-lang');
    return (saved === 'kn' ? 'kn' : 'en') as Language;
  });
  const [translations, setTranslations] = useState<TranslationDict>({});
  const [loading, setLoading] = useState(true);

  // Load translation file
  useEffect(() => {
    setLoading(true);
    fetch(`/locales/${lang}.json`)
      .then(res => res.json())
      .then((data: TranslationDict) => {
        setTranslations(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(`Failed to load ${lang} translations:`, err);
        setLoading(false);
      });
  }, [lang]);

  // Persist language choice
  useEffect(() => {
    localStorage.setItem('kri-lang', lang);
    document.documentElement.lang = lang === 'kn' ? 'kn' : 'en';
  }, [lang]);

  const t = useCallback(
    (key: string): string => {
      if (loading || !translations) return key;
      return resolveKey(translations, key);
    },
    [translations, loading]
  );

  const toggleLanguage = useCallback(() => {
    setLang(prev => (prev === 'en' ? 'kn' : 'en'));
  }, []);

  const setLanguage = useCallback((newLang: Language) => {
    setLang(newLang);
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, translations, t, toggleLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}

export default LanguageContext;
