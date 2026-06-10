import { Link } from 'react-router-dom';
import { Eye, Ruler, Beaker } from 'lucide-react';
import type { Species, SpeciesMatch } from '../../shared/types';
import { getMigrationLabel, getFeatherColorLabel, getBirdSizeLabel, MIGRATION_LABELS } from '../lib/constants';
import { useT } from '../i18n';

interface Props {
  species: Species | SpeciesMatch;
  showScore?: boolean;
}

export function SpeciesCard({ species, showScore }: Props) {
  const sp = species as any;
  const t = useT();
  const score = showScore ? sp.matchScore : undefined;

  return (
    <Link to={`/species/${species.id}`} className="card group block overflow-hidden animate-fade-in">
      <div className="relative aspect-[4/3] overflow-hidden bg-sage-50">
        <img
          src={species.imageUrl}
          alt={species.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-2 right-2">
          <span className={`chip text-xs !py-1 !px-2 ${MIGRATION_LABELS[species.migrationPattern]?.color || ''}`}>
            {getMigrationLabel(species.migrationPattern)}
          </span>
        </div>
        {score !== undefined && (
          <div className="absolute bottom-2 left-2 right-2">
            <div className="bg-white/90 backdrop-blur rounded-xl px-3 py-2 shadow-card">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-forest-700">{t('bird_id_match_score')}</span>
                <span className="text-sm font-bold text-forest-700">{score}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-sage-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-forest-400 to-forest-600 rounded-full transition-all"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg font-semibold text-forest-800 group-hover:text-forest-600 transition">
          {species.name}
        </h3>
        <div className="text-xs text-sage-500 italic mt-0.5">{species.scientificName}</div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {species.featherColors.slice(0, 3).map((c) => (
            <span key={c} className="text-[11px] px-2 py-0.5 rounded-full bg-sage-100 text-sage-700 capitalize">
              {getFeatherColorLabel(c)}
            </span>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-sage-600">
          <div className="flex items-center gap-1">
            <Ruler className="w-3 h-3 text-forest-500" />
            {getBirdSizeLabel(species.size)}
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-forest-500" />
            {t('obs_detail_rarity')} {rarityLabel(species.rarity)}
          </div>
        </div>
      </div>
    </Link>
  );
}

function rarityLabel(r: number) {
  if (r <= 20) return '★';
  if (r <= 40) return '★★';
  if (r <= 60) return '★★★';
  if (r <= 80) return '★★★★';
  return '★★★★★';
}
