import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Filter, Plus, Calendar, MapPin, Bird, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import type { Observation, Species } from '../../shared/types';
import { ObservationCard } from '../components/ObservationCard';
import { useAuthStore } from '../stores/authStore';
import { useMapStore } from '../stores/mapStore';
import { formatDateTime } from '../lib/format';
import { useT } from '../i18n';
import { getMigrationLabel } from '../lib/constants';

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

function makeIcon(color = '#2D6A4F') {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;color:white;font-size:16px;">🐦</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

export default function MapHomePage() {
  const t = useT();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { mapCenter, mapZoom, setMapCenter, setPendingNewObservation, flyTo } = useMapStore();
  const [observations, setObservations] = useState<Observation[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<number | null>(null);
  const [selectedObs, setSelectedObs] = useState<Observation | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [obsRes, spRes] = await Promise.all([
        api.get('/observations', { params: { limit: 100, search: search || undefined } }),
        api.get('/species', { params: { limit: 30 } }),
      ]);
      setObservations(obsRes.data.data || []);
      setSpecies(spRes.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

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
              <h2 className="section-title !text-xl">{t('map_title')}</h2>
              <button
                onClick={() => setShowSidebar((v) => !v)}
                className="p-2 rounded-xl hover:bg-sage-100 text-sage-600 lg:hidden"
              >
                <ChevronRight className={`w-5 h-5 transition-transform ${showSidebar ? 'rotate-180' : ''}`} />
              </button>
            </div>
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

            {filteredObs.map((obs) => (
              <Marker
                key={obs.id}
                position={[obs.latitude, obs.longitude]}
                icon={makeIcon(selectedObs?.id === obs.id ? '#DC2626' : undefined)}
                eventHandlers={{ click: () => setSelectedObs(obs) }}
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
            ))}
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
        </div>
      </div>
    </div>
  );
}
