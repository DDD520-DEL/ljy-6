import zh from './zh';
import en from './en';
import { useLanguage, type Lang } from '../stores/languageStore';

const translations: Record<Lang, Record<string, string>> = { zh, en };

export function t(key: string, lang?: Lang): string {
  const currentLang = lang || useLanguage.getState().lang;
  return translations[currentLang]?.[key] ?? translations.zh[key] ?? key;
}

export function useT() {
  const lang = useLanguage((s) => s.lang);
  return (key: string) => t(key, lang);
}
