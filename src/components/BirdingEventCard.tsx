import { MapPin, Calendar, Users, Clock, UserCheck, Trash2, Bird } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BirdingEvent } from '../../shared/types';
import { formatDateTime } from '../lib/format';
import { useT } from '../i18n';

interface Props {
  event: BirdingEvent;
  onRegister?: () => void;
  onUnregister?: () => void;
  onDelete?: () => void;
  currentUserId?: number;
  registering?: boolean;
  deleting?: boolean;
}

export function BirdingEventCard({
  event,
  onRegister,
  onUnregister,
  onDelete,
  currentUserId,
  registering,
  deleting,
}: Props) {
  const t = useT();
  const user = event.user;
  const isOwner = currentUserId && user && currentUserId === user.id;
  const isFull = event.registeredCount >= event.maxParticipants;
  const canRegister = !isOwner && !event.isRegistered && !isFull;
  const spotsLeft = event.maxParticipants - event.registeredCount;
  const fillPercent = (event.registeredCount / event.maxParticipants) * 100;

  return (
    <div className="card overflow-hidden border-l-4 border-l-sky-400 hover:shadow-card-hover transition group animate-fade-in">
      {event.imageUrl && (
        <div className="aspect-[16/8] overflow-hidden bg-sage-50 relative">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-forest-700">
            <Bird className="w-3 h-3" />
            {t('event_label')}
          </div>
          {isFull && !event.isRegistered && (
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-rose-500 text-white text-xs font-medium">
              {t('event_full')}
            </div>
          )}
          {event.isRegistered && (
            <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-forest-500 text-white text-xs font-medium">
              <UserCheck className="w-3 h-3" />
              {t('event_registered_tag')}
            </div>
          )}
        </div>
      )}

      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-display font-semibold text-lg text-forest-800 group-hover:text-forest-600 transition leading-snug">
            {event.title}
          </h3>
          {event.description && (
            <p className="text-sm text-sage-600 mt-2 line-clamp-2">{event.description}</p>
          )}
        </div>

        <div className="space-y-2.5">
          <div className="flex items-start gap-2 text-sm text-sage-600">
            <Calendar className="w-4 h-4 shrink-0 mt-0.5 text-sky-500" />
            <div>
              <div className="font-medium text-sage-700">{formatDateTime(event.startTime)}</div>
              <div className="flex items-center gap-1 text-xs text-sage-400 mt-0.5">
                <Clock className="w-3 h-3" />
                {t('event_until')} {formatDateTime(event.endTime)}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm text-sage-600">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span className="line-clamp-1">{event.locationName}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="inline-flex items-center gap-1 text-sage-600 font-medium">
              <Users className="w-3.5 h-3.5" />
              {t('event_registered')}: {event.registeredCount}/{event.maxParticipants}
            </span>
            <span className={`font-medium ${
              spotsLeft === 0 ? 'text-rose-500' : spotsLeft <= 3 ? 'text-amber-600' : 'text-forest-600'
            }`}>
              {spotsLeft === 0 ? t('event_full') : `${spotsLeft} ${t('event_spots_left')}`}
            </span>
          </div>
          <div className="h-2 bg-sage-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                fillPercent >= 100 ? 'bg-rose-500' : fillPercent >= 80 ? 'bg-amber-500' : 'bg-forest-500'
              }`}
              style={{ width: `${Math.min(fillPercent, 100)}%` }}
            />
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-2 pt-3 border-t border-sage-100">
            <Link to={`/profile/${user.id}`} className="shrink-0">
              <img
                src={user.avatar}
                alt={user.username}
                className="w-8 h-8 rounded-full object-cover border border-sage-100"
              />
            </Link>
            <div className="flex-1 min-w-0">
              <Link
                to={`/profile/${user.id}`}
                className="text-sm font-medium text-forest-700 hover:text-forest-600 truncate block"
              >
                {user.username}
              </Link>
              <div className="text-[11px] text-sage-400">{t('event_organizer')}</div>
            </div>
            {event.contactInfo && (
              <div className="text-[11px] text-sage-500 max-w-[140px] truncate" title={event.contactInfo}>
                {event.contactInfo}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {isOwner ? (
            onDelete && (
              <button
                onClick={onDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition text-sm font-medium disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? t('event_deleting') : t('event_delete')}
              </button>
            )
          ) : event.isRegistered ? (
            onUnregister && (
              <button
                onClick={onUnregister}
                disabled={registering}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-sage-100 text-sage-700 hover:bg-sage-200 transition text-sm font-medium disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" />
                {registering ? t('event_loading') : t('event_cancel_reg')}
              </button>
            )
          ) : (
            canRegister && onRegister && (
              <button
                onClick={onRegister}
                disabled={registering || isFull}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:from-sky-600 hover:to-sky-700 transition text-sm font-medium shadow-card disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Users className="w-4 h-4" />
                {registering ? t('event_loading') : t('event_signup')}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
