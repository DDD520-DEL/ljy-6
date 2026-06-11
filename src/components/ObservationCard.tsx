import { Link } from 'react-router-dom';
import { Heart, MessageCircle, MapPin, Calendar, Share2, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import type { Observation } from '../../shared/types';
import { timeAgo, formatDateShort } from '../lib/format';
import { getMigrationLabel, MIGRATION_LABELS } from '../lib/constants';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import { useT } from '../i18n';

interface Props {
  observation: Observation;
  compact?: boolean;
  onUpdate?: () => void;
}

export function ObservationCard({ observation, compact = false, onUpdate }: Props) {
  const { user: curUser } = useAuthStore();
  const t = useT();
  const [likeLoading, setLikeLoading] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const handleLike = async () => {
    if (!curUser) return;
    setLikeLoading(true);
    try {
      await api.post(`/observations/${observation.id}/like`);
      onUpdate?.();
    } finally {
      setLikeLoading(false);
    }
  };

  const handleComment = async () => {
    if (!curUser || !commentText.trim()) return;
    setCommentLoading(true);
    try {
      await api.post(`/observations/${observation.id}/comments`, { content: commentText.trim() });
      setCommentText('');
      setShowComment(false);
      onUpdate?.();
    } finally {
      setCommentLoading(false);
    }
  };

  const photo = observation.thumbnailUrls?.[0] || observation.photoUrls?.[0];
  const u = observation.user;
  const sp = observation.species;

  return (
    <article className="card group animate-fade-in">
      <Link to={`/observe/${observation.id}`} className="block">
        {photo && !compact && (
          <div className="aspect-[16/10] overflow-hidden bg-sage-50 relative">
            <img
              src={photo}
              alt={observation.speciesName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            {sp && (
              <div className="absolute top-3 left-3">
                <span className={`chip chip-active !text-xs ${MIGRATION_LABELS[sp.migrationPattern]?.color || ''}`}>
                  {getMigrationLabel(sp.migrationPattern)}
                </span>
              </div>
            )}
          </div>
        )}
      </Link>

      <div className={`p-4 sm:p-5 ${compact ? '' : 'space-y-3'}`}>
        {u && (
          <div className="flex items-center gap-3">
            <Link to={`/profile/${u.id}`} className="shrink-0">
              <img src={u.avatar} alt={u.username} className="w-9 h-9 rounded-full border border-sage-100 bg-white" />
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/profile/${u.id}`} className="font-medium text-sage-800 hover:text-forest-700 text-sm">
                {u.username}
              </Link>
              <div className="flex items-center gap-1 text-xs text-sage-500">
                <Calendar className="w-3 h-3" />
                {timeAgo(observation.observationTime)}
              </div>
            </div>
            {sp?.imageUrl && compact && (
              <img src={sp.imageUrl} alt={sp.name} className="w-12 h-12 rounded-lg object-cover" />
            )}
          </div>
        )}

        <div>
          <Link to={`/observe/${observation.id}`} className="block">
            <h3 className="font-display text-lg font-semibold text-forest-800 hover:text-forest-600 transition">
              {observation.speciesName}
              {sp && <span className="ml-2 text-xs text-sage-400 font-sans font-normal italic">{sp.scientificName}</span>}
            </h3>
          </Link>
          {observation.tags && observation.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {observation.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          {!compact && observation.description && (
            <p className="mt-2 text-sm text-sage-600 line-clamp-2">{observation.description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-sage-500">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-forest-500" />
            {observation.locationName || t('map_unknown_location')}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-forest-500" />
            {formatDateShort(observation.observationTime)}
          </div>
          {observation.behavior && !compact && (
            <div className="flex items-center gap-1 max-w-[160px] truncate">
              <UserIcon className="w-3.5 h-3.5 text-forest-500" />
              {observation.behavior}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 pt-2 border-t border-sage-50 -mx-2 px-2">
          <button
            onClick={handleLike}
            disabled={likeLoading || !curUser}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm transition ${
              observation.isLiked ? 'bg-rose-50 text-rose-600' : 'text-sage-600 hover:bg-sage-50'
            } disabled:opacity-50`}
          >
            <Heart className={`w-4 h-4 ${observation.isLiked ? 'fill-current' : ''}`} />
            <span className="font-medium">{observation.likes || 0}</span>
          </button>
          <button
            onClick={() => setShowComment((v) => !v)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm text-sage-600 hover:bg-sage-50 transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="font-medium">{observation.comments?.length || 0}</span>
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm text-sage-600 hover:bg-sage-50 transition">
            <Share2 className="w-4 h-4" />
            <span className="font-medium sm:inline hidden">{t('share')}</span>
          </button>
        </div>

        {showComment && observation.comments && (
          <div className="space-y-2 pt-2 border-t border-sage-100 animate-fade-in">
            {observation.comments.slice(-3).map((c) => (
              <div key={c.id} className="flex gap-2">
                <img src={c.user.avatar} className="w-7 h-7 rounded-full shrink-0" />
                <div className="flex-1 bg-sage-50 rounded-xl px-3 py-2">
                  <div className="text-xs font-medium text-forest-700">{c.user.username}</div>
                  <div className="text-sm text-sage-700">{c.content}</div>
                </div>
              </div>
            ))}
            {curUser && (
              <div className="flex gap-2 mt-2">
                <img src={curUser.avatar} className="w-7 h-7 rounded-full shrink-0" />
                <div className="flex-1 flex gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={t('obs_detail_comment_placeholder')}
                    className="input-base !py-2 !text-sm"
                  />
                  <button
                    onClick={handleComment}
                    disabled={commentLoading || !commentText.trim()}
                    className="btn-primary !py-2 !px-4 text-sm disabled:opacity-50"
                  >
                    {t('obs_detail_send')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
