import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { GitCompareArrows, Search, X, Plus, Ruler, Beaker, Leaf, MapPin, Star, BookOpen } from 'lucide-react';
import api from '../lib/api';
import type { Species } from '../../shared/types';
import {
  FEATHER_COLORS,
  BIRD_SIZES,
  BEAK_SHAPES,
  HABITATS,
  MIGRATION_LABELS,
  getMigrationLabel,
  getBirdSizeLabel,
  getBirdSizeDesc,
  getBeakLabel,
  getFeatherColorLabel,
  getHabitatLabel,
} from '../lib/constants';
import { useT } from '../i18n';

const MAX_COMPARE = 3;

export default function SpeciesComparePage() {
  const t = useT();
  const [allSpecies, setAllSpecies] = useState<Species[]>([]);
  const [selected, setSelected] = useState<Species[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/species', { params: { limit: 200 } }).then(({ data }) => {
      setAllSpecies(data.data || []);
    });
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredSpecies = allSpecies.filter(
    (s) =>
      !selected.find((sel) => sel.id === s.id) &&
      (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.scientificName.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const addSpecies = (sp: Species) => {
    if (selected.length < MAX_COMPARE) {
      setSelected((prev) => [...prev, sp]);
      setSearchQuery('');
      setShowDropdown(false);
    }
  };

  const removeSpecies = (id: number) => {
    setSelected((prev) => prev.filter((s) => s.id !== id));
  };

  const canAdd = selected.length < MAX_COMPARE;

  const colCount = selected.length || 1;

  const compareRows: { label: string; icon: React.ReactNode; render: (sp: Species) => React.ReactNode; key: string }[] = [
    {
      key: 'order',
      label: t('compare_order'),
      icon: <BookOpen className="w-4 h-4" />,
      render: (sp) => <span className="chip !py-1 !px-2.5 bg-forest-50 text-forest-700 text-xs">{sp.order}</span>,
    },
    {
      key: 'family',
      label: t('compare_family'),
      icon: <BookOpen className="w-4 h-4" />,
      render: (sp) => <span className="chip !py-1 !px-2.5 bg-sky-50 text-sky-700 text-xs">{sp.family}</span>,
    },
    {
      key: 'size',
      label: t('compare_size'),
      icon: <Ruler className="w-4 h-4" />,
      render: (sp) => (
        <div>
          <div className="font-semibold text-sage-800">{getBirdSizeLabel(sp.size)}</div>
          <div className="text-xs text-sage-500 mt-0.5">{getBirdSizeDesc(sp.size)}</div>
        </div>
      ),
    },
    {
      key: 'beak',
      label: t('compare_beak'),
      icon: <Beaker className="w-4 h-4" />,
      render: (sp) => (
        <div>
          <div className="font-semibold text-sage-800">{getBeakLabel(sp.beakShape)}</div>
        </div>
      ),
    },
    {
      key: 'featherColor',
      label: t('compare_feather_color'),
      icon: <Star className="w-4 h-4" />,
      render: (sp) => (
        <div className="flex flex-wrap gap-1.5">
          {sp.featherColors.map((c) => {
            const info = FEATHER_COLORS.find((f) => f.value === c);
            return (
              <span key={c} className="chip text-xs gap-1.5 !py-1 !px-2 border border-sage-100 bg-white text-sage-700">
                <span className="w-2.5 h-2.5 rounded-full border border-white shadow-inner" style={{ background: info?.color || '#888' }} />
                {getFeatherColorLabel(c)}
              </span>
            );
          })}
        </div>
      ),
    },
    {
      key: 'habitat',
      label: t('compare_habitat'),
      icon: <Leaf className="w-4 h-4" />,
      render: (sp) => (
        <div className="flex flex-wrap gap-1">
          {sp.habitat.map((h) => {
            const info = HABITATS.find((x) => x.value === h);
            return (
              <span key={h} className="chip !py-0.5 !px-2 text-xs bg-forest-50 text-forest-700">
                {info?.emoji} {getHabitatLabel(h)}
              </span>
            );
          })}
        </div>
      ),
    },
    {
      key: 'migration',
      label: t('compare_migration'),
      icon: <MapPin className="w-4 h-4" />,
      render: (sp) => (
        <span className={`chip !py-1 !px-2.5 text-xs font-medium ${MIGRATION_LABELS[sp.migrationPattern]?.color || ''}`}>
          {getMigrationLabel(sp.migrationPattern)}
        </span>
      ),
    },
    {
      key: 'distribution',
      label: t('compare_distribution'),
      icon: <MapPin className="w-4 h-4" />,
      render: (sp) => (
        <p className="text-sm text-sage-600 leading-relaxed text-left">{sp.distribution}</p>
      ),
    },
    {
      key: 'rarity',
      label: t('compare_rarity'),
      icon: <Star className="w-4 h-4" />,
      render: (sp) => (
        <div className="flex items-center gap-1">
          <span className="text-amber-500">{'★'.repeat(Math.max(1, Math.ceil(sp.rarity / 20)))}</span>
          <span className="text-xs text-sage-500">({sp.rarity}/100)</span>
        </div>
      ),
    },
    {
      key: 'description',
      label: t('compare_description'),
      icon: <BookOpen className="w-4 h-4" />,
      render: (sp) => <p className="text-sm text-sage-600 leading-relaxed">{sp.description}</p>,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
      <div className="text-center mb-10 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-forest-100 text-forest-700 text-sm font-medium mb-4">
          <GitCompareArrows className="w-4 h-4" />
          {t('compare_label')}
        </div>
        <h1 className="section-title !text-3xl md:!text-4xl">{t('compare_title')}</h1>
        <p className="text-sage-600 mt-3 max-w-2xl mx-auto">{t('compare_subtitle')}</p>
      </div>

      <div className="card p-5 sm:p-6 mb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-forest-800 flex items-center gap-2">
            <GitCompareArrows className="w-5 h-5" />
            {t('compare_select_species')}
          </h2>
          <span className="text-sm text-sage-500">
            {t('compare_selected_count')} <strong className="text-forest-700">{selected.length}</strong>/{MAX_COMPARE} {t('compare_species_unit')}
          </span>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          {selected.map((sp) => (
            <div
              key={sp.id}
              className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl bg-forest-50 border border-forest-200 animate-slide-up"
            >
              <img src={sp.imageUrl} alt={sp.name} className="w-8 h-8 rounded-lg object-cover" />
              <span className="text-sm font-medium text-forest-800">{sp.name}</span>
              <button
                onClick={() => removeSpecies(sp.id)}
                className="w-5 h-5 rounded-full bg-forest-200 hover:bg-red-200 text-forest-600 hover:text-red-600 flex items-center justify-center transition"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {canAdd && (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-sage-300 text-sage-500 hover:border-forest-400 hover:text-forest-600 hover:bg-forest-50/50 transition"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">{t('compare_add_species')}</span>
              </button>

              {showDropdown && (
                <div className="absolute top-full left-0 mt-2 w-72 card !p-0 shadow-card-hover z-50 animate-slide-up overflow-hidden">
                  <div className="p-3 border-b border-sage-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('compare_search_placeholder')}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-sage-200 bg-white text-sm focus:outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-100 transition"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredSpecies.length === 0 ? (
                      <div className="py-8 text-center text-sage-400 text-sm">{t('compare_no_results')}</div>
                    ) : (
                      filteredSpecies.map((sp) => (
                        <button
                          key={sp.id}
                          onClick={() => addSpecies(sp)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-forest-50 transition text-left"
                        >
                          <img src={sp.imageUrl} alt={sp.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-sage-800 truncate">{sp.name}</div>
                            <div className="text-xs text-sage-500 italic truncate">{sp.scientificName}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {selected.length >= MAX_COMPARE && (
          <p className="text-xs text-sage-500">{t('compare_max_hint')}</p>
        )}
      </div>

      {selected.length < 2 ? (
        <div className="card py-20 text-center text-sage-400 animate-fade-in">
          <GitCompareArrows className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">{t('compare_empty_hint')}</p>
          <p className="text-sm mt-2 text-sage-400">{t('compare_min_hint')}</p>
        </div>
      ) : (
        <div className="card overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-sage-100">
                  <th className="w-32 sm:w-40 p-4 text-left text-sm font-semibold text-sage-600 bg-sage-50/50">
                    {t('compare_feature')}
                  </th>
                  {selected.map((sp) => (
                    <th key={sp.id} className="p-4 text-center bg-sage-50/50 min-w-[180px]">
                      <Link to={`/species/${sp.id}`} className="group block">
                        <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden mb-2 border-2 border-sage-100 group-hover:border-forest-300 transition">
                          <img src={sp.imageUrl} alt={sp.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="font-display text-base font-semibold text-forest-800 group-hover:text-forest-600 transition">
                          {sp.name}
                        </div>
                        <div className="text-xs text-sage-500 italic">{sp.scientificName}</div>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row, idx) => (
                  <tr key={row.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-sage-50/30'}>
                    <td className="p-4 text-sm font-medium text-sage-600 align-top">
                      <div className="flex items-center gap-2">
                        <span className="text-forest-500">{row.icon}</span>
                        {row.label}
                      </div>
                    </td>
                    {selected.map((sp) => (
                      <td key={sp.id} className="p-4 text-center align-top">
                        {row.render(sp)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
