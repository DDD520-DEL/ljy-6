import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, Ruler, Beaker, MapPin, Leaf, Calendar, Sparkles, Home, Star, Bookmark, BookmarkCheck, Database } from 'lucide-react';
import api from '../lib/api';
import type { Species, Observation } from '../../shared/types';
import { ObservationCard } from '../components/ObservationCard';
import { FEATHER_COLORS, BIRD_SIZES, BEAK_SHAPES, HABITATS, MIGRATION_LABELS, getMigrationLabel, getBirdSizeLabel, getBirdSizeDesc, getBeakLabel, getBeakDesc, getFeatherColorLabel, getHabitatLabel } from '../lib/constants';
import { useAuthStore } from '../stores/authStore';
import { useT } from '../i18n';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { offlineCache } from '../lib/offlineCache';

const markerIcon = L.divIcon({
  className: '',
  html: `<div style="width:30px;height:30px;border-radius:50%;background:#52B788;border:3px solid white;box-shadow:0 4px 12px rgba(82,183,136,.4);display:flex;align-items:center;justify-content:center;color:white;font-size:15px;">📍</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

export default function SpeciesDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: curUser } = useAuthStore();
  const isOnline = useOnlineStatus();
  const t = useT();
  const [species, setSpecies] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCollected, setIsCollected] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [usingCache, setUsingCache] = useState(false);

  const numericId = Number(id);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setUsingCache(false);
      try {
        const { data } = await api.get(`/species/${id}`);
        setSpecies(data.data);
        offlineCache.setSpeciesDetail(numericId, data.data);

        if (curUser) {
          try {
            const res = await api.get(`/collections/check/${id}`);
            setIsCollected(res.data.data);
          } catch {
            setIsCollected(offlineCache.isSpeciesCollected(curUser.id, numericId));
          }
        }
      } catch (err) {
        console.warn('从服务器加载物种详情失败，尝试使用缓存:', err);
        let cached = offlineCache.getSpeciesDetail(numericId);
        if (!cached) {
          const speciesList = offlineCache.getSpeciesList();
          const basic = speciesList?.find((s) => s.id === numericId);
          if (basic) {
            const relatedObs = offlineCache.getObservationsBySpecies(numericId);
            cached = { ...basic, observations: relatedObs };
          }
        }
        if (cached) {
          setSpecies(cached);
          setUsingCache(true);
        }
        if (curUser) {
          setIsCollected(offlineCache.isSpeciesCollected(curUser.id, numericId));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id, curUser, numericId]);

  const toggleCollect = async () => {
    if (!curUser) return navigate('/login');
    if (collecting) return;
    setCollecting(true);
    try {
      if (isCollected) {
        try {
          await api.delete(`/collections/${id}`);
        } catch (err) {
          if (!isOnline) {
            offlineCache.removeCollection(curUser.id, numericId);
          } else {
            throw err;
          }
        }
        setIsCollected(false);
        offlineCache.removeCollection(curUser.id, numericId);
      } else {
        try {
          await api.post(`/collections/${id}`);
        } catch (err) {
          if (!isOnline) {
            offlineCache.addCollection(curUser.id, numericId);
          } else {
            throw err;
          }
        }
        setIsCollected(true);
        offlineCache.addCollection(curUser.id, numericId);
      }
    } finally {
      setCollecting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="card overflow-hidden animate-pulse">
          <div className="grid md:grid-cols-2">
            <div className="aspect-square bg-sage-100" />
            <div className="p-8 space-y-4" />
          </div>
        </div>
      </div>
    );
  }

  if (!species) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20">
        <div className="card py-20 text-center text-sage-400">
          <p className="text-xl">{t('species_not_found')}</p>
          <Link to="/bird-id" className="btn-primary mt-6 inline-flex">{t('species_back_bird_id')}</Link>
        </div>
      </div>
    );
  }

  const sp = species as Species & { observations: Observation[] };
  const observations = sp.observations || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sage-600 hover:text-forest-700 mb-6 transition">
        <ArrowLeft className="w-4 h-4" />
        {t('obs_back')}
      </button>

      <div className="card overflow-hidden animate-fade-in mb-8">
        <div className="grid md:grid-cols-5">
          <div className="md:col-span-2 aspect-square md:aspect-auto md:h-full bg-sage-50 relative overflow-hidden">
            <img src={sp.imageUrl} alt={sp.name} className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4 space-y-2">
              <span className={`chip !py-1.5 !px-3 text-sm font-medium ${MIGRATION_LABELS[sp.migrationPattern]?.color}`}>
                {getMigrationLabel(sp.migrationPattern)}
              </span>
              <div className="chip !py-1.5 !px-3 text-sm font-medium bg-white/90 backdrop-blur text-forest-700 shadow-card">
                {t('obs_detail_rarity')} {'★'.repeat(Math.max(1, Math.ceil(sp.rarity / 20)))}
              </div>
            </div>
          </div>

          <div className="md:col-span-3 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-3xl sm:text-4xl font-bold text-forest-800">{sp.name}</h1>
                  {usingCache && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-forest-50 text-forest-600 border border-forest-100 font-medium">
                      <Database className="w-3 h-3" />
                      {t('offline_cached_label')}
                    </span>
                  )}
                </div>
                <p className="text-sage-500 italic text-lg mt-1">{sp.scientificName}</p>
                <div className="flex items-center gap-2 mt-2 text-sm text-sage-500">
                  <span className="chip !py-1 !px-2.5 bg-forest-50 text-forest-700">{sp.order}</span>
                  <span className="chip !py-1 !px-2.5 bg-sky-50 text-sky-700">{sp.family}</span>
                </div>
              </div>
              <button
                onClick={toggleCollect}
                disabled={collecting}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                  isCollected
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 shadow-soft'
                    : 'bg-white text-sage-600 border border-sage-200 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50'
                } ${collecting ? 'opacity-60 cursor-wait' : ''}`}
              >
                {isCollected ? (
                  <>
                    <BookmarkCheck className="w-5 h-5" />
                    <span>{t('species_collected')}</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-5 h-5" />
                    <span>{t('species_collect')}</span>
                  </>
                )}
              </button>
            </div>
            {usingCache && (
              <div className="mt-3 text-xs text-sage-500 bg-amber-50/60 border border-amber-100 rounded-xl px-3 py-2">
                {t('offline_using_cache')}
              </div>
            )}

            <div className="mt-5 grid sm:grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-sage-100 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center shrink-0">
                  <Ruler className="w-5 h-5 text-forest-700" />
                </div>
                <div>
                  <div className="text-xs text-sage-500">{t('species_size')}</div>
                  <div className="font-semibold text-sage-800">{getBirdSizeLabel(sp.size)}</div>
                  <div className="text-xs text-sage-500 mt-0.5">{getBirdSizeDesc(sp.size)}</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-sage-100 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                  <Beaker className="w-5 h-5 text-sky-700" />
                </div>
                <div>
                  <div className="text-xs text-sage-500">{t('species_beak')}</div>
                  <div className="font-semibold text-sage-800">{getBeakLabel(sp.beakShape)}</div>
                  <div className="text-xs text-sage-500 mt-0.5">{getBeakDesc(sp.beakShape)}</div>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-semibold text-sage-700 mb-2.5">{t('species_feather_color')}</h3>
              <div className="flex flex-wrap gap-2">
                {sp.featherColors.map((c) => {
                  const info = FEATHER_COLORS.find((f) => f.value === c);
                  return (
                    <span
                      key={c}
                      className="chip text-xs gap-2 !py-1.5 !px-3 border border-sage-100 bg-white text-sage-700"
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-white shadow-inner"
                        style={{ background: info?.color || '#888' }}
                      />
                      {getFeatherColorLabel(c)}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-semibold text-sage-700 mb-2.5 flex items-center gap-1.5">
                <Leaf className="w-4 h-4 text-forest-500" />
                {t('species_habitat')}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {sp.habitat.map((h) => {
                  const info = HABITATS.find((x) => x.value === h);
                  return (
                    <span key={h} className="chip !py-1 !px-2.5 text-xs bg-forest-50 text-forest-700">
                      {info?.emoji} {getHabitatLabel(h)}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-forest-50 to-white border border-forest-100">
              <h3 className="font-display text-lg font-semibold text-forest-800 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-forest-600" />
                {t('species_description')}
              </h3>
              <p className="text-sage-700 leading-relaxed">{sp.description}</p>
            </div>
          </div>
        </div>
      </div>

      {observations.length > 0 && (
        <>
          <h2 className="section-title mb-6 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-forest-600" />
            {t('species_obs_locations')}
          </h2>
          <div className="card overflow-hidden mb-8">
            <div className="h-80">
              <MapContainer
                center={observations.length > 0 && observations[0]?.latitude ? [observations[0].latitude, observations[0].longitude] : [32, 115]}
                zoom={5}
                style={{ height: '100%', width: '100%' }}
                className="!rounded-none !border-0"
              >
                <TileLayer attribution='OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {observations.map((o) => (
                  <Marker key={o.id} position={[o.latitude, o.longitude]} icon={markerIcon}>
                    <Popup>
                      <Link to={`/observe/${o.id}`} className="block -m-3 p-3 min-w-[200px]">
                        {(o.thumbnailUrls?.[0] || o.photoUrls?.[0]) && <img src={o.thumbnailUrls?.[0] || o.photoUrls[0]} className="w-full h-24 object-cover rounded-lg mb-2" />}
                        <div className="font-medium text-forest-800">{o.locationName}</div>
                        <div className="text-xs text-sage-500">{o.user?.username}</div>
                      </Link>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          <h2 className="section-title mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-forest-600" />
            {t('species_community_obs')} <span className="text-base font-sans text-sage-500">({observations.length})</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {observations.map((o, i) => (
              <div key={o.id} style={{ animationDelay: `${i * 50}ms` }} className="animate-slide-up">
                <ObservationCard observation={o} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
