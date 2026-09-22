import React, { createContext, useContext, useState } from 'react';
import { LANGUAGES, TRANSLATIONS, CROP_TRANSLATIONS, type SupportedLanguage, type LanguageOption } from '../i18n/translations';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
  translateCrop: (crop: string) => string;
  languages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined') {
      const urlLang = new URLSearchParams(window.location.search).get('lang');
      if (urlLang && ['hi', 'en', 'pa', 'mr', 'te', 'ta', 'ml'].includes(urlLang)) {
        return urlLang as SupportedLanguage;
      }
    }
    const saved = localStorage.getItem('kisan_lang');
    return (saved as SupportedLanguage) || 'hi'; // Default to Hindi for farmer friendliness
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('kisan_lang', lang);
  };

  const t = (key: string): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS['en'];
    return langDict[key] || TRANSLATIONS['en'][key] || key;
  };

  const translateCrop = (crop: string): string => {
    if (CROP_TRANSLATIONS[crop] && CROP_TRANSLATIONS[crop][language]) {
      return CROP_TRANSLATIONS[crop][language];
    }
    return crop;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translateCrop, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
