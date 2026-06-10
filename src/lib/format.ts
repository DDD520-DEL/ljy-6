import { useLanguage, type Lang } from '../stores/languageStore';
import { t } from '../i18n';

function getLang(): Lang {
  return useLanguage.getState().lang;
}

export function formatNumber(num: number, decimals = 0): string {
  const lang = getLang();
  const locale = lang === 'en' ? 'en-US' : 'zh-CN';
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatCompactNumber(num: number): string {
  const lang = getLang();
  const locale = lang === 'en' ? 'en-US' : 'zh-CN';
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);
}

export function formatPercent(num: number, decimals = 0): string {
  const lang = getLang();
  const locale = lang === 'en' ? 'en-US' : 'zh-CN';
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatDistance(meters: number): string {
  const lang = getLang();
  if (lang === 'en') {
    const feet = meters * 3.28084;
    if (feet >= 5280) {
      const miles = feet / 5280;
      return `${formatNumber(miles, 2)} mi`;
    }
    return `${formatNumber(feet, 0)} ft`;
  }
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${formatNumber(km, 2)} km`;
  }
  return `${formatNumber(meters, 0)} m`;
}

export function formatWeight(grams: number): string {
  const lang = getLang();
  if (lang === 'en') {
    const ounces = grams * 0.035274;
    if (ounces >= 16) {
      const pounds = ounces / 16;
      return `${formatNumber(pounds, 2)} lb`;
    }
    return `${formatNumber(ounces, 1)} oz`;
  }
  if (grams >= 1000) {
    const kg = grams / 1000;
    return `${formatNumber(kg, 2)} kg`;
  }
  return `${formatNumber(grams, 0)} g`;
}

export function formatLength(cm: number): string {
  const lang = getLang();
  if (lang === 'en') {
    const inches = cm * 0.393701;
    if (inches >= 12) {
      const feet = Math.floor(inches / 12);
      const remainingInches = inches % 12;
      return `${feet}'${formatNumber(remainingInches, 0)}"`;
    }
    return `${formatNumber(inches, 1)} in`;
  }
  if (cm >= 100) {
    const m = cm / 100;
    return `${formatNumber(m, 2)} m`;
  }
  return `${formatNumber(cm, 0)} cm`;
}

export function formatDate(iso?: string) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const lang = getLang();
    if (lang === 'en') {
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return iso;
  }
}

export function formatDateTime(iso?: string) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const lang = getLang();
    if (lang === 'en') {
      return d.toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${h}:${min}`;
  } catch {
    return iso;
  }
}

export function formatDateShort(iso?: string) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const lang = getLang();
    if (lang === 'en') {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  } catch {
    return iso;
  }
}

export function timeAgo(iso?: string) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  const lang = getLang();
  if (s < 60) return t('time_just_now', lang);
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} ${t('time_minutes_ago', lang)}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ${t('time_hours_ago', lang)}`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} ${t('time_days_ago', lang)}`;
  return formatDate(iso);
}

export function toLocalInputDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInputDate(s: string) {
  if (!s) return new Date().toISOString();
  return new Date(s).toISOString();
}
