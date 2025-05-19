import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "he",
    debug: true,
    load: "all",
    backend: { loadPath: "/locales/{{lng}}/{{ns}}.json" }, // Adjust path as needed
    interpolation: { escapeValue: false },
    detection: {
      // Only use localStorage and cookie, not browser language
      order: ['localStorage', 'cookie'],
      caches: ['localStorage', 'cookie'],
    },
  });

export default i18n;
