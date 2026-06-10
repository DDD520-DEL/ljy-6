import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, UserPlus, Reply, CheckCheck, Sparkles, Award } from 'lucide-react';
import { useNotificationStore } from '../stores/notificationStore';
import { useAuthStore } from '../stores/authStore';
import { timeAgo } from '../lib/format';
import { useT } from '../i18n';

type NotificationType = 'comment' | 'reply' | 'follow' | 'badge_earned';

function typeIcon(type: NotificationType) {
  switch (type) {
    case 'comment':
      return <MessageCircle className="w-4 h-4 text-blue-500" />;
    case 'reply':
      return <Reply className="w-4 h-4 text-violet-500" />;
    case 'follow':
      return <UserPlus className="w-4 h-4 text-emerald-500" />;
    case 'badge_earned':
      return <Award className="w-4 h-4 text-amber-500" />;
  }
}

function typeLabel(type: NotificationType, t: (key: string) => string) {
  switch (type) {
    case 'comment':
      return t('notifications_comment');
    case 'reply':
      return t('notifications_reply');
    case 'follow':
      return t('notifications_follow');
    case 'badge_earned':
      return t('notifications_badge_earned');
  }
}

function typeBg(type: NotificationType) {
  switch (type) {
    case 'comment':
      return 'bg-blue-50';
    case 'reply':
      return 'bg-violet-50';
    case 'follow':
      return 'bg-emerald-50';
    case 'badge_earned':
      return 'bg-amber-50';
  }
}

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const t = useT();
  const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead, fetchUnreadCount } =
    useNotificationStore();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchNotifications();
  }, [user, navigate, fetchNotifications]);

  const hasUnread = notifications.some((n) => !n.read);

  const handleClick = async (n: (typeof notifications)[0]) => {
    if (!n.read) {
      await markAsRead(n.id);
      fetchUnreadCount();
    }
    if (n.type === 'badge_earned') {
      navigate('/challenges');
    } else if (n.type === 'follow' && n.fromUser) {
      navigate(`/profile/${n.fromUser.id}`);
    } else if (n.observationId) {
      navigate(`/observe/${n.observationId}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-10">
      <div className="mb-10 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100 text-rose-700 text-sm font-medium mb-4">
          <Bell className="w-4 h-4" />
          {t('notifications_label')}
        </div>
        <h1 className="section-title !text-3xl md:!text-4xl">{t('notifications_title')}</h1>
        <p className="text-sage-600 mt-3">{t('notifications_subtitle')}</p>
      </div>

      {hasUnread && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => {
              markAllAsRead();
              fetchUnreadCount();
            }}
            className="flex items-center gap-1.5 text-sm text-forest-600 hover:text-forest-800 transition"
          >
            <CheckCheck className="w-4 h-4" />
            {t('notifications_mark_all_read')}
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-sage-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-sage-100 rounded w-3/4" />
                <div className="h-3 bg-sage-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card py-20 text-center text-sage-400">
          <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">{t('notifications_no_notifications')}</p>
          <p className="text-sm mt-1">{t('notifications_empty_desc')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              style={{ animationDelay: `${i * 30}ms` }}
              className={`card p-4 flex items-start gap-3 cursor-pointer transition hover:shadow-md animate-slide-up ${
                !n.read ? 'border-l-4 border-l-forest-500 bg-forest-50/30' : ''
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeBg(n.type)}`}>
                {typeIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-sage-800">
                    <span className="font-semibold text-forest-700">
                      {n.type === 'badge_earned' ? t('notifications_system') : n.fromUser?.username || t('notifications_user')}
                    </span>
                    {' '}
                    {typeLabel(n.type, t)}
                    {n.type !== 'follow' && n.type !== 'badge_earned' && n.observation && (
                      <span className="text-sage-500">
                        {' · '}
                        {n.observation.speciesName}
                      </span>
                    )}
                  </p>
                  {!n.read && (
                    <span className="w-2.5 h-2.5 bg-forest-500 rounded-full shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-xs text-sage-400 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
              {n.fromUser && (
                <img
                  src={n.fromUser.avatar}
                  alt={n.fromUser.username}
                  className="w-9 h-9 rounded-full border border-sage-200 bg-white object-cover shrink-0"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
