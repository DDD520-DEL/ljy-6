export const FEATHER_COLORS: { value: string; label: string; color: string }[] = [
  { value: 'white', label: '白色', color: '#F8FAFC' },
  { value: 'black', label: '黑色', color: '#1E293B' },
  { value: 'gray', label: '灰色', color: '#94A3B8' },
  { value: 'brown', label: '棕色', color: '#92400E' },
  { value: 'chestnut', label: '栗色', color: '#7C2D12' },
  { value: 'rufous', label: '赤褐色', color: '#B45309' },
  { value: 'pink', label: '粉色', color: '#F472B6' },
  { value: 'red', label: '红色', color: '#DC2626' },
  { value: 'orange', label: '橙色', color: '#EA580C' },
  { value: 'yellow', label: '黄色', color: '#EAB308' },
  { value: 'green', label: '绿色', color: '#16A34A' },
  { value: 'blue', label: '蓝色', color: '#2563EB' },
  { value: 'purple', label: '紫色', color: '#7E22CE' },
  { value: 'iridescent', label: '虹彩', color: '#C026D3' },
];

export const BIRD_SIZES: { value: string; label: string; desc: string; icon: string }[] = [
  { value: 'small', label: '小型', desc: '< 15cm，麻雀大小', icon: '🐣' },
  { value: 'medium', label: '中型', desc: '15-35cm，鸽子大小', icon: '🕊️' },
  { value: 'large', label: '大型', desc: '35-70cm，白鹭大小', icon: '🦢' },
  { value: 'xlarge', label: '超大型', desc: '> 70cm，鸬鹚大小', icon: '🦅' },
];

export const BEAK_SHAPES: { value: string; label: string; desc: string }[] = [
  { value: 'short', label: '短喙', desc: '短而粗，适合啄食种子' },
  { value: 'conical', label: '圆锥喙', desc: '圆锥形，嗑食谷物' },
  { value: 'slender', label: '细长喙', desc: '细而长，适合昆虫或鱼类' },
  { value: 'curved', label: '弯曲喙', desc: '弧形弯曲，探取昆虫' },
  { value: 'hooked', label: '钩状喙', desc: '尖端弯钩，肉食性猛禽' },
];

export const HABITATS: { value: string; label: string; emoji: string }[] = [
  { value: 'urban', label: '城市建筑', emoji: '🏙️' },
  { value: 'park', label: '城市公园', emoji: '🌳' },
  { value: 'garden', label: '花园庭院', emoji: '🌷' },
  { value: 'forest', label: '茂密森林', emoji: '🌲' },
  { value: 'forest_edge', label: '林缘地带', emoji: '🌿' },
  { value: 'mountain', label: '山地丘陵', emoji: '⛰️' },
  { value: 'open', label: '开阔田野', emoji: '🌾' },
  { value: 'farmland', label: '农田耕地', emoji: '🚜' },
  { value: 'wetland', label: '沼泽湿地', emoji: '🪴' },
  { value: 'river', label: '河流溪流', emoji: '🏞️' },
  { value: 'lake', label: '湖泊池塘', emoji: '🌊' },
  { value: 'pond', label: '小型水塘', emoji: '💧' },
  { value: 'coast', label: '海岸海边', emoji: '🌅' },
  { value: 'rice_paddy', label: '水稻田', emoji: '🍚' },
  { value: 'reservoir', label: '水库', emoji: '🏝️' },
];

export const WEATHER_OPTIONS: { value: string; label: string; emoji: string }[] = [
  { value: 'sunny', label: '晴朗', emoji: '☀️' },
  { value: 'cloudy', label: '多云', emoji: '⛅' },
  { value: 'rainy', label: '下雨', emoji: '🌧️' },
  { value: 'foggy', label: '雾天', emoji: '🌫️' },
  { value: 'snowy', label: '下雪', emoji: '❄️' },
  { value: 'windy', label: '大风', emoji: '💨' },
];

export const MIGRATION_LABELS: Record<string, { label: string; color: string }> = {
  resident: { label: '留鸟', color: 'bg-forest-100 text-forest-700' },
  summer: { label: '夏候鸟', color: 'bg-orange-100 text-orange-700' },
  winter: { label: '冬候鸟', color: 'bg-sky-100 text-sky-700' },
  passage: { label: '旅鸟', color: 'bg-violet-100 text-violet-700' },
};

export const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export const RARITY_COLORS: Record<string, string> = {
  common: 'from-gray-400 to-gray-500',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-500',
};

export const RARITY_LABELS: Record<string, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};
