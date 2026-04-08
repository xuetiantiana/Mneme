import { createI18n } from 'vue-i18n';
import { getLanguage } from '../service/session';
import zhPopupTexts from '../locales/popupTexts/zh';
import enPopupTexts from '../locales/popupTexts/en';

const normalizeLocale = (value?: string): 'zh' | 'en' => {
  return String(value || '').trim().toLowerCase() === 'en' ? 'en' : 'zh';
};

const messages = {
  zh: {
    popupTexts: zhPopupTexts,
  },
  en: {
    popupTexts: enPopupTexts,
  },
};

export const i18n = createI18n({
  legacy: false,
  locale: normalizeLocale(getLanguage()),
  fallbackLocale: 'zh',
  messages,
});

export const setI18nLanguage = (value?: string): 'zh' | 'en' => {
  const next = normalizeLocale(value);
  i18n.global.locale.value = next;
  return next;
};

export const syncI18nLanguage = (): 'zh' | 'en' => {
  return setI18nLanguage(getLanguage());
};