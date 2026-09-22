import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'
import es from './locales/es.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, es: { translation: es } },
    fallbackLng: 'en',
    supportedLngs: ['en', 'es'],
    // Drop the region before matching: 'en-CO' is English, not "unsupported,
    // try the next entry in navigator.languages" (which would land on 'es'
    // for an English browser that also lists Spanish).
    load: 'languageOnly',
    detection: {
      // The browser language decides, every visit. Nothing is remembered:
      // the URL prefix is what carries the language ('/es/...'), and caching
      // would let one visit to a Spanish link pin Spanish forever.
      order: ['navigator'],
      caches: [],
    },
    interpolation: { escapeValue: false },
  })

export default i18n
