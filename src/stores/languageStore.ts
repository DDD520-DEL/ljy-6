import { create } from 'zustand';

export type Lang = 'zh' | 'en';

interface LanguageState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLanguage = create<LanguageState>((set) => ({
  lang: (localStorage.getItem('lang') as Lang) || 'zh',
  setLang: (lang: Lang) => {
    localStorage.setItem('lang', lang);
    set({ lang });
  },
}));
