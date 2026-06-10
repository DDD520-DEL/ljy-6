import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, Ruler, Beaker, MapPin, Leaf, Calendar, Sparkles, Home } from 'lucide-react';
import api from '../lib/api';
import type { Species, Observation } from '../../shared/types';
import { ObservationCard } from '../components/ObservationCard';
import { FEATHER_COLORS, BIRD_SIZES, BEAK_SHAPES, HABITATS, MIGRATION_LABELS } from '../lib/constants';

const markerIcon = L.divIcon({
  className: '',
  html: `<div style="width:30px;height:30px;border-radius:50%;background:#52B788;border:3px solid white;box-shadow:0 4px 12px rgba(82,183,136,.4);display:flex;align-items:center;justify-content:center;color:white;font-size:15px;">📍</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

export default function SpeciesDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [species, setSpecies] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/species/${id}`);
        setSpecies(data.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

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
          <p className="text-xl">物种不存在</p>
          <Link to="/bird-id" className="btn-primary mt-6 inline-flex">返回识鸟助手</Link>
        </div>
      </div>
    );
  }

  const sp = species as Species & { observations: Observation[] };
  const observations = sp.observations || [];
  const sizeInfo = BIRD_SIZES.find((s) => s.value === sp.size);
  const beakInfo = BEAK_SHAPES.find((b) => b.value === sp.beakShape);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sage-600 hover:text-forest-700 mb-6 transition">
        <ArrowLeft className="w-4 h-4" />
        返回
      </button>

      <div className="card overflow-hidden animate-fade-in mb-8">
        <div className="grid md:grid-cols-5">
          <div className="md:col-span-2 aspect-square md:aspect-auto md:h-full bg-sage-50 relative overflow-hidden">
            <img src={sp.imageUrl} alt={sp.name} className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4 space-y-2">
              <span className={`chip !py-1.5 !px-3 text-sm font-medium ${MIGRATION_LABELS[sp.migrationPattern]?.color}`}>
                {MIGRATION_LABELS[sp.migrationPattern]?.label}
              </span>
              <div className="chip !py-1.5 !px-3 text-sm font-medium bg-white/90 backdrop-blur text-forest-700 shadow-card">
                稀有度 {'★'.repeat(Math.max(1, Math.ceil(sp.rarity / 20)))}
              </div>
            </div>
          </div>

          <div className="md:col-span-3 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold text-forest-800">{sp.name}</h1>
                <p className="text-sage-500 italic text-lg mt-1">{sp.scientificName}</p>
              </div>
            </div>

            <div className="mt-5 grid sm:grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-sage-100 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center shrink-0">
                  <Ruler className="w-5 h-5 text-forest-700" />
                </div>
                <div>
                  <div className="text-xs text-sage-500">体型大小</div>
                  <div className="font-semibold text-sage-800">{sizeInfo?.label || sp.size}</div>
                  <div className="text-xs text-sage-500 mt-0.5">{sizeInfo?.desc}</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-sage-100 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                  <Beaker className="w-5 h-5 text-sky-700" />
                </div>
                <div>
                  <div className="text-xs text-sage-500">喙的形状</div>
                  <div className="font-semibold text-sage-800">{beakInfo?.label || sp.beakShape}</div>
                  <div className="text-xs text-sage-500 mt-0.5">{beakInfo?.desc}</div>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-semibold text-sage-700 mb-2.5">羽毛颜色</h3>
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
                      {info?.label || c}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-semibold text-sage-700 mb-2.5 flex items-center gap-1.5">
                <Leaf className="w-4 h-4 text-forest-500" />
                栖息地
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {sp.habitat.map((h) => {
                  const info = HABITATS.find((x) => x.value === h);
                  return (
                    <span key={h} className="chip !py-1 !px-2.5 text-xs bg-forest-50 text-forest-700">
                      {info?.emoji} {info?.label || h}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-forest-50 to-white border border-forest-100">
              <h3 className="font-display text-lg font-semibold text-forest-800 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-forest-600" />
                物种简介
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
            观测地点分布
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
                        {o.photoUrls?.[0] && <img src={o.photoUrls[0]} className="w-full h-24 object-cover rounded-lg mb-2" />}
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
            社区观测记录 <span className="text-base font-sans text-sage-500">({observations.length})</span>
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
