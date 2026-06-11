import { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Filter, Plus, Calendar, MapPin, Bird, ChevronRight, Database, Star, Trash2, CheckCircle, X, Tag as TagIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import type { Observation, Species, Tag } from '../../shared/types';
import { ObservationCard } from '../components/ObservationCard';
import { useAuthStore } from '../stores/authStore';
import { useMapStore } from '../stores/mapStore';
import { useLocationFavoriteStore } from '../stores/locationFavoriteStore';
import { formatDateTime } from '../lib/format';
import { useT } from '../i18n';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { offlineCache } from '../lib/offlineCache';

function MapEventsHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapFlyer({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom ?? map.getZoom(), { animate: true });
  }, [center, zoom, map]);
  return null;
}

function makeIcon(color = '#2D6A4F', isFavorited = false) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:3px solid ${isFavorited ? '#F59E0B' : 'white'};box-shadow:0 4px 12px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;color:white;font-size:16px;position:relative;">
      🐦
      ${isFavorited ? '<div style="position:absolute;top:-6px;right:-6px;width:16px;height:16px;background:#F59E0B;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;">⭐</div>' : ''}
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

export default function MapHomePage() {
  const t = useT();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { mapCenter, mapZoom, setPendingNewObservation, flyTo } = useMapStore();
  const { favorites, loadFavorites, addFavorite, removeFavorite, isFavorite } = useLocationFavoriteStore();
  const isOnline = useOnlineStatus();
  const [observations, setObservations] = useState<Observation[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<number | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [selectedObs, setSelectedObs] = useState<Observation | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [usingCache, setUsingCache] = useState(false);
  const [favoriteDialog, setFavoriteDialog] = useState<{
    show: boolean;
    lat: number;
    lng: number;
    locationName: string;
    speciesName?: string;
    observationId?: number;
    thumbnailUrl?: string;
    isExisting: boolean;
    favoriteId?: number;
  } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setUsingCache(false);
    try {
      const params: any = { limit: 100 };
      if (search) params.search = search;
      if (selectedTagIds.length > 0) params.tagIds = selectedTagIds.join(',');

      const [obsRes, spRes, tagRes] = await Promise.all([
        api.get('/observations', { params }),
        api.get('/species', { params: { limit: 30 } }),
        api.get('/tags'),
      ]);
      const obsData = obsRes.data.data || [];
      const spData = spRes.data.data || [];
      const tagData = tagRes.data.data || [];
      setObservations(obsData);
      setSpecies(spData);
      setAllTags(tagData);

      if (!search) {
        offlineCache.setObservationsBasic(obsData);
        offlineCache.setSpeciesList(spData);
        offlineCache.setTagsList(tagData);
      }
    } catch (err) {
      console.warn('从服务器加载数据失败，尝试使用缓存:', err);
      const cachedObs = search
        ? offlineCache.searchObservations(search, 100)
        : offlineCache.getObservationsBasic();
      const cachedSpecies = offlineCache.getSpeciesList();
      const cachedTags = offlineCache.getTagsList();
      let filtered = cachedObs;
      if (cachedObs && selectedTagIds.length > 0) {
        filtered = cachedObs.filter((o) =>
          o.tags?.some((t) => selectedTagIds.includes(t.id)),
        );
      }
      if (filtered) setObservations(filtered);
      if (cachedSpecies) setSpecies(cachedSpecies.slice(0, 30));
      if (cachedTags) setAllTags(cachedTags);
      if ((filtered || cachedSpecies || cachedTags)) setUsingCache(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedTagIds]);

  useEffect(() => {
    if (!isOnline && !loading) {
      const cachedObs = search
        ? offlineCache.searchObservations(search, 100)
        : offlineCache.getObservationsBasic();
      const cachedSpecies = offlineCache.getSpeciesList();
      const cachedTags = offlineCache.getTagsList();
      let filtered = cachedObs;
      if (cachedObs && selectedTagIds.length > 0) {
        filtered = cachedObs.filter((o) =>
          o.tags?.some((t) => selectedTagIds.includes(t.id)),
        );
      }
      if (filtered && observations.length === 0) setObservations(filtered);
      if (cachedSpecies && species.length === 0) setSpecies(cachedSpecies.slice(0, 30));
      if (cachedTags && allTags.length === 0) setAllTags(cachedTags);
      if ((filtered || cachedSpecies || cachedTags)) setUsingCache(true);
    }
  }, [isOnline, selectedTagIds]);

  useEffect(() => {
    if (user) {
      loadFavorites(user.id);
    }
  }, [user, loadFavorites]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleLongPressStart = (obs: Observation) => {
    if (!user) {
      navigate('/login');
      return;
    }
    longPressTimer.current = setTimeout(() => {
      const existing = favorites.find(
        (f) => Math.abs(f.latitude - obs.latitude) < 0.000001 && Math.abs(f.longitude - obs.longitude) < 0.000001
      );
      setFavoriteDialog({
        show: true,
        lat: obs.latitude,
        lng: obs.longitude,
        locationName: obs.locationName || t('map_unknown_location'),
        speciesName: obs.speciesName,
        observationId: obs.id,
        thumbnailUrl: obs.thumbnailUrls?.[0] || obs.photoUrls?.[0],
        isExisting: !!existing,
        favoriteId: existing?.id,
      });
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleConfirmFavorite = () => {
    if (!favoriteDialog || !user) return;

    if (favoriteDialog.isExisting && favoriteDialog.favoriteId) {
      removeFavorite(user.id, favoriteDialog.favoriteId);
      setToast({ message: t('favorites_removed'), type: 'success' });
    } else {
      addFavorite(user.id, {
        latitude: favoriteDialog.lat,
        longitude: favoriteDialog.lng,
        locationName: favoriteDialog.locationName,
        speciesName: favoriteDialog.speciesName,
        observationId: favoriteDialog.observationId,
        thumbnailUrl: favoriteDialog.thumbnailUrl,
      });
      setToast({ message: t('favorites_added'), type: 'success' });
    }
    setFavoriteDialog(null);
  };

  const filteredObs = useMemo(() => {
    let list = observations;
    if (speciesFilter) list = list.filter((o) => o.speciesId === speciesFilter);
    return list;
  }, [observations, speciesFilter]);

  const handleMapClick = (lat: number, lng: number) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setPendingNewObservation({ lat, lng, locationName: t('map_selected_location') });
    navigate('/observe/new');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] relative">
      <div className="h-[calc(100vh-4rem)] w-full flex">
        <aside className={`${showSidebar ? 'w-80 xl:w-96' : 'w-0'} transition-all duration-300 border-r border-sage-100 bg-white/80 overflow-hidden flex-shrink-0 flex flex-col`}>
          <div className="p-4 border-b border-sage-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="section-title !text-xl">{t('map_title')}</h2>
                {usingCache && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-forest-50 text-forest-600 border border-forest-100 font-medium">
                    <Database className="w-3 h-3" />
                    {t('offline_cached_label')}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowSidebar((v) => !v)}
                className="p-2 rounded-xl hover:bg-sage-100 text-sage-600 lg:hidden"
              >
                <ChevronRight className={`w-5 h-5 transition-transform ${showSidebar ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {usingCache && (
              <div className="text-xs text-sage-500 bg-amber-50/60 border border-amber-100 rounded-xl px-3 py-2">
                {t('offline_using_cache')}
              </div>
            )}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-sage-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('map_search_placeholder')}
                className="input-base pl-10 !py-2.5"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSpeciesFilter(null)}
                className={`chip text-xs ${speciesFilter === null ? 'chip-active' : 'chip-default'}`}
              >
                {t('map_filter_all')}
              </button>
              {species.slice(0, 8).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSpeciesFilter(speciesFilter === s.id ? null : s.id)}
                  className={`chip text-xs ${speciesFilter === s.id ? 'chip-active' : 'chip-default'}`}
                  title={s.name}
                >
                  <span className="w-2 h-2 rounded-full bg-forest-400" />
                  {s.name}
                </button>
              ))}
            </div>

            {allTags.length > 0 && (
              <div>
                <div className="text-[11px] text-sage-500 font-medium mb-1.5 flex items-center gap-1">
                  <TagIcon className="w-3 h-3" />
                  {t('tag_filter')}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedTagIds([])}
                    className={`chip text-xs ${selectedTagIds.length === 0 ? 'chip-active' : 'chip-default'}`}
                  >
                    {t('tag_filter_all')}
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => {
                        setSelectedTagIds((prev) =>
                          prev.includes(tag.id)
                            ? prev.filter((id) => id !== tag.id)
                            : [...prev, tag.id],
                        );
                      }}
                      className={`chip text-xs ${selectedTagIds.includes(tag.id) ? 'chip-active' : 'chip-default'}`}
                      title={tag.name}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="card p-4 animate-pulse">
                    <div className="h-20 bg-sage-100 rounded-xl mb-3" />
                    <div className="h-4 bg-sage-100 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-sage-100 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : filteredObs.length === 0 ? (
              <div className="text-center py-16 text-sage-400">
                <Bird className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('map_no_observations')}</p>
                <p className="text-xs mt-1">{t('map_click_to_add')}</p>
              </div>
            ) : (
              filteredObs.map((obs) => (
                <div
                  key={obs.id}
                  onClick={() => {
                    setSelectedObs(obs);
                    flyTo(obs.latitude, obs.longitude, 13);
                  }}
                  className="cursor-pointer"
                >
                  <ObservationCard observation={obs} compact onUpdate={fetchData} />
                </div>
              ))
            )}
          </div>
        </aside>

        <div className="flex-1 relative">
          <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom className="w-full h-full !rounded-none !border-0" style={{ height: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapFlyer center={mapCenter} zoom={mapZoom} />
            <MapEventsHandler onMapClick={handleMapClick} />

            {filteredObs.map((obs) => {
              const favorited = isFavorite(obs.latitude, obs.longitude, user?.id);
              return (
                <Marker
                  key={obs.id}
                  position={[obs.latitude, obs.longitude]}
                  icon={makeIcon(selectedObs?.id === obs.id ? '#DC2626' : undefined, favorited)}
                  eventHandlers={{
                    click: () => setSelectedObs(obs),
                    contextmenu: (e) => {
                      e.originalEvent.preventDefault();
                      handleLongPressStart(obs);
                    },
                    mousedown: () => handleLongPressStart(obs),
                    mouseup: handleLongPressEnd,
                    mouseout: handleLongPressEnd,
                    ...({
                      touchstart: () => handleLongPressStart(obs),
                      touchend: handleLongPressEnd,
                      touchcancel: handleLongPressEnd,
                    } as any),
                  }}
                >
                <Popup>
                  <div className="p-0 overflow-hidden -mx-2 -my-1" style={{ minWidth: 260 }}>
                    {(obs.thumbnailUrls?.[0] || obs.photoUrls?.[0]) && (
                      <img src={obs.thumbnailUrls?.[0] || obs.photoUrls[0]} alt="" className="w-full h-32 object-cover" />
                    )}
                    <div className="p-3">
                      <div className="font-display font-semibold text-forest-800">{obs.speciesName}</div>
                      <div className="text-xs text-sage-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {obs.locationName || t('map_unknown_location')}
                      </div>
                      <div className="text-xs text-sage-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {formatDateTime(obs.observationTime)}
                      </div>
                      <Link
                        to={`/observe/${obs.id}`}
                        className="mt-3 block text-center py-2 text-sm rounded-xl bg-forest-600 text-white hover:bg-forest-700 transition"
                      >
                        {t('map_view_detail')}
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
              );
            })}
          </MapContainer>

          {!showSidebar && (
            <button
              onClick={() => setShowSidebar(true)}
              className="absolute top-4 left-4 z-[1000] card !p-3 hover:shadow-card-hover"
            >
              <Filter className="w-5 h-5 text-forest-700" />
            </button>
          )}

          <button
            onClick={() => (user ? navigate('/observe/new') : navigate('/login'))}
            className="absolute bottom-6 right-6 z-[1000] btn-primary !rounded-full !px-5 !py-3.5 shadow-card-hover flex items-center gap-2 animate-float"
          >
            <Plus className="w-5 h-5" />
            {t('nav_record')}
          </button>

          <div className="absolute bottom-6 left-6 z-[1000] card !px-4 !py-3 flex items-center gap-2 text-sm text-sage-700">
            <Bird className="w-4 h-4 text-forest-600" />
            <span>
              {t('map_count_word')} <strong className="text-forest-700">{filteredObs.length}</strong> {t('map_total_observations')}
            </span>
          </div>

          {favoriteDialog && (
            <div className="fixed inset-0 z-[2000] bg-black/40 flex items-center justify-center p-4">
              <div className="card max-w-sm w-full animate-slide-up">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-forest-800 text-lg">
                    {favoriteDialog.isExisting ? t('favorites_remove_title') : t('favorites_add_title')}
                  </h3>
                  <button
                    onClick={() => setFavoriteDialog(null)}
                    className="p-1.5 rounded-lg hover:bg-sage-100 text-sage-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {favoriteDialog.thumbnailUrl && (
                  <img
                    src={favoriteDialog.thumbnailUrl}
                    alt=""
                    className="w-full h-40 object-cover rounded-xl mb-4"
                  />
                )}

                <div className="space-y-2 mb-6">
                  {favoriteDialog.speciesName && (
                    <div className="font-semibold text-forest-800">
                      {favoriteDialog.speciesName}
                    </div>
                  )}
                  <div className="text-sm text-sage-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {favoriteDialog.locationName}
                  </div>
                  <div className="text-xs text-sage-400">
                    {favoriteDialog.lat.toFixed(4)}, {favoriteDialog.lng.toFixed(4)}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setFavoriteDialog(null)}
                    className="flex-1 btn-secondary text-sm py-2.5"
                  >
                    {t('favorites_cancel')}
                  </button>
                  <button
                    onClick={handleConfirmFavorite}
                    className={`flex-1 text-sm py-2.5 rounded-xl font-medium transition ${
                      favoriteDialog.isExisting
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                        : 'bg-amber-500 text-white hover:bg-amber-600'
                    }`}
                  >
                    {favoriteDialog.isExisting ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <Trash2 className="w-4 h-4" />
                        {t('favorites_remove')}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <Star className="w-4 h-4" />
                        {t('favorites_add')}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {toast && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[2000] animate-slide-up">
              <div className={`card !px-5 !py-3 flex items-center gap-2.5 shadow-card-hover`}>
                {toast.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-forest-500" />
                ) : (
                  <X className="w-5 h-5 text-red-500" />
                )}
                <span className="text-sm font-medium text-sage-700">{toast.message}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
