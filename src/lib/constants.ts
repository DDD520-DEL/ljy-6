import { t } from '../i18n';
import { useLanguage, type Lang } from '../stores/languageStore';

function getLang(): Lang {
  return useLanguage.getState().lang;
}

export const FEATHER_COLORS: { value: string; label: string; color: string; labelKey: string }[] = [
  { value: 'white', label: '白色', color: '#F8FAFC', labelKey: 'color_white' },
  { value: 'black', label: '黑色', color: '#1E293B', labelKey: 'color_black' },
  { value: 'gray', label: '灰色', color: '#94A3B8', labelKey: 'color_gray' },
  { value: 'brown', label: '棕色', color: '#92400E', labelKey: 'color_brown' },
  { value: 'chestnut', label: '栗色', color: '#7C2D12', labelKey: 'color_chestnut' },
  { value: 'rufous', label: '赤褐色', color: '#B45309', labelKey: 'color_rufous' },
  { value: 'pink', label: '粉色', color: '#F472B6', labelKey: 'color_pink' },
  { value: 'red', label: '红色', color: '#DC2626', labelKey: 'color_red' },
  { value: 'orange', label: '橙色', color: '#EA580C', labelKey: 'color_orange' },
  { value: 'yellow', label: '黄色', color: '#EAB308', labelKey: 'color_yellow' },
  { value: 'green', label: '绿色', color: '#16A34A', labelKey: 'color_green' },
  { value: 'blue', label: '蓝色', color: '#2563EB', labelKey: 'color_blue' },
  { value: 'purple', label: '紫色', color: '#7E22CE', labelKey: 'color_purple' },
  { value: 'iridescent', label: '虹彩', color: '#C026D3', labelKey: 'color_iridescent' },
];

export function getFeatherColorLabel(value: string): string {
  const item = FEATHER_COLORS.find((c) => c.value === value);
  return item ? t(item.labelKey) : value;
}

export const BIRD_SIZES: { value: string; label: string; desc: string; icon: string; labelKey: string; descKey: string }[] = [
  { value: 'small', label: '小型', desc: '< 15cm，麻雀大小', icon: '🐣', labelKey: 'size_small', descKey: 'size_small_desc' },
  { value: 'medium', label: '中型', desc: '15-35cm，鸽子大小', icon: '🕊️', labelKey: 'size_medium', descKey: 'size_medium_desc' },
  { value: 'large', label: '大型', desc: '35-70cm，白鹭大小', icon: '🦢', labelKey: 'size_large', descKey: 'size_large_desc' },
  { value: 'xlarge', label: '超大型', desc: '> 70cm，鸬鹚大小', icon: '🦅', labelKey: 'size_xlarge', descKey: 'size_xlarge_desc' },
];

export function getBirdSizeLabel(value: string): string {
  const item = BIRD_SIZES.find((b) => b.value === value);
  return item ? t(item.labelKey) : value;
}

export function getBirdSizeDesc(value: string): string {
  const item = BIRD_SIZES.find((b) => b.value === value);
  return item ? t(item.descKey) : '';
}

export const BEAK_SHAPES: { value: string; label: string; desc: string; labelKey: string; descKey: string }[] = [
  { value: 'short', label: '短喙', desc: '短而粗，适合啄食种子', labelKey: 'beak_short', descKey: 'beak_short_desc' },
  { value: 'conical', label: '圆锥喙', desc: '圆锥形，嗑食谷物', labelKey: 'beak_conical', descKey: 'beak_conical_desc' },
  { value: 'slender', label: '细长喙', desc: '细而长，适合昆虫或鱼类', labelKey: 'beak_slender', descKey: 'beak_slender_desc' },
  { value: 'curved', label: '弯曲喙', desc: '弧形弯曲，探取昆虫', labelKey: 'beak_curved', descKey: 'beak_curved_desc' },
  { value: 'hooked', label: '钩状喙', desc: '尖端弯钩，肉食性猛禽', labelKey: 'beak_hooked', descKey: 'beak_hooked_desc' },
];

export function getBeakLabel(value: string): string {
  const item = BEAK_SHAPES.find((b) => b.value === value);
  return item ? t(item.labelKey) : value;
}

export function getBeakDesc(value: string): string {
  const item = BEAK_SHAPES.find((b) => b.value === value);
  return item ? t(item.descKey) : '';
}

