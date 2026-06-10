import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Calendar, CloudRain, Upload, Send, Bird as BirdIcon, Sparkles, ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import { WEATHER_OPTIONS } from '../lib/constants';
import { fromLocalInputDate, toLocalInputDate, formatDateShort } from '../lib/format';
import { useMapStore } from '../stores/mapStore';
import { useAuthStore } from '../stores/authStore';
import type { Species } from '../../shared/types';

const clickIcon = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;border-radius:50%;background:#DC2626;border:3px solid white;box-shadow:0 4px 12px rgba(220,38,38,.4);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;">📍</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function ClickHandler({ setPos }: { setPos: (p: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPos([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function NewObservationPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { pendingNewObservation } = useMapStore();

  const [pos, setPos] = useState<[number, number]>(pendingNewObservation ? [pendingNewObservation.lat, pendingNewObservation.lng] : [39.9087, 116.3975]);
  const [locationName, setLocationName] = useState(pendingNewObservation?.locationName || '');
  const [speciesName, setSpeciesName] = useState('');
  const [speciesId, setSpeciesId] = useState<number | null>(null);
  const [observationTime, setObservationTime] = useState(toLocalInputDate(new Date().toISOString()));
  const [weather, setWeather] = useState('sunny');
  const [behavior, setBehavior] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [speciesSuggestions, setSpeciesSuggestions] = useState<Species[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTimer, setSearchTimer] = useState<any>(null);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    if (!speciesName || speciesName.length < 1) {
      setSpeciesSuggestions([]);
      return;
    }
    clearTimeout(searchTimer);
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/species', { params: { search: speciesName, limit: 8 } });
        setSpeciesSuggestions(data.data || []);
      } catch {
        setSpeciesSuggestions([]);
      }
    }, 300);
    setSearchTimer(t);
    return () => clearTimeout(t);
  }, [speciesName]);

  const selectSpecies = (s: Species) => {
    setSpeciesName(s.name);
    setSpeciesId(s.id);
    setSpeciesSuggestions([]);
    if (!photoUrl) setPhotoUrl(s.imageUrl);
  };

  const submit = async () => {
    if (!speciesName || !locationName || !observationTime) return;
    setLoading(true);
    try {
      const body = {
        speciesId,
        speciesName,
        latitude: pos[0],
        longitude: pos[1],
        locationName,
        observationTime: fromLocalInputDate(observationTime),
        weather,
        behavior,
        description,
        photoUrls: photoUrl ? [photoUrl] : [`https://picsum.photos/seed/bird${Date.now()}/600/400`],
      };
      const { data } = await api.post('/observations', body);
      if (data.success) {
        navigate(`/observe/${data.data.id}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sage-600 hover:text-forest-700 mb-6 transition">
        <ArrowLeft className="w-4 h-4" />
        返回
      </button>

      <div className="mb-8">
        <h1 className="section-title">记录新观测</h1>
        <p className="text-sage-600 mt-2">在地图上选择位置，填写观测信息，分享你发现的城市飞羽 🐦</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="card p-5">
            <h2 className="font-display text-lg font-semibold text-forest-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-forest-600" />
              选择观测位置
              <span className="text-xs text-rose-500 font-sans">*</span>
            </h2>
            <div className="h-72 rounded-xl overflow-hidden border border-sage-100">
              <MapContainer center={pos} zoom={12} scrollWheelZoom style={{ height: '100%', width: '100%' }} className="!rounded-xl !border-0">
                <TileLayer attribution='OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ClickHandler setPos={setPos} />
                <Marker position={pos} icon={clickIcon}>
                  <Popup>观测位置</Popup>
                </Marker>
              </MapContainer>
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-sage-700 font-medium">位置名称 *</label>
                <input
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="例如：北京·朝阳公园"
                  className="input-base mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-sage-700 font-medium">坐标</label>
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
              照片链接
            </h2>
            <input
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="粘贴图片URL（可选，如留空将自动生成）"
              className="input-base"
            />
            {photoUrl && (
              <img src={photoUrl} alt="预览" className="w-full max-h-64 object-cover rounded-xl border border-sage-100" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5 space-y-4">
            <h2 className="font-display text-lg font-semibold text-forest-800 flex items-center gap-2">
              <BirdIcon className="w-5 h-5 text-forest-600" />
              物种信息 <span className="text-xs text-rose-500 font-sans">*</span>
              <button
                onClick={() => navigate('/bird-id')}
                className="ml-auto text-xs text-forest-600 hover:text-forest-700 underline underline-offset-2"
              >
                <span className="inline-flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" />识鸟助手</span>
              </button>
            </h2>
            <div className="relative">
              <input
                value={speciesName}
                onChange={(e) => {
                  setSpeciesName(e.target.value);
                  setSpeciesId(null);
                }}
                placeholder="输入鸟类名称，例如：麻雀"
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
                观测时间 *
              </label>
              <input type="datetime-local" value={observationTime} onChange={(e) => setObservationTime(e.target.value)} className="input-base mt-1" />
              <div className="text-xs text-sage-400 mt-1">{formatDateShort(fromLocalInputDate(observationTime))}</div>
            </div>

            <div>
              <label className="text-sm text-sage-700 font-medium flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-forest-600" />
                天气状况
              </label>
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
                    <div className="text-xs mt-0.5">{w.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-sage-700 font-medium">鸟类行为描述</label>
              <input
                value={behavior}
                onChange={(e) => setBehavior(e.target.value)}
                placeholder="例如：在地面啄食、枝头鸣唱..."
                className="input-base mt-1"
              />
            </div>

            <div>
              <label className="text-sm text-sage-700 font-medium">观测备注</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="详细描述你观察到的情况，包括数量、周围环境等..."
                className="input-base mt-1 resize-none"
              />
            </div>
          </div>

          <button
            onClick={submit}
            disabled={loading || !speciesName || !locationName || !observationTime}
            className="btn-primary w-full !py-3.5 text-base flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
            {loading ? '发布中...' : '发布观测记录'}
          </button>
        </div>
      </div>
    </div>
  );
}
