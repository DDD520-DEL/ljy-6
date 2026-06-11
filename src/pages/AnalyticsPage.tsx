import { useEffect, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet/dist/leaflet.css';
import { TrendingUp, BarChart3, Calendar, Flame, Eye, Bird, Download, MapPin, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../lib/api';
import type { Species, SeasonalItem, FrequencyItem } from '../../shared/types';
import { SpeciesCard } from '../components/SpeciesCard';
import { getMonths } from '../lib/constants';
import { useT } from '../i18n';

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
  const t = useT();
  const [overview, setOverview] = useState<any>(null);
  const [freq, setFreq] = useState<FrequencyItem[]>([]);
  const [seasonal, setSeasonal] = useState<SeasonalItem[]>([]);
  const [heatmap, setHeatmap] = useState<[number, number, number][]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [speciesId, setSpeciesId] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [exportSpeciesId, setExportSpeciesId] = useState<number | null>(null);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportLocationName, setExportLocationName] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const freqChartRef = useRef<ReactECharts>(null);
  const seasonChartRef = useRef<ReactECharts>(null);
  const monthSeasonChartRef = useRef<ReactECharts>(null);
  const heatmapContainerRef = useRef<HTMLDivElement>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const freqParams: any = { limit: 15 };
      if (startDate) freqParams.startDate = startDate;
      if (endDate) freqParams.endDate = endDate;

      const heatParams: any = {};
      if (speciesId) heatParams.speciesId = speciesId;
      if (month !== null) heatParams.month = month;
      if (startDate) heatParams.startDate = startDate;
      if (endDate) heatParams.endDate = endDate;

      const seasonalParams: any = {};
      if (speciesId) seasonalParams.speciesId = speciesId;
      if (startDate) seasonalParams.startDate = startDate;
      if (endDate) seasonalParams.endDate = endDate;

      const [overviewRes, freqRes, seasonalRes, heatRes, speciesRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/frequency', { params: freqParams }),
        api.get('/analytics/seasonal', Object.keys(seasonalParams).length > 0 ? { params: seasonalParams } : undefined),
        api.get('/analytics/heatmap', { params: heatParams }),
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

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      const addText = (text: string, x: number, y: number, fontSize: number, isBold = false) => {
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        pdf.setFontSize(fontSize);
        pdf.text(text, x, y);
      };

      const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };

      addText(t('analytics_title'), margin, yPosition, 18, true);
      yPosition += 8;
      pdf.setDrawColor(45, 106, 79);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      addText(`${t('analytics_export_generated')}: ${new Date().toLocaleString()}`, margin, yPosition, 10);
      yPosition += 6;

      const dateRangeParts: string[] = [];
      if (startDate) dateRangeParts.push(`${t('analytics_start_date')}: ${formatDate(startDate)}`);
      if (endDate) dateRangeParts.push(`${t('analytics_end_date')}: ${formatDate(endDate)}`);
      if (speciesId) {
        const sp = species.find((s) => s.id === speciesId);
        if (sp) dateRangeParts.push(`${t('analytics_species_type')}: ${sp.name}`);
      }
      if (month !== null) dateRangeParts.push(`${t('analytics_month')}: ${getMonths()[month - 1]}`);

      if (dateRangeParts.length > 0) {
        addText(dateRangeParts.join('  |  '), margin, yPosition, 10);
        yPosition += 8;
      }

      if (overview) {
        addText(t('analytics_data_summary'), margin, yPosition, 12, true);
        yPosition += 7;
        const summaryItems = [
          `${t('analytics_total_obs')}: ${overview.totalObservations || 0}`,
          `${t('analytics_total_species')}: ${overview.totalSpecies || 0}`,
          `${t('analytics_active_users')}: ${overview.totalUsers || 0}`,
          `${t('analytics_total_comments')}: ${overview.totalComments || 0}`,
        ];
        summaryItems.forEach((item) => {
          addText(`  • ${item}`, margin, yPosition, 10);
          yPosition += 5;
        });
        yPosition += 5;
      }

      const addImageSection = async (title: string, dataUrl: string, height: number) => {
        if (yPosition + height + 15 > pageHeight) {
          pdf.addPage();
          yPosition = margin;
        }
        addText(title, margin, yPosition, 12, true);
        yPosition += 7;
        const imgWidth = pageWidth - margin * 2;
        const imgHeight = height;
        pdf.addImage(dataUrl, 'PNG', margin, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10;
      };

      if (freqChartRef.current) {
        const freqInstance = freqChartRef.current.getEchartsInstance();
        const freqDataUrl = freqInstance.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: '#ffffff',
        });
        await addImageSection(t('analytics_freq_ranking'), freqDataUrl, 70);
      }

      if (seasonChartRef.current) {
        const seasonInstance = seasonChartRef.current.getEchartsInstance();
        const seasonDataUrl = seasonInstance.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: '#ffffff',
        });
        await addImageSection(t('analytics_monthly_pattern'), seasonDataUrl, 60);
      }

      if (monthSeasonChartRef.current) {
        const monthSeasonInstance = monthSeasonChartRef.current.getEchartsInstance();
        const monthSeasonDataUrl = monthSeasonInstance.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: '#ffffff',
        });
        await addImageSection(t('analytics_season_distribution'), monthSeasonDataUrl, 60);
      }

      if (heatmapContainerRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const canvas = await html2canvas(heatmapContainerRef.current, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
        });
        const heatmapDataUrl = canvas.toDataURL('image/png');
        await addImageSection(t('analytics_migration_heatmap'), heatmapDataUrl, 65);
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      pdf.save(`${t('analytics_pdf_filename')}_${dateStr}.pdf`);
    } catch (err) {
      console.error('PDF 导出失败:', err);
      alert(t('analytics_export_failed'));
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: any = {};
      if (exportSpeciesId) params.speciesId = exportSpeciesId;
      if (exportStartDate) params.startDate = exportStartDate;
      if (exportEndDate) params.endDate = exportEndDate;
      if (exportLocationName) params.locationName = exportLocationName;

      const response = await api.get('/observations/export/excel', {
        params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `${t('analytics_total_obs')}_${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('导出失败:', err);
      alert(t('analytics_export_failed'));
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [speciesId, month, startDate, endDate]);

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
    xAxis: { type: 'category', data: getMonths(), axisLine: { lineStyle: { color: '#8FC0A0' } } },
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
        { name: t('season_spring') },
        { name: t('season_summer') },
        { name: t('season_autumn') },
        { name: t('season_winter') },
      ],
      shape: 'circle',
      splitArea: { areaStyle: { color: ['rgba(143,192,160,0.08)', 'rgba(221,236,226,0.15)'] } },
    },
    series: [{
      type: 'radar',
      data: [{
        name: t('season_appearances'),
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
          {t('analytics_data_insight')}
        </div>
        <h1 className="section-title !text-3xl md:!text-4xl">{t('analytics_title')}</h1>
        <p className="text-sage-600 mt-3">{t('analytics_subtitle')}</p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Eye, label: t('analytics_total_obs'), value: overview?.totalObservations || 0, color: 'from-forest-400 to-forest-600' },
          { icon: Bird, label: t('analytics_total_species'), value: overview?.totalSpecies || 0, color: 'from-sky-400 to-sky-600' },
          { icon: TrendingUp, label: t('analytics_active_users'), value: overview?.totalUsers || 0, color: 'from-earth-400 to-earth-600' },
          { icon: Flame, label: t('analytics_total_comments'), value: overview?.totalComments || 0, color: 'from-rose-400 to-rose-600' },
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

      <div className="card p-6 mb-8 animate-slide-up">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center shadow-card">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-forest-800">{t('analytics_filter')}</h2>
            <p className="text-sm text-sage-500">{t('analytics_filter_desc')}</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-1.5">
              <Bird className="w-3.5 h-3.5 inline mr-1" />
              {t('analytics_species_type')}
            </label>
            <select
              value={speciesId ?? ''}
              onChange={(e) => setSpeciesId(e.target.value ? Number(e.target.value) : null)}
              className="input-base w-full"
            >
              <option value="">{t('analytics_all_species')}</option>
              {species.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-1.5">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              {t('analytics_start_date')}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-base w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-1.5">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              {t('analytics_end_date')}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-base w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-1.5">
              <Flame className="w-3.5 h-3.5 inline mr-1" />
              {t('analytics_month')}
            </label>
            <select
              value={month ?? ''}
              onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : null)}
              className="input-base w-full"
            >
              <option value="">{t('analytics_all_year')}</option>
              {getMonths().map((m, i) => { return <option key={i + 1} value={i + 1}>{m}</option>; })}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-sage-500">
            {t('analytics_filter_hint')}
          </p>
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf || loading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-forest-500 to-forest-700 text-white font-medium shadow-lg shadow-forest-500/30 hover:shadow-xl hover:shadow-forest-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {exportingPdf ? t('analytics_exporting_pdf') : t('analytics_export_pdf')}
          </button>
        </div>
      </div>

      <div className="card p-6 mb-8 animate-slide-up">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-card">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-forest-800">{t('analytics_export')}</h2>
            <p className="text-sm text-sage-500">{t('analytics_export_desc')}</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-1.5">
              <Bird className="w-3.5 h-3.5 inline mr-1" />
              {t('analytics_species_type')}
            </label>
            <select
              value={exportSpeciesId ?? ''}
              onChange={(e) => setExportSpeciesId(e.target.value ? Number(e.target.value) : null)}
              className="input-base w-full"
            >
              <option value="">{t('analytics_all_species')}</option>
              {species.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-1.5">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              {t('analytics_start_date')}
            </label>
            <input
              type="date"
              value={exportStartDate}
              onChange={(e) => setExportStartDate(e.target.value)}
              className="input-base w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-1.5">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              {t('analytics_end_date')}
            </label>
            <input
              type="date"
              value={exportEndDate}
              onChange={(e) => setExportEndDate(e.target.value)}
              className="input-base w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-1.5">
              <MapPin className="w-3.5 h-3.5 inline mr-1" />
              {t('analytics_location')}
            </label>
            <input
              type="text"
              placeholder={t('analytics_location_placeholder')}
              value={exportLocationName}
              onChange={(e) => setExportLocationName(e.target.value)}
              className="input-base w-full"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-sage-500">
            {t('analytics_export_hint')}
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {exporting ? t('analytics_exporting') : t('analytics_export_excel')}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <h2 className="font-display text-xl font-semibold text-forest-800 flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              {t('analytics_freq_ranking')}
            </h2>
          </div>
          <ReactECharts ref={freqChartRef} option={freqOption} style={{ height: 380 }} notMerge={true} />
        </div>

        <div className="card p-5">
          <h2 className="font-display text-xl font-semibold text-forest-800 mb-5 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-500" />
            {t('analytics_monthly_pattern')}
          </h2>
          <ReactECharts ref={seasonChartRef} option={seasonOption} style={{ height: 300 }} />
        </div>

        <div className="card p-5">
          <h2 className="font-display text-xl font-semibold text-forest-800 mb-5">{t('analytics_season_distribution')}</h2>
          <ReactECharts ref={monthSeasonChartRef} option={monthSeasonOption} style={{ height: 300 }} />
        </div>

        <div className="card overflow-hidden lg:col-span-2">
          <div className="p-5 flex flex-wrap items-center justify-between gap-4 border-b border-sage-100">
            <h2 className="font-display text-xl font-semibold text-forest-800 flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              {t('analytics_migration_heatmap')}
            </h2>
          </div>
          <div ref={heatmapContainerRef} className="h-[420px]">
            <MapContainer center={[32.5, 114]} zoom={5} style={{ height: '100%', width: '100%' }} className="!rounded-none !border-0">
              <TileLayer attribution='OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <HeatmapLayer points={heatmap} />
            </MapContainer>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="font-display text-xl font-semibold text-forest-800 mb-5 mt-2">{t('analytics_species_guide')}</h2>
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
