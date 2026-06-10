import { Link } from 'react-router-dom';
import { MapPin, MessageCircle, UserPlus, Binoculars, Clock } from 'lucide-react';
import type { Activity, Observation } from '../../shared/types';
import { formatDateRelative } from '../lib/format';
import { useT } from '../i18n';

interface Props {
  activity: Activity;
  onUpdate?: () => void;
}

export function ActivityCard({ activity, onUpdate }: Props) {
  const t = useT();
  const user = activity.user;

  if (!user) return null;

  const renderContent = () => {
    switch (activity.type) {
      case 'publish_observation':
        return <PublishObservationBlock activity={activity} onUpdate={onUpdate} />;
      case 'comment':
        return <CommentBlock activity={activity} onUpdate={onUpdate} />;
      case 'follow':
        return <FollowBlock activity={activity} />;
      default:
        return null;
    }
  };

  return (
    <div className="card p-5 animate-fade-in border-l-4 border-l-forest-400">
      <div className="flex items-start gap-3 mb-4">
        <Link to={`/profile/${user.id}`} className="shrink-0">
          <img src={user.avatar} alt="" className="w-11 h-11 rounded-xl object-cover border border-sage-100" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/profile/${user.id}`} className="font-display font-semibold text-forest-800 hover:text-forest-600 transition">
              {user.username}
            </Link>
            <span className="text-sage-400">
              <ActivityIcon type={activity.type} />
            </span>
            <span className="text-sm text-sage-600">{getActivityText(activity.type, t)}</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-sage-400">
            <Clock className="w-3 h-3" />
            {formatDateRelative(activity.createdAt)}
          </div>
        </div>
      </div>
      {renderContent()}
    </div>
  );
}

function ActivityIcon({ type }: { type: Activity['type'] }) {
  switch (type) {
    case 'publish_observation':
      return <Binoculars className="w-4 h-4 inline" />;
    case 'comment':
      return <MessageCircle className="w-4 h-4 inline" />;
    case 'follow':
      return <UserPlus className="w-4 h-4 inline" />;
  }
}

function getActivityText(type: Activity['type'], t: (k: string) => string) {
  switch (type) {
    case 'publish_observation':
      return t('activity_publish_obs');
    case 'comment':
      return t('activity_comment');
    case 'follow':
      return t('activity_follow');
  }
}

function PublishObservationBlock({ activity, onUpdate }: { activity: Activity; onUpdate?: () => void }) {
  const obs = activity.observation;
  if (!obs) return null;
  return <ObservationMini observation={obs} onUpdate={onUpdate} />;
}

function CommentBlock({ activity, onUpdate }: { activity: Activity; onUpdate?: () => void }) {
  const t = useT();
  const comment = activity.comment;
  const obs = activity.observation;
  return (
    <div className="space-y-3">
      <div className="bg-sage-50 border border-sage-100 rounded-xl p-4">
        <div className="text-sage-800 text-sm leading-relaxed">{comment?.content || activity.metadata?.content}</div>
      </div>
      {obs && (
        <div className="border-t border-sage-100 pt-3">
          <div className="text-xs text-sage-400 mb-2 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {t('activity_reply_to_obs')}
          </div>
          <ObservationMini observation={obs} onUpdate={onUpdate} compact />
        </div>
      )}
    </div>
  );
}

function FollowBlock({ activity }: { activity: Activity }) {
  const target = activity.targetUser;
  if (!target) return null;
  return (
    <Link to={`/profile/${target.id}`} className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-100 hover:shadow-card-hover transition group">
      <img src={target.avatar} alt="" className="w-12 h-12 rounded-xl object-cover border border-white shadow-sm" />
      <div className="flex-1 min-w-0">
        <div className="font-display font-semibold text-forest-800 group-hover:text-forest-600 transition truncate">
          {target.username}
        </div>
        <div className="text-xs text-sage-500 flex items-center gap-3 mt-1">
          <span><Binoculars className="w-3 h-3 inline mr-1" />{target.observationsCount}</span>
          <span><MapPin className="w-3 h-3 inline mr-1" />{target.speciesCount}</span>
        </div>
      </div>
    </Link>
  );
}

function ObservationMini({ observation, onUpdate, compact = false }: { observation: Observation; onUpdate?: () => void; compact?: boolean }) {
  const hasPhoto = observation.photoUrls && observation.photoUrls.length > 0;
  return (
    <Link to={`/observations/${observation.id}`} className={`block rounded-xl overflow-hidden border border-sage-100 hover:shadow-card-hover transition bg-white group ${compact ? 'flex gap-0' : ''}`}>
      {hasPhoto && (
        <div className={`relative ${compact ? 'w-24 h-24 shrink-0' : 'aspect-[16/10]'} overflow-hidden bg-sage-50`}>
          <img
            src={observation.photoUrls[0]}
            alt=""
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500`}
            loading="lazy"
          />
        </div>
      )}
      <div className={`p-3 ${compact ? 'flex-1' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-display font-semibold text-forest-800 text-sm group-hover:text-forest-600 transition truncate">
            {observation.speciesName}
          </span>
        </div>
        {!compact && observation.description && (
          <p className="text-xs text-sage-500 line-clamp-2 mb-2">{observation.description}</p>
        )}
        <div className="text-[11px] text-sage-400 flex items-center gap-1">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{observation.locationName}</span>
        </div>
      </div>
    </Link>
  );
}
