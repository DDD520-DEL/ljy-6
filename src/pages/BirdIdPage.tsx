import { useState, useEffect } from 'react';
import { Sparkles, Bird, ChevronRight, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import type { BirdSize, BeakShape, SpeciesMatch } from '../../shared/types';
import { SpeciesCard } from '../components/SpeciesCard';
import { BIRD_SIZES, BEAK_SHAPES, FEATHER_COLORS, HABITATS } from '../lib/constants';

export default function BirdIdPage() {
  const [size, setSize] = useState<BirdSize | ''>('');
  const [beak, setBeak] = useState<BeakShape | ''>('');
  const [colors, setColors] = useState<string[]>([]);
  const [habitats, setHabitats] = useState<string[]>([]);
  const [results, setResults] = useState<SpeciesMatch[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleColor = (c: string) => setColors((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]));
  const toggleHabitat = (h: string) => setHabitats((s) => (s.includes(h) ? s.filter((x) => x !== h) : [...s, h]));

  const filtersCount = (size ? 1 : 0) + (beak ? 1 : 0) + colors.length + habitats.length;

  const search = async () => {
    if (filtersCount === 0) {
      const { data } = await api.get('/species', { params: { limit: 30 } });
      setResults((data.data || []).map((s: any) => ({ ...s, matchScore: 50 })));
      return;
    }
    setLoading(true);
    try {
      const params: any = {};
      if (size) params.size = size;
      if (beak) params.beakShape = beak;
      if (colors.length) params.featherColors = colors.join(',');
      if (habitats.length) params.habitat = habitats.join(',');
      const { data } = await api.get('/species/match', { params });
      setResults(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    search();
  }, []);

  const reset = () => {
    setSize(''); setBeak(''); setColors([]); setHabitats([]);
    setTimeout(search, 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
      <div className="text-center mb-10 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-forest-100 text-forest-700 text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          AI 辅助识鸟
        </div>
        <h1 className="section-title !text-3xl md:!text-4xl">基于特征筛选 · 辅助识鸟</h1>
        <p className="text-sage-600 mt-3 max-w-2xl mx-auto">
          选择你观察到的鸟类特征，系统将自动匹配最相似的物种。特征选择越多，识别越精准！
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-4 xl:col-span-3 space-y-4">
          <div className="card p-5 space-y-5 sticky top-20">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-forest-800 flex items-center gap-2">
                <Bird className="w-5 h-5" />
                特征筛选器
              </h2>
              <button onClick={reset} className="text-xs text-sage-500 hover:text-forest-700 flex items-center gap-1 transition">
                <RefreshCw className="w-3.5 h-3.5" />
                重置
              </button>
            </div>

            {filtersCount > 0 && (
              <div className="text-sm p-3 rounded-xl bg-forest-50 text-forest-700">
                已选择 <strong>{filtersCount}</strong> 个特征条件
              </div>
            )}

            <FilterGroup title="体型大小" hint="BIRD_SIZE">
              <div className="grid grid-cols-2 gap-2">
                {BIRD_SIZES.map((b) => (
                  <button
                    key={b.value}
                    onClick={() => setSize(size === b.value ? '' : (b.value as BirdSize))}
                    className={`p-3 rounded-xl text-left transition border-2 ${
                      size === b.value ? 'bg-forest-100 border-forest-400 text-forest-700' : 'bg-white border-sage-100 text-sage-700 hover:border-forest-200 hover:bg-forest-50/50'
                    }`}
                  >
                    <div className="text-2xl">{b.icon}</div>
                    <div className="text-sm font-semibold mt-1">{b.label}</div>
                    <div className="text-[11px] opacity-70">{b.desc}</div>
                  </button>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup title="喙的形状" hint="BEAK">
              <div className="grid grid-cols-1 gap-2">
                {BEAK_SHAPES.map((b) => (
                  <button
                    key={b.value}
                    onClick={() => setBeak(beak === b.value ? '' : (b.value as BeakShape))}
                    className={`px-4 py-3 rounded-xl text-left transition flex items-center justify-between border-2 ${
                      beak === b.value ? 'bg-forest-100 border-forest-400 text-forest-700' : 'bg-white border-sage-100 text-sage-700 hover:border-forest-200'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold">{b.label}</div>
                      <div className="text-[11px] opacity-70">{b.desc}</div>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition ${beak === b.value ? 'opacity-100' : 'opacity-30'}`} />
                  </button>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup title={`羽毛颜色 (${colors.length})`} hint="COLOR">
              <div className="flex flex-wrap gap-2">
                {FEATHER_COLORS.map((c) => {
                  const active = colors.includes(c.value);
                  return (
                    <button
                      key={c.value}
                      onClick={() => toggleColor(c.value)}
                      className={`chip !px-3 !py-1.5 gap-1.5 border-2 transition ${
                        active ? 'chip-active border-forest-500' : 'bg-white border-sage-200 text-sage-700 hover:border-forest-300'
                      }`}
                      style={active ? {} : { background: c.color + '15' }}
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-white shadow-inner" style={{ background: c.color }} />
                      <span className="text-xs">{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </FilterGroup>

            <FilterGroup title={`栖息地 (${habitats.length})`} hint="HABITAT">
              <div className="flex flex-wrap gap-1.5">
                {HABITATS.map((h) => {
                  const active = habitats.includes(h.value);
                  return (
                    <button
                      key={h.value}
                      onClick={() => toggleHabitat(h.value)}
                      className={`chip !px-2.5 !py-1.5 gap-1 text-xs border-2 transition ${
                        active ? 'chip-active border-forest-500' : 'bg-white border-sage-200 text-sage-700 hover:border-forest-300'
                      }`}
                    >
                      <span>{h.emoji}</span>
                      <span>{h.label}</span>
                    </button>
                  );
                })}
              </div>
            </FilterGroup>

            <button onClick={search} disabled={loading} className="btn-primary w-full !py-3 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              {loading ? '匹配中...' : '开始识别匹配'}
            </button>
          </div>
        </aside>

        <section className="lg:col-span-8 xl:col-span-9">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-forest-800">
              候选物种 <span className="text-sm font-sans text-sage-500">({results.length} 种)</span>
            </h2>
          </div>
          {loading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-sage-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-5 bg-sage-100 rounded w-2/3" />
                    <div className="h-3 bg-sage-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="card py-20 text-center text-sage-400">
              <Bird className="w-16 h-16 mx-auto mb-4 opacity-40" />
              <p className="text-lg font-medium">没有找到匹配物种</p>
              <p className="text-sm mt-2">尝试减少筛选条件，或选择其他特征</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {results.map((sp, idx) => (
                <div key={sp.id} style={{ animationDelay: `${idx * 50}ms` }} className="animate-slide-up">
                  <SpeciesCard species={sp} showScore={filtersCount > 0} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-sage-700 mb-2.5">{title}</h3>
      {children}
    </div>
  );
}
