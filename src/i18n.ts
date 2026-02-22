import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import hi from './locales/hi.json';
import ar from './locales/ar.json';
import ms from './locales/ms.json';

// Language mapping from display names to i18n codes
export const LANGUAGE_MAP: Record<string, string> = {
  'English': 'en',
  'Spanish': 'es',
  'French': 'fr',
  'Chinese (Simplified)': 'zh',
  'Japanese': 'ja',
  'Korean': 'ko',
  'Hindi': 'hi',
  'Arabic': 'ar',
  'Bahasa Melayu': 'ms',
};

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  zh: { translation: zh },
  ja: { translation: ja },
  ko: { translation: ko },
  hi: { translation: hi },
  ar: { translation: ar },
  ms: { translation: ms },
};

// Get initial language from localStorage
const savedLanguage = localStorage.getItem('appLanguage') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Custom function to change language
export const changeLanguage = (languageName: string) => {
  const languageCode = LANGUAGE_MAP[languageName] || 'en';
  localStorage.setItem('appLanguage', languageCode);
  i18n.changeLanguage(languageCode);
};

// Get current language display name
export const getCurrentLanguageName = (): string => {
  const currentCode = i18n.language || 'en';
  return Object.keys(LANGUAGE_MAP).find(key => LANGUAGE_MAP[key] === currentCode) || 'English';
};

export default i18n;