export const HABITATS: { value: string; label: string; emoji: string; labelKey: string }[] = [
  { value: 'urban', label: '城市建筑', emoji: '🏙️', labelKey: 'habitat_urban' },
  { value: 'park', label: '城市公园', emoji: '🌳', labelKey: 'habitat_park' },
  { value: 'garden', label: '花园庭院', emoji: '🌷', labelKey: 'habitat_garden' },
  { value: 'forest', label: '茂密森林', emoji: '🌲', labelKey: 'habitat_forest' },
  { value: 'forest_edge', label: '林缘地带', emoji: '🌿', labelKey: 'habitat_forest_edge' },
  { value: 'mountain', label: '山地丘陵', emoji: '⛰️', labelKey: 'habitat_mountain' },
  { value: 'open', label: '开阔田野', emoji: '🌾', labelKey: 'habitat_open' },
  { value: 'farmland', label: '农田耕地', emoji: '🚜', labelKey: 'habitat_farmland' },
  { value: 'wetland', label: '沼泽湿地', emoji: '🪴', labelKey: 'habitat_wetland' },
  { value: 'river', label: '河流溪流', emoji: '🏞️', labelKey: 'habitat_river' },
  { value: 'lake', label: '湖泊池塘', emoji: '🌊', labelKey: 'habitat_lake' },
  { value: 'pond', label: '小型水塘', emoji: '💧', labelKey: 'habitat_pond' },
  { value: 'coast', label: '海岸海边', emoji: '🌅', labelKey: 'habitat_coast' },
  { value: 'rice_paddy', label: '水稻田', emoji: '🍚', labelKey: 'habitat_rice_paddy' },
  { value: 'reservoir', label: '水库', emoji: '🏝️', labelKey: 'habitat_reservoir' },
];

export function getHabitatLabel(value: string): string {
  const item = HABITATS.find((h) => h.value === value);
  return item ? t(item.labelKey) : value;
}

export const WEATHER_OPTIONS: { value: string; label: string; emoji: string; labelKey: string }[] = [
  { value: 'sunny', label: '晴朗', emoji: '☀️', labelKey: 'weather_sunny' },
  { value: 'cloudy', label: '多云', emoji: '⛅', labelKey: 'weather_cloudy' },
  { value: 'rainy', label: '下雨', emoji: '🌧️', labelKey: 'weather_rainy' },
  { value: 'foggy', label: '雾天', emoji: '🌫️', labelKey: 'weather_foggy' },
  { value: 'snowy', label: '下雪', emoji: '❄️', labelKey: 'weather_snowy' },
  { value: 'windy', label: '大风', emoji: '💨', labelKey: 'weather_windy' },
];

export function getWeatherLabel(value: string): string {
  const item = WEATHER_OPTIONS.find((w) => w.value === value);
  return item ? t(item.labelKey) : value;
}

export const MIGRATION_LABELS: Record<string, { label: string; color: string; labelKey: string }> = {
  resident: { label: '留鸟', color: 'bg-forest-100 text-forest-700', labelKey: 'migration_resident' },
  summer: { label: '夏候鸟', color: 'bg-orange-100 text-orange-700', labelKey: 'migration_summer' },
  winter: { label: '冬候鸟', color: 'bg-sky-100 text-sky-700', labelKey: 'migration_winter' },
  passage: { label: '旅鸟', color: 'bg-violet-100 text-violet-700', labelKey: 'migration_passage' },
};

export function getMigrationLabel(value: string): string {
  const item = MIGRATION_LABELS[value];
  return item ? t(item.labelKey) : value;
}

export function getMonths(): string[] {
  const lang = getLang();
  if (lang === 'en') {
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  }
  return ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
}

export const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export const RARITY_COLORS: Record<string, string> = {
  common: 'from-gray-400 to-gray-500',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-500',
};

export const RARITY_LABELS: Record<string, string> = {
  common: 'rarity_common',
  rare: 'rarity_rare',
  epic: 'rarity_epic',
  legendary: 'rarity_legendary',
};

export function getRarityLabel(value: string): string {
  const map: Record<string, string> = {
    common: 'rarity_common',
    rare: 'rarity_rare',
    epic: 'rarity_epic',
    legendary: 'rarity_legendary',
  };
  return map[value] ? t(map[value]) : value;
}

export function getMonthNames(): string[] {
  return [
    t('months_1'), t('months_2'), t('months_3'), t('months_4'),
    t('months_5'), t('months_6'), t('months_7'), t('months_8'),
    t('months_9'), t('months_10'), t('months_11'), t('months_12'),
  ];
}
