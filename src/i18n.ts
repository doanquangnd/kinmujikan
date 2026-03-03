/**
 * Cấu hình i18n - tiếng Việt và tiếng Nhật.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import vi from './locales/vi.json';
import ja from './locales/ja.json';

const LANG_KEY = 'kinmu_lang';

export const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'ja', label: '日本語' },
] as const;

export type LangCode = (typeof LANGUAGES)[number]['code'];

function getStoredLang(): LangCode {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === 'vi' || stored === 'ja') return stored;
  } catch {
    /* ignore */
  }
  return 'vi';
}

i18n.use(initReactI18next).init({
  resources: { vi: { translation: vi }, ja: { translation: ja } },
  lng: getStoredLang(),
  fallbackLng: 'vi',
  interpolation: {
    escapeValue: false,
  },
});

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(LANG_KEY, lng);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lng;
    }
  } catch {
    /* ignore */
  }
});

if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language;
}

export default i18n;
