import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Calendar, Users, ArrowLeft, Send, Bird, ImagePlus, X, Phone } from 'lucide-react';
import api from '../lib/api';
import { fromLocalInputDate, toLocalInputDate } from '../lib/format';
import { useAuthStore } from '../stores/authStore';
import { useT } from '../i18n';

const clickIcon = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;border-radius:50%;background:#0EA5E9;border:3px solid white;box-shadow:0 4px 12px rgba(14,165,233,.4);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;">📍</div>`,
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

function addHours(dateStr: string, hours: number): string {
  const d = new Date(dateStr);
  d.setHours(d.getHours() + hours);
  return toLocalInputDate(d.toISOString());
}

export default function NewBirdingEventPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const t = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const now = new Date();
  now.setDate(now.getDate() + 1);
  now.setHours(8, 0, 0, 0);
  const defaultStart = toLocalInputDate(now.toISOString());

  const [pos, setPos] = useState<[number, number]>([39.9087, 116.3975]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(addHours(defaultStart, 4));
  const [maxParticipants, setMaxParticipants] = useState<number>(20);
  const [contactInfo, setContactInfo] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImageUrl('');
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
  };

  const removeImage = () => {
    setImageFile(null);
    setImageUrl('');
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImage = async (): Promise<string> => {
    if (imageUrl) return imageUrl;
    if (!imageFile) return '';
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photos', imageFile);
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploaded = data.data?.[0];
      return uploaded?.url || '';
    } finally {
      setUploading(false);
    }
  };

  const isValid = () => {
    if (!title.trim()) return false;
    if (!description.trim()) return false;
    if (!locationName.trim()) return false;
    if (!startTime || !endTime) return false;
    if (fromLocalInputDate(startTime) >= fromLocalInputDate(endTime)) return false;
    if (maxParticipants < 1) return false;
    return true;
  };

  const submit = async () => {
    if (!isValid()) return;
    setLoading(true);
    try {
      const uploadedImageUrl = await uploadImage();
      const body = {
        title: title.trim(),
        description: description.trim(),
        locationName: locationName.trim(),
        latitude: pos[0],
        longitude: pos[1],
        startTime: fromLocalInputDate(startTime),
        endTime: fromLocalInputDate(endTime),
        maxParticipants: Number(maxParticipants),
        contactInfo: contactInfo.trim(),
        imageUrl: uploadedImageUrl || undefined,
      };
      const { data } = await api.post('/birding-events', body);
      if (data.success) {
        navigate('/events');
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || t('offline_try_again_later'));
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sage-600 hover:text-forest-700 mb-6 transition">
        <ArrowLeft className="w-4 h-4" />
        {t('obs_back')}
      </button>

      <div className="mb-8">
        <h1 className="section-title">{t('event_new_title')}</h1>
        <p className="text-sage-600 mt-2">{t('event_new_desc')}</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="card p-5">
            <h2 className="font-display text-lg font-semibold text-forest-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-sky-500" />
              {t('event_location')}
              <span className="text-xs text-rose-500 font-sans">*</span>
            </h2>
            <div className="h-72 rounded-xl overflow-hidden border border-sage-100">
              <MapContainer center={pos} zoom={12} scrollWheelZoom style={{ height: '100%', width: '100%' }} className="!rounded-xl !border-0">
                <TileLayer attribution='OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ClickHandler setPos={setPos} />
                <Marker position={pos} icon={clickIcon}>
                  <Popup>{t('event_location')}</Popup>
                </Marker>
              </MapContainer>
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-sage-700 font-medium">{`${t('event_location_name')} *`}</label>
                <input
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder={t('event_location_placeholder')}
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
              <ImagePlus className="w-5 h-5 text-violet-500" />
              {t('event_cover_image')}
            </h2>

            {imagePreview || imageUrl ? (
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-sage-100 group">
                <img
                  src={imagePreview || imageUrl}
                  alt="cover"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={removeImage}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="aspect-[16/9] rounded-xl border-2 border-dashed border-sage-200 hover:border-sky-400 bg-sage-50/50 hover:bg-sky-50/30 flex flex-col items-center justify-center gap-3 cursor-pointer transition"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600">
                  <ImagePlus className="w-7 h-7" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-sage-700">{t('event_upload_hint')}</p>
                  <p className="text-xs text-sage-400 mt-1">{t('event_optional')}</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            )}

            {uploading && (
              <div className="flex items-center gap-2 text-sm text-sky-600">
                <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                {t('obs_uploading')}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5 space-y-4">
            <div>
              <label className="text-sm text-sage-700 font-medium flex items-center gap-1.5">
                <Bird className="w-4 h-4 text-sky-500" />
                {`${t('event_title')} *`}
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('event_title_placeholder')}
                maxLength={50}
                className="input-base mt-1"
              />
              <div className="text-xs text-sage-400 mt-1 text-right">{title.length}/50</div>
            </div>

            <div>
              <label className="text-sm text-sage-700 font-medium">{`${t('event_description')} *`}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder={t('event_desc_placeholder')}
                className="input-base mt-1 resize-none"
              />
              <div className="text-xs text-sage-400 mt-1 text-right">{description.length}/500</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-sage-700 font-medium flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-sky-500" />
                  {`${t('event_start_time')} *`}
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input-base mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-sage-700 font-medium flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  {`${t('event_end_time')} *`}
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="input-base mt-1"
                />
              </div>
            </div>

            {startTime && endTime && fromLocalInputDate(startTime) >= fromLocalInputDate(endTime) && (
              <div className="text-xs text-rose-500 bg-rose-50 px-3 py-2 rounded-lg">
                {t('event_time_error')}
              </div>
            )}

            <div>
              <label className="text-sm text-sage-700 font-medium flex items-center gap-1.5">
                <Users className="w-4 h-4 text-forest-500" />
                {`${t('event_max_participants')} *`}
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="input-base mt-1"
              />
              <div className="flex gap-2 mt-2">
                {[10, 20, 30, 50].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMaxParticipants(n)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition ${
                      maxParticipants === n
                        ? 'bg-forest-500 text-white'
                        : 'bg-sage-100 text-sage-600 hover:bg-sage-200'
                    }`}
                  >
                    {n}人
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-sage-700 font-medium flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-sage-500" />
                {t('event_contact')}
                <span className="text-xs text-sage-400 font-normal ml-1">({t('event_optional')})</span>
              </label>
              <input
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder={t('event_contact_placeholder')}
                className="input-base mt-1"
              />
            </div>
          </div>

          <button
            onClick={submit}
            disabled={loading || uploading || !isValid()}
            className="btn-primary w-full !py-3.5 text-base flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
            {loading ? t('event_publishing') : t('event_publish_btn')}
          </button>
        </div>
      </div>
    </div>
  );
}
