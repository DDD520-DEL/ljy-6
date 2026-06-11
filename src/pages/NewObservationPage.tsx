import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Calendar, CloudRain, Camera, ImagePlus, X, Send, Bird as BirdIcon, Sparkles, ArrowLeft, Upload, Thermometer, Wind, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import { WEATHER_OPTIONS } from '../lib/constants';
import { fromLocalInputDate, toLocalInputDate, formatDateShort } from '../lib/format';
import { useMapStore } from '../stores/mapStore';
import { useAuthStore } from '../stores/authStore';
import { useT } from '../i18n';
import { useLanguage } from '../stores/languageStore';
import { fetchWeatherByCoords, getWindDirectionLabel } from '../lib/weather';
import type { Species, WeatherInfo } from '../../shared/types';

const clickIcon = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;border-radius:50%;background:#DC2626;border:3px solid white;box-shadow:0 4px 12px rgba(220,38,38,.4);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;">📍</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function ClickHandler({ setPos, onPosChange }: { setPos: (p: [number, number]) => void; onPosChange?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      setPos([e.latlng.lat, e.latlng.lng]);
      onPosChange?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface PhotoItem {
  url: string;
  thumbnailUrl: string;
  file?: File;
  preview?: string;
}

export default function NewObservationPage() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEdit = !!editId;
  const { user } = useAuthStore();
  const { pendingNewObservation } = useMapStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const t = useT();
  const { lang } = useLanguage();

  const [pos, setPos] = useState<[number, number]>(pendingNewObservation ? [pendingNewObservation.lat, pendingNewObservation.lng] : [39.9087, 116.3975]);
  const [locationName, setLocationName] = useState(pendingNewObservation?.locationName || '');
  const [speciesName, setSpeciesName] = useState('');
  const [speciesId, setSpeciesId] = useState<number | null>(null);
  const [observationTime, setObservationTime] = useState(toLocalInputDate(new Date().toISOString()));
  const [weather, setWeather] = useState('sunny');
  const [temperature, setTemperature] = useState<number | undefined>(undefined);
  const [windDirection, setWindDirection] = useState<string | undefined>(undefined);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [behavior, setBehavior] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [speciesSuggestions, setSpeciesSuggestions] = useState<Species[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTimer, setSearchTimer] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(isEdit);

  const loadWeather = useCallback(async (lat: number, lng: number) => {
    if (isEdit) return;
    setWeatherLoading(true);
    try {
      const info: WeatherInfo = await fetchWeatherByCoords(lat, lng);
      setWeather(info.weather);
      setTemperature(info.temperature);
      setWindDirection(info.windDirection);
    } finally {
      setWeatherLoading(false);
    }
  }, [isEdit]);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    if (!isEdit && !pendingNewObservation) {
      loadWeather(pos[0], pos[1]);
    }
  }, []);

  useEffect(() => {
    if (pendingNewObservation && !isEdit) {
      loadWeather(pendingNewObservation.lat, pendingNewObservation.lng);
    }
  }, [pendingNewObservation, isEdit, loadWeather]);

  useEffect(() => {
    if (isEdit && editId) {
      (async () => {
        try {
          const { data } = await api.get(`/observations/${editId}`);
          if (data.success && data.data) {
            const obs = data.data;
            setPos([obs.latitude, obs.longitude]);
            setLocationName(obs.locationName || '');
            setSpeciesName(obs.speciesName);
            setSpeciesId(obs.speciesId);
            setObservationTime(toLocalInputDate(obs.observationTime));
            setWeather(obs.weather || 'sunny');
            setTemperature(obs.temperature);
            setWindDirection(obs.windDirection);
            setBehavior(obs.behavior || '');
            setDescription(obs.description || '');
            setPhotos(
              (obs.photoUrls || []).map((url: string, i: number) => ({
                url,
                thumbnailUrl: obs.thumbnailUrls?.[i] || url,
              })),
            );
          }
        } finally {
          setPageLoading(false);
        }
      })();
    }
  }, [editId, isEdit]);

  useEffect(() => {
    if (!speciesName || speciesName.length < 1) {
      setSpeciesSuggestions([]);
      return;
    }
    clearTimeout(searchTimer);
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/species', { params: { search: speciesName, limit: 8 } });
        setSpeciesSuggestions(data.data || []);
      } catch {
        setSpeciesSuggestions([]);
      }
    }, 300);
    setSearchTimer(timer);
    return () => clearTimeout(timer);
  }, [speciesName]);

  const selectSpecies = (s: Species) => {
    setSpeciesName(s.name);
    setSpeciesId(s.id);
    setSpeciesSuggestions([]);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: PhotoItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const preview = URL.createObjectURL(file);
      newPhotos.push({ url: '', thumbnailUrl: '', file, preview });
    }

    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 9));

    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const item = prev[index];
      if (item.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadFiles = async (): Promise<PhotoItem[]> => {
    const toUpload = photos.filter((p) => p.file);
    const existing = photos.filter((p) => !p.file);

    if (toUpload.length === 0) return existing;

    setUploading(true);
    try {
      const formData = new FormData();
      toUpload.forEach((p) => {
        if (p.file) formData.append('photos', p.file);
      });
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploaded: PhotoItem[] = (data.data || []).map((item: any) => ({
        url: item.url,
        thumbnailUrl: item.thumbnailUrl,
      }));
      return [...existing, ...uploaded];
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!speciesName || !locationName || !observationTime) return;
    setLoading(true);
    try {
      const uploadedPhotos = await uploadFiles();
      const photoUrls = uploadedPhotos.map((p) => p.url);
      const thumbnailUrls = uploadedPhotos.map((p) => p.thumbnailUrl);

      const body = {
        speciesId,
        speciesName,
        latitude: pos[0],
        longitude: pos[1],
        locationName,
        observationTime: fromLocalInputDate(observationTime),
        weather,
        temperature,
        windDirection,
        behavior,
        description,
        photoUrls,
        thumbnailUrls,
      };

      if (isEdit && editId) {
        const { data } = await api.put(`/observations/${editId}`, body);
        if (data.success) navigate(`/observe/${editId}`);
      } else {
        const { data } = await api.post('/observations', body);
        if (data.success) navigate(`/observe/${data.data.id}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  if (pageLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="card animate-pulse p-8 space-y-4">
          <div className="h-8 bg-sage-100 rounded w-1/3" />
          <div className="h-72 bg-sage-100 rounded" />
          <div className="h-10 bg-sage-100 rounded" />
          <div className="h-10 bg-sage-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sage-600 hover:text-forest-700 mb-6 transition">
        <ArrowLeft className="w-4 h-4" />
        {t('obs_back')}
      </button>

      <div className="mb-8">
        <h1 className="section-title">{isEdit ? t('obs_edit_title') : t('obs_new_title')}</h1>
        <p className="text-sage-600 mt-2">
          {isEdit ? t('obs_edit_desc') : t('obs_new_desc')}
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="card p-5">
            <h2 className="font-display text-lg font-semibold text-forest-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-forest-600" />
              {t('obs_select_location')}
              <span className="text-xs text-rose-500 font-sans">*</span>
            </h2>
            <div className="h-72 rounded-xl overflow-hidden border border-sage-100">
              <MapContainer center={pos} zoom={12} scrollWheelZoom style={{ height: '100%', width: '100%' }} className="!rounded-xl !border-0">
                <TileLayer attribution='OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ClickHandler setPos={setPos} onPosChange={(lat, lng) => !isEdit && loadWeather(lat, lng)} />
                <Marker position={pos} icon={clickIcon}>
                  <Popup>{t('obs_location_on_map')}</Popup>
                </Marker>
              </MapContainer>
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-sage-700 font-medium">{`${t('obs_location_name')} *`}</label>
                <input
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder={t('obs_location_placeholder')}
                  className="input-base mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-sage-700 font-medium">{t('obs_coordinates')}</label>
                <input
                  value={`${pos[0].toFixed(4)}, ${pos[1].toFixed(4)}`}
                  readOnly
                  className="input-base mt-1 bg-sage-50 text-sage-500"
                />
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <h2 className="font-display text-lg font-semibold text-forest-800 flex items-center gap-2">
              <Upload className="w-5 h-5 text-forest-600" />
              {t('obs_photo_upload')}
              <span className="text-xs text-sage-400 font-sans font-normal ml-1">({t('obs_photo_max')})</span>
            </h2>

            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-sage-100 group">
                  <img
                    src={photo.preview || photo.thumbnailUrl || photo.url}
                    alt={`photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-1.5 right-1.5 w-7 h-7 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-1.5 left-1.5 bg-black/40 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {index + 1}/{photos.length}
                  </div>
                </div>
              ))}

              {photos.length < 9 && (
                <div className="aspect-square rounded-xl border-2 border-dashed border-sage-200 hover:border-forest-400 bg-sage-50/50 hover:bg-forest-50/30 flex flex-col items-center justify-center gap-2 cursor-pointer transition group">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,image/heic"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-10 h-10 rounded-xl bg-forest-100 text-forest-600 hover:bg-forest-200 flex items-center justify-center transition"
                      title={t('obs_take_photo')}
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-10 h-10 rounded-xl bg-sage-100 text-sage-600 hover:bg-sage-200 flex items-center justify-center transition"
                      title={t('obs_from_album')}
                    >
                      <ImagePlus className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-sage-400">{t('obs_photo_album')}</p>
                </div>
              )}
            </div>

            {photos.length === 0 && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-forest-50 text-forest-700 hover:bg-forest-100 border border-forest-200 transition"
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-sm font-medium">{t('obs_take_upload')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-sage-50 text-sage-700 hover:bg-sage-100 border border-sage-200 transition"
                >
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-sm font-medium">{t('obs_album_upload')}</span>
                </button>
              </div>
            )}

            {uploading && (
              <div className="flex items-center gap-2 text-sm text-forest-600">
                <div className="w-4 h-4 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
                {t('obs_uploading')}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5 space-y-4">
            <h2 className="font-display text-lg font-semibold text-forest-800 flex items-center gap-2">
              <BirdIcon className="w-5 h-5 text-forest-600" />
              {t('obs_species_info')} <span className="text-xs text-rose-500 font-sans">*</span>
              <button
                onClick={() => navigate('/bird-id')}
                className="ml-auto text-xs text-forest-600 hover:text-forest-700 underline underline-offset-2"
              >
                <span className="inline-flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" />{t('obs_bird_id_link')}</span>
              </button>
            </h2>
            <div className="relative">
              <input
                value={speciesName}
                onChange={(e) => {
                  setSpeciesName(e.target.value);
                  setSpeciesId(null);
                }}
                placeholder={t('obs_species_placeholder')}
                className="input-base"
              />
              {speciesSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 card !rounded-xl z-50 max-h-64 overflow-y-auto">
                  {speciesSuggestions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => selectSpecies(s)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-forest-50 transition text-left"
                    >
                      <img src={s.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <div className="flex-1">
                        <div className="font-medium text-forest-800">{s.name}</div>
                        <div className="text-xs text-sage-500 italic">{s.scientificName}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm text-sage-700 font-medium flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-forest-600" />
                {`${t('obs_time')} *`}
              </label>
              <input type="datetime-local" value={observationTime} onChange={(e) => setObservationTime(e.target.value)} className="input-base mt-1" />
              <div className="text-xs text-sage-400 mt-1">{formatDateShort(fromLocalInputDate(observationTime))}</div>
            </div>

            <div>
              <label className="text-sm text-sage-700 font-medium flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-forest-600" />
                {t('obs_weather')}
                {!isEdit && (
                  <button
                    type="button"
                    onClick={() => loadWeather(pos[0], pos[1])}
                    disabled={weatherLoading}
                    className="ml-auto text-xs text-forest-600 hover:text-forest-700 inline-flex items-center gap-1 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${weatherLoading ? 'animate-spin' : ''}`} />
                    {t('obs_weather_refresh')}
                  </button>
                )}
              </label>

              {(!isEdit) && (temperature !== undefined || windDirection) && (
                <div className="mt-2 mb-3 p-3 bg-forest-50 rounded-xl border border-forest-100 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-rose-500" />
                    <span className="text-sm text-sage-700">
                      {t('obs_temperature')}: <strong className="text-forest-700">{temperature !== undefined ? `${temperature}°C` : '--'}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-sky-500" />
                    <span className="text-sm text-sage-700">
                      {t('obs_wind_direction')}: <strong className="text-forest-700">{windDirection ? getWindDirectionLabel(windDirection, lang as 'zh' | 'en') : '--'}</strong>
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-2 grid grid-cols-3 gap-2">
                {WEATHER_OPTIONS.map((w) => (
                  <button
                    key={w.value}
                    onClick={() => setWeather(w.value)}
                    className={`py-2.5 rounded-xl text-center transition ${
                      weather === w.value ? 'bg-forest-100 text-forest-700 border-2 border-forest-400 shadow-card' : 'bg-sage-50 text-sage-700 border-2 border-transparent hover:bg-sage-100'
                    }`}
                  >
                    <div className="text-xl">{w.emoji}</div>
                    <div className="text-xs mt-0.5">{t(w.labelKey)}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-sage-700 font-medium">{t('obs_behavior')}</label>
              <input
                value={behavior}
                onChange={(e) => setBehavior(e.target.value)}
                placeholder={t('obs_behavior_placeholder')}
                className="input-base mt-1"
              />
            </div>

            <div>
              <label className="text-sm text-sage-700 font-medium">{t('obs_notes')}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder={t('obs_notes_placeholder')}
                className="input-base mt-1 resize-none"
              />
            </div>
          </div>

          <button
            onClick={submit}
            disabled={loading || uploading || !speciesName || !locationName || !observationTime}
            className="btn-primary w-full !py-3.5 text-base flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
            {loading ? (isEdit ? t('obs_saving') : t('obs_publishing')) : isEdit ? t('obs_save') : t('obs_publish')}
          </button>
        </div>
      </div>
    </div>
  );
}
