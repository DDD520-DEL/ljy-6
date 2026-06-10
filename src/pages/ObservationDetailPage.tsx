import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, CloudRain, Heart, MessageCircle, Send, Share2, Sparkles, Binoculars } from 'lucide-react';
import api from '../lib/api';
import type { Observation } from '../../shared/types';
import { ObservationCard } from '../components/ObservationCard';
import { useAuthStore } from '../stores/authStore';
import { timeAgo, formatDateTime } from '../lib/format';
import { MIGRATION_LABELS } from '../lib/constants';

export default function ObservationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: curUser } = useAuthStore();
  const [obs, setObs] = useState<Observation | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/observations/${id}`);
      setObs(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

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
          <p className="text-xl font-medium">观测记录不存在</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-6">返回地图</button>
        </div>
      </div>
    );
  }

  const sp = obs.species;
  const u = obs.user;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sage-600 hover:text-forest-700 mb-6 transition">
        <ArrowLeft className="w-4 h-4" />
        返回
      </button>

      <div className="card overflow-hidden animate-fade-in">
        {obs.photoUrls?.[0] && (
          <div className="relative aspect-[16/9] bg-sage-50">
            <img src={obs.photoUrls[0]} alt={obs.speciesName} className="w-full h-full object-cover" />
            {sp && (
              <div className="absolute top-4 left-4 flex gap-2">
                <span className={`chip text-xs !py-1.5 !px-3 ${MIGRATION_LABELS[sp.migrationPattern]?.color || ''}`}>
                  {MIGRATION_LABELS[sp.migrationPattern]?.label}
                </span>
                {sp && (
                  <span className="chip text-xs !py-1.5 !px-3 bg-forest-600 text-white">
                    稀有度 {'★'.repeat(Math.ceil(sp.rarity / 20))}
                  </span>
                )}
              </div>
            )}
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
                <div className="text-sm text-sage-500 mt-0.5">{timeAgo(obs.observationTime)} 发布</div>
              </div>
              <button onClick={handleLike} disabled={likeLoading} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${obs.isLiked ? 'bg-rose-50 text-rose-600' : 'bg-sage-50 text-sage-700 hover:bg-sage-100'}`}>
                <Heart className={`w-5 h-5 ${obs.isLiked ? 'fill-current' : ''}`} />
                <span className="font-semibold">{obs.likes}</span>
              </button>
            </div>
          )}

          <h1 className="font-display text-3xl font-bold text-forest-800 mb-1">
            {obs.speciesName}
            {sp && <span className="ml-3 text-lg text-sage-400 italic font-sans font-normal">{sp.scientificName}</span>}
          </h1>

          <div className="mt-5 grid sm:grid-cols-3 gap-3">
            <InfoItem icon={<MapPin className="w-4 h-4 text-forest-500" />} label="观测地点" value={obs.locationName || '未知'} />
            <InfoItem icon={<Calendar className="w-4 h-4 text-forest-500" />} label="观测时间" value={formatDateTime(obs.observationTime)} />
            <InfoItem icon={<CloudRain className="w-4 h-4 text-forest-500" />} label="天气" value={weatherLabel(obs.weather)} />
          </div>

          {obs.behavior && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-sage-700 mb-1.5 flex items-center gap-1.5">
                <Binoculars className="w-4 h-4 text-forest-500" />
                鸟类行为
              </h3>
              <p className="text-sage-700 bg-sage-50 px-4 py-3 rounded-xl">{obs.behavior}</p>
            </div>
          )}

          {obs.description && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-sage-700 mb-1.5">观测备注</h3>
              <p className="text-sage-700 leading-relaxed bg-forest-50/40 px-4 py-4 rounded-2xl">
                {obs.description}
              </p>
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
                    物种详情
                  </Link>
                </div>
                <p className="mt-3 text-sm text-sage-700 line-clamp-3">{sp.description}</p>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-sage-100">
            <h3 className="font-display text-lg font-semibold text-forest-800 flex items-center gap-2 mb-5">
              <MessageCircle className="w-5 h-5" />
              社区评论 <span className="text-sm text-sage-400 font-sans">({obs.comments?.length || 0})</span>
            </h3>

            {curUser && (
              <div className="flex gap-3 mb-6 p-3 bg-sage-50 rounded-2xl">
                <img src={curUser.avatar} alt="" className="w-10 h-10 rounded-xl shrink-0 bg-white" />
                <div className="flex-1 flex gap-2">
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="写下你的评论..."
                    className="input-base !py-2.5 bg-white"
                  />
                  <button
                    onClick={handleComment}
                    disabled={commentLoading || !comment.trim()}
                    className="btn-primary !py-2.5 !px-4 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    发送
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {(obs.comments || []).length === 0 ? (
                <div className="text-center py-8 text-sage-400 text-sm">
                  还没有评论，快来抢沙发吧～
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

function weatherLabel(w: string) {
  const map: Record<string, string> = {
    sunny: '☀️ 晴朗', cloudy: '⛅ 多云', rainy: '🌧️ 下雨', foggy: '🌫️ 雾天', snowy: '❄️ 下雪', windy: '💨 大风',
  };
  return map[w] || w;
}
