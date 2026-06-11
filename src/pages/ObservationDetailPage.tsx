import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, CloudRain, Heart, MessageCircle, Send, Sparkles, Binoculars, Pencil, ChevronLeft, ChevronRight, X, Database, Thermometer, Wind } from 'lucide-react';
import api from '../lib/api';
import type { Observation } from '../../shared/types';
import { ObservationCard } from '../components/ObservationCard';
import { useAuthStore } from '../stores/authStore';
import { useLanguage } from '../stores/languageStore';
import { timeAgo, formatDateTime } from '../lib/format';
import { MIGRATION_LABELS, getMigrationLabel, getWeatherLabel } from '../lib/constants';
import { getWindDirectionLabel } from '../lib/weather';
import { useT } from '../i18n';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { offlineCache } from '../lib/offlineCache';

function Lightbox({ photos, initialIndex, onClose }: { photos: string[]; initialIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(initialIndex);

  const goNext = useCallback(() => setIndex((i) => (i + 1) % photos.length), [photos.length]);
  const goPrev = useCallback(() => setIndex((i) => (i - 1 + photos.length) % photos.length), [photos.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, goNext, goPrev]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition z-10">
        <X className="w-6 h-6" />
      </button>

      <div className="relative max-w-[90vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        <img
          src={photos[index]}
          alt={`照片 ${index + 1}`}
          className="max-w-full max-h-[85vh] object-contain rounded-lg"
        />

        {photos.length > 1 && (
          <>
            <button onClick={goPrev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={goNext} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition">
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1.5 rounded-full">
          {index + 1} / {photos.length}
        </div>
      </div>
    </div>
  );
}

export default function ObservationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: curUser } = useAuthStore();
  const isOnline = useOnlineStatus();
  const [obs, setObs] = useState<Observation | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [usingCache, setUsingCache] = useState(false);
  const t = useT();
  const { lang } = useLanguage();

  const numericId = Number(id);

  const fetchData = async () => {
    setLoading(true);
    setUsingCache(false);
    try {
      const { data } = await api.get(`/observations/${id}`);
      setObs(data.data);
      offlineCache.setObservationDetail(numericId, data.data);
      if (data.data?.user) {
        offlineCache.addUserToCache(data.data.user);
      }
    } catch (err) {
      console.warn('从服务器加载观测详情失败，尝试使用缓存:', err);
      let cached = offlineCache.getObservationDetail(numericId);
      if (!cached) {
        const basicList = offlineCache.getObservationsBasic();
        const basic = basicList?.find((o) => o.id === numericId);
        if (basic) cached = basic;
      }
      if (cached) {
        setObs(cached);
        setUsingCache(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, numericId]);

  useEffect(() => {
    if (!isOnline && !loading && !obs) {
      const cached = offlineCache.getObservationDetail(numericId);
      if (cached) {
        setObs(cached);
        setUsingCache(true);
      } else {
        const basicList = offlineCache.getObservationsBasic();
        const basic = basicList?.find((o) => o.id === numericId);
        if (basic) {
          setObs(basic);
          setUsingCache(true);
        }
      }
    }
  }, [isOnline, numericId, loading, obs]);

  const handleLike = async () => {
    if (!curUser) return navigate('/login');
    if (likeLoading || !obs) return;
    setLikeLoading(true);
    try {
      await api.post(`/observations/${obs.id}/like`);
      fetchData();
    } finally {
      setLikeLoading(false);
    }
  };

  const handleComment = async () => {
    if (!curUser) return navigate('/login');
    if (!comment.trim() || !obs || commentLoading) return;
    setCommentLoading(true);
    try {
      await api.post(`/observations/${obs.id}/comments`, { content: comment.trim() });
      setComment('');
      fetchData();
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="card animate-pulse overflow-hidden">
          <div className="aspect-[16/9] bg-sage-100" />
          <div className="p-8 space-y-4" />
        </div>
      </div>
    );
  }

  if (!obs) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="card py-20 text-sage-400">
          <p className="text-xl font-medium">{t('obs_detail_not_found')}</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-6">{t('obs_detail_back_map')}</button>
        </div>
      </div>
    );
  }

  const sp = obs.species;
  const u = obs.user;
  const photos = obs.photoUrls || [];
  const thumbnails = obs.thumbnailUrls || [];
  const isOwner = curUser && curUser.id === obs.userId;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sage-600 hover:text-forest-700 mb-6 transition">
        <ArrowLeft className="w-4 h-4" />
        {t('obs_back')}
      </button>

      <div className="card overflow-hidden animate-fade-in">
        {photos.length > 0 && (
          <div className="relative aspect-[16/9] bg-sage-50">
            <div className="w-full h-full relative group">
              <img
                src={thumbnails[0] || photos[0]}
                alt={obs.speciesName}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setLightboxIndex(0)}
              />
              {photos.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {photos.map((url, i) => (
                      <img
                        key={i}
                        src={thumbnails[i] || url}
                        alt={`缩略图 ${i + 1}`}
                        className={`w-16 h-12 rounded-lg object-cover shrink-0 cursor-pointer border-2 transition ${
                          i === 0 ? 'border-white shadow-lg' : 'border-white/40 opacity-70 hover:opacity-100'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxIndex(i);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            {sp && (
              <div className="absolute top-4 left-4 flex gap-2">
                <span className={`chip text-xs !py-1.5 !px-3 ${MIGRATION_LABELS[sp.migrationPattern]?.color || ''}`}>
                  {getMigrationLabel(sp.migrationPattern)}
                </span>
                {sp && (
                  <span className="chip text-xs !py-1.5 !px-3 bg-forest-600 text-white">
                    {t('obs_detail_rarity')} {'★'.repeat(Math.ceil(sp.rarity / 20))}
                  </span>
                )}
              </div>
            )}
            {isOwner && (
              <Link
                to={`/observe/${obs.id}/edit`}
                className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-forest-700 rounded-xl text-sm font-medium shadow transition"
              >
                <Pencil className="w-3.5 h-3.5" />
                {t('obs_detail_edit')}
              </Link>
            )}
          </div>
        )}

        {photos.length === 0 && isOwner && (
          <div className="p-4 bg-sage-50 border-b border-sage-100 flex justify-end">
            <Link
              to={`/observe/${obs.id}/edit`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-sage-100 text-forest-700 rounded-xl text-sm font-medium border border-sage-200 transition"
            >
              <Pencil className="w-3.5 h-3.5" />
              {t('obs_detail_edit')}
            </Link>
          </div>
        )}

        <div className="p-6 sm:p-8">
          {u && (
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-sage-100">
              <Link to={`/profile/${u.id}`}>
                <img src={u.avatar} alt="" className="w-14 h-14 rounded-2xl border-2 border-forest-100 bg-white" />
              </Link>
              <div className="flex-1">
                <Link to={`/profile/${u.id}`} className="font-display text-xl font-semibold text-forest-800 hover:text-forest-600">
                  {u.username}
                </Link>
                <div className="text-sm text-sage-500 mt-0.5">{timeAgo(obs.observationTime)} {t('obs_detail_published')}</div>
              </div>
              <button onClick={handleLike} disabled={likeLoading} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${obs.isLiked ? 'bg-rose-50 text-rose-600' : 'bg-sage-50 text-sage-700 hover:bg-sage-100'}`}>
                <Heart className={`w-5 h-5 ${obs.isLiked ? 'fill-current' : ''}`} />
                <span className="font-semibold">{obs.likes}</span>
              </button>
            </div>
          )}

          <div className="flex items-start justify-between gap-4 mb-1 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-3xl font-bold text-forest-800">
                {obs.speciesName}
                {sp && <span className="ml-3 text-lg text-sage-400 italic font-sans font-normal">{sp.scientificName}</span>}
              </h1>
              {usingCache && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-forest-50 text-forest-600 border border-forest-100 font-medium">
                  <Database className="w-3 h-3" />
                  {t('offline_cached_label')}
                </span>
              )}
            </div>
          </div>
          {usingCache && (
            <div className="mt-2 text-xs text-sage-500 bg-amber-50/60 border border-amber-100 rounded-xl px-3 py-2">
              {t('offline_using_cache')}
            </div>
          )}

          <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <InfoItem icon={<MapPin className="w-4 h-4 text-forest-500" />} label={t('obs_detail_location')} value={obs.locationName || t('map_unknown_location')} />
            <InfoItem icon={<Calendar className="w-4 h-4 text-forest-500" />} label={t('obs_detail_time')} value={formatDateTime(obs.observationTime)} />
            <InfoItem icon={<CloudRain className="w-4 h-4 text-forest-500" />} label={t('obs_detail_weather')} value={getWeatherLabel(obs.weather)} />
            {obs.temperature !== undefined && (
              <InfoItem icon={<Thermometer className="w-4 h-4 text-rose-500" />} label={t('obs_temperature')} value={`${obs.temperature}°C`} />
            )}
            {obs.windDirection && (
              <InfoItem icon={<Wind className="w-4 h-4 text-sky-500" />} label={t('obs_wind_direction')} value={getWindDirectionLabel(obs.windDirection, lang as 'zh' | 'en')} />
            )}
          </div>

          {obs.behavior && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-sage-700 mb-1.5 flex items-center gap-1.5">
                <Binoculars className="w-4 h-4 text-forest-500" />
                {t('obs_detail_behavior')}
              </h3>
              <p className="text-sage-700 bg-sage-50 px-4 py-3 rounded-xl">{obs.behavior}</p>
            </div>
          )}

          {obs.description && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-sage-700 mb-1.5">{t('obs_detail_notes')}</h3>
              <p className="text-sage-700 leading-relaxed bg-forest-50/40 px-4 py-4 rounded-2xl">
                {obs.description}
              </p>
            </div>
          )}

          {photos.length > 1 && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-sage-700 mb-3">{t('obs_detail_photos')}</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photos.map((url, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl overflow-hidden border border-sage-100 cursor-pointer hover:shadow-md transition group"
                    onClick={() => setLightboxIndex(i)}
                  >
                    <img
                      src={thumbnails[i] || url}
                      alt={`照片 ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {sp && (
            <div className="mt-6 card !shadow-soft p-5 bg-gradient-to-br from-forest-50/60 to-white flex flex-col sm:flex-row gap-5">
              <img src={sp.imageUrl} alt="" className="w-full sm:w-36 h-36 rounded-xl object-cover shrink-0" />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-forest-800">{sp.name}</h3>
                    <p className="text-xs text-sage-500 italic">{sp.scientificName}</p>
                  </div>
                  <Link to={`/species/${sp.id}`} className="btn-primary !py-2 !px-3 text-sm flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    {t('obs_detail_species')}
                  </Link>
                </div>
                <p className="mt-3 text-sm text-sage-700 line-clamp-3">{sp.description}</p>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-sage-100">
            <h3 className="font-display text-lg font-semibold text-forest-800 flex items-center gap-2 mb-5">
              <MessageCircle className="w-5 h-5" />
              {t('obs_detail_comments')} <span className="text-sm text-sage-400 font-sans">({obs.comments?.length || 0})</span>
            </h3>

            {curUser && (
              <div className="flex gap-3 mb-6 p-3 bg-sage-50 rounded-2xl">
                <img src={curUser.avatar} alt="" className="w-10 h-10 rounded-xl shrink-0 bg-white" />
                <div className="flex-1 flex gap-2">
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t('obs_detail_comment_placeholder')}
                    className="input-base !py-2.5 bg-white"
                  />
                  <button
                    onClick={handleComment}
                    disabled={commentLoading || !comment.trim()}
                    className="btn-primary !py-2.5 !px-4 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {t('obs_detail_send')}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {(obs.comments || []).length === 0 ? (
                <div className="text-center py-8 text-sage-400 text-sm">
                  {t('obs_detail_no_comments')}
                </div>
              ) : (
                obs.comments!.map((c) => (
                  <div key={c.id} className="flex gap-3 animate-fade-in">
                    <Link to={`/profile/${c.user.id}`}>
                      <img src={c.user.avatar} alt="" className="w-10 h-10 rounded-xl shrink-0 bg-white" />
                    </Link>
                    <div className="flex-1 bg-sage-50 rounded-2xl px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <Link to={`/profile/${c.user.id}`} className="text-sm font-semibold text-forest-700 hover:text-forest-600">
                          {c.user.username}
                        </Link>
                        <span className="text-xs text-sage-400">{timeAgo(c.createdAt)}</span>
                      </div>
                      <p className="text-sage-700 text-sm">{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {lightboxIndex !== null && photos.length > 0 && (
        <Lightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-sage-100">
      <div className="w-9 h-9 rounded-lg bg-forest-50 flex items-center justify-center">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-sage-500">{label}</div>
        <div className="text-sm font-medium text-sage-800 truncate">{value}</div>
      </div>
    </div>
  );
}
