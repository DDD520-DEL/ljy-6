import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet/dist/leaflet.css';
import { TrendingUp, BarChart3, Calendar, Flame, Eye, Bird } from 'lucide-react';
import api from '../lib/api';
import type { Species, SeasonalItem, FrequencyItem } from '../../shared/types';
import { SpeciesCard } from '../components/SpeciesCard';
import { MONTHS } from '../lib/constants';

const HEAT_GRADIENT = {
  '0.2': '#2D6A4F',
  '0.4': '#52B788',
  '0.6': '#D8F3DC',
  '0.8': '#F9C74F',
  '1.0': '#E63946',
};

function HeatmapLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();
  useEffect(() => {
    let layer: any = null;
    if (points.length > 0 && (L as any).heatLayer) {
      layer = (L as any).heatLayer(points, { radius: 25, blur: 30, maxZoom: 13, gradient: HEAT_GRADIENT }).addTo(map);
    }
    return () => { if (layer && map.hasLayer(layer)) map.removeLayer(layer); };
  }, [map, points]);
  return null;
}

function calcSeasonSum(seasonal: SeasonalItem[], months: number[]) {
  return seasonal.filter((s) => months.includes(s.month)).reduce((a, b) => a + b.count, 0);
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [freq, setFreq] = useState<FrequencyItem[]>([]);
  const [seasonal, setSeasonal] = useState<SeasonalItem[]>([]);
  const [heatmap, setHeatmap] = useState<[number, number, number][]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [speciesId, setSpeciesId] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [overviewRes, freqRes, seasonalRes, heatRes, speciesRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/frequency', { params: { limit: 15 } }),
        api.get('/analytics/seasonal', speciesId ? { params: { speciesId } } : undefined),
        api.get('/analytics/heatmap', { params: { speciesId, month } }),
        api.get('/species', { params: { limit: 50 } }),
      ]);
      setOverview(overviewRes.data.data);
      setFreq(freqRes.data.data || []);
      setSeasonal(seasonalRes.data.data || []);
      setHeatmap(heatRes.data.data || []);
      setSpecies(speciesRes.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [speciesId, month]);

  const freqOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 80, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'value', axisLine: { lineStyle: { color: '#8FC0A0' } } },
    yAxis: {
      type: 'category',
      data: freq.map((f) => f.speciesName).reverse(),
      axisLine: { lineStyle: { color: '#8FC0A0' } },
    },
    series: [{
      type: 'bar',
      data: freq.map((f) => f.count).reverse(),
      itemStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [
          { offset: 0, color: '#8FC0A0' }, { offset: 1, color: '#2D6A4F' },
        ] },
        borderRadius: [0, 8, 8, 0],
      },
      barWidth: 22,
      label: { show: true, position: 'right', color: '#2D6A4F', fontWeight: 600 },
    }],
  };

  const seasonOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: MONTHS, axisLine: { lineStyle: { color: '#8FC0A0' } } },
    yAxis: { type: 'value', axisLine: { lineStyle: { color: '#8FC0A0' } } },
    series: [{
      type: 'line',
      data: seasonal.map((s) => s.count),
      smooth: true,
      symbolSize: 10,
      lineStyle: { color: '#2D6A4F', width: 3 },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
          { offset: 0, color: 'rgba(45,106,79,0.5)' }, { offset: 1, color: 'rgba(45,106,79,0.02)' },
        ] },
      },
      itemStyle: { color: '#2D6A4F' },
    }],
  };

  const springSum = calcSeasonSum(seasonal, [3, 4, 5]);
  const summerSum = calcSeasonSum(seasonal, [6, 7, 8]);
  const autumnSum = calcSeasonSum(seasonal, [9, 10, 11]);
  const winterSum = calcSeasonSum(seasonal, [12, 1, 2]);

  const monthSeasonOption = {
    tooltip: { trigger: 'item' },
    radar: {
      indicator: [
        { name: '春 (3-5)' },
        { name: '夏 (6-8)' },
        { name: '秋 (9-11)' },
        { name: '冬 (12-2)' },
      ],
      shape: 'circle',
      splitArea: { areaStyle: { color: ['rgba(143,192,160,0.08)', 'rgba(221,236,226,0.15)'] } },
    },
    series: [{
      type: 'radar',
      data: [{
        name: '出现次数',
        value: [springSum, summerSum, autumnSum, winterSum],
        areaStyle: { color: 'rgba(85,167,128,0.5)' },
        lineStyle: { color: '#2D6A4F', width: 2 },
        itemStyle: { color: '#2D6A4F' },
      }],
    }],
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 sm:py-10">
      <div className="mb-10 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 text-sky-700 text-sm font-medium mb-4">
          <BarChart3 className="w-4 h-4" />
          数据洞察
        </div>
        <h1 className="section-title !text-3xl md:!text-4xl">物种分析 · 城市野鸟数据中心</h1>
        <p className="text-sage-600 mt-3">观测数据的频率排行、季节性规律与迁徙热力图</p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Eye, label: '观测记录', value: overview?.totalObservations || 0, color: 'from-forest-400 to-forest-600' },
          { icon: Bird, label: '物种数量', value: overview?.totalSpecies || 0, color: 'from-sky-400 to-sky-600' },
          { icon: TrendingUp, label: '活跃观鸟者', value: overview?.totalUsers || 0, color: 'from-earth-400 to-earth-600' },
          { icon: Flame, label: '社区评论', value: overview?.totalComments || 0, color: 'from-rose-400 to-rose-600' },
        ].map((s, i) => (
          <div key={i} className="card p-5 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-card`}>
                <s.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="font-display text-3xl font-bold text-forest-800">{s.value}</div>
            <div className="text-sm text-sage-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <h2 className="font-display text-xl font-semibold text-forest-800 flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              物种出现频率排行
            </h2>
            <div className="flex items-center gap-2">
              <select value={speciesId ?? ''} onChange={(e) => setSpeciesId(e.target.value ? Number(e.target.value) : null)} className="input-base !py-2 text-sm">
                <option value="">全部物种</option>
                {species.map((s) => { return <option key={s.id} value={s.id}>{s.name}</option>; })}
              </select>
            </div>
          </div>
          <ReactECharts option={freqOption} style={{ height: 380 }} notMerge={true} />
        </div>

        <div className="card p-5">
          <h2 className="font-display text-xl font-semibold text-forest-800 mb-5 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-500" />
            月度出现规律
          </h2>
          <ReactECharts option={seasonOption} style={{ height: 300 }} />
        </div>

        <div className="card p-5">
          <h2 className="font-display text-xl font-semibold text-forest-800 mb-5">四季分布</h2>
          <ReactECharts option={monthSeasonOption} style={{ height: 300 }} />
        </div>

        <div className="card overflow-hidden lg:col-span-2">
          <div className="p-5 flex flex-wrap items-center justify-between gap-4 border-b border-sage-100">
            <h2 className="font-display text-xl font-semibold text-forest-800 flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              迁徙热力图
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <select value={speciesId ?? ''} onChange={(e) => setSpeciesId(e.target.value ? Number(e.target.value) : null)} className="input-base !py-2 text-sm">
                <option value="">全部物种</option>
                {species.map((s) => { return <option key={s.id} value={s.id}>{s.name}</option>; })}
              </select>
              <select value={month ?? ''} onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : null)} className="input-base !py-2 text-sm">
                <option value="">全年</option>
                {MONTHS.map((m, i) => { return <option key={i + 1} value={i + 1}>{m}</option>; })}
              </select>
            </div>
          </div>
          <div className="h-[420px]">
            <MapContainer center={[32.5, 114]} zoom={5} style={{ height: '100%', width: '100%' }} className="!rounded-none !border-0">
              <TileLayer attribution='OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <HeatmapLayer points={heatmap} />
            </MapContainer>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="font-display text-xl font-semibold text-forest-800 mb-5 mt-2">常见物种图鉴</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {species.slice(0, 8).map((sp, i) => (
              <div key={sp.id} style={{ animationDelay: `${i * 60}ms` }} className="animate-slide-up">
                <SpeciesCard species={sp} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
