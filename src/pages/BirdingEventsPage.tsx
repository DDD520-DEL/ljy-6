import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bird, Plus, CalendarDays, UserCheck, Sparkles, ListFilter } from 'lucide-react';
import api from '../lib/api';
import type { BirdingEvent } from '../../shared/types';
import { BirdingEventCard } from '../components/BirdingEventCard';
import { useT } from '../i18n';
import { useAuthStore } from '../stores/authStore';

type TabType = 'upcoming' | 'mine' | 'registered';

export default function BirdingEventsPage() {
  const navigate = useNavigate();
  const t = useT();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<TabType>('upcoming');
  const [events, setEvents] = useState<BirdingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [registeringId, setRegisteringId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let endpoint = '/birding-events';
      if (tab === 'mine') endpoint = '/birding-events/mine';
      if (tab === 'registered') endpoint = '/birding-events/my-registrations';
      const { data } = await api.get(endpoint, { params: { limit: 50 } });
      setEvents(data.data || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab !== 'upcoming' && !user) {
      navigate('/login');
      return;
    }
    fetchEvents();
  }, [tab, user, navigate]);

  const handleRegister = async (eventId: number) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setRegisteringId(eventId);
    try {
      const { data } = await api.post(`/birding-events/${eventId}/register`);
      if (data.success) {
        setEvents((prev) =>
          prev.map((e) => (e.id === eventId ? { ...e, ...data.data } : e)),
        );
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || t('offline_try_again_later'));
    } finally {
      setRegisteringId(null);
    }
  };

  const handleUnregister = async (eventId: number) => {
    setRegisteringId(eventId);
    try {
      const { data } = await api.post(`/birding-events/${eventId}/unregister`);
      if (data.success) {
        if (tab === 'registered') {
          setEvents((prev) => prev.filter((e) => e.id !== eventId));
        } else {
          setEvents((prev) =>
            prev.map((e) => (e.id === eventId ? { ...e, ...data.data } : e)),
          );
        }
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || t('offline_try_again_later'));
    } finally {
      setRegisteringId(null);
    }
  };

  const handleDelete = async (eventId: number) => {
    if (!confirm(t('event_confirm_delete'))) return;
    setDeletingId(eventId);
    try {
      const { data } = await api.delete(`/birding-events/${eventId}`);
      if (data.success) {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || t('offline_try_again_later'));
    } finally {
      setDeletingId(null);
    }
  };

  const tabs = [
    {
      key: 'upcoming' as const,
      label: t('event_tab_upcoming'),
      icon: CalendarDays,
    },
    {
      key: 'mine' as const,
      label: t('event_tab_mine'),
      icon: Bird,
      requiresAuth: true,
    },
    {
      key: 'registered' as const,
      label: t('event_tab_registered'),
      icon: UserCheck,
      requiresAuth: true,
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 sm:py-10">
      <div className="mb-10 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 text-sky-700 text-sm font-medium mb-4">
          <Bird className="w-4 h-4" />
          {t('event_label')}
        </div>
        <h1 className="section-title !text-3xl md:!text-4xl">{t('event_title')}</h1>
        <p className="text-sage-600 mt-3">{t('event_subtitle')}</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-sage-100">
            {tabs.map((item) => {
              if (item.requiresAuth && !user) return null;
              return (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  className={`px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2 ${
                    tab === item.key
                      ? 'bg-white text-forest-700 shadow-card'
                      : 'text-sage-600 hover:text-sage-800'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {user && (
          <button
            onClick={() => navigate('/events/new')}
            className="btn-primary flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {t('event_publish')}
          </button>
        )}
      </div>

      {!loading && total > 0 && (
        <div className="mb-6 flex items-center justify-center gap-2 text-sm text-sage-500">
          <ListFilter className="w-4 h-4" />
          {t('event_total')} {total} {t('event_count_unit')}
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="aspect-[16/8] bg-sage-100" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-sage-100 rounded w-3/4" />
                <div className="h-4 bg-sage-100 rounded w-full" />
                <div className="h-4 bg-sage-100 rounded w-1/2" />
                <div className="h-8 bg-sage-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="card py-20 text-center text-sage-400">
          <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium text-sage-500">
            {tab === 'upcoming' && t('event_no_upcoming')}
            {tab === 'mine' && t('event_no_mine')}
            {tab === 'registered' && t('event_no_registered')}
          </p>
          <p className="text-sm mt-2 text-sage-400">
            {tab === 'upcoming' && !user && t('event_login_hint')}
            {tab === 'upcoming' && user && t('event_create_first')}
            {tab === 'mine' && t('event_create_mine_hint')}
            {tab === 'registered' && t('event_signup_hint')}
          </p>
          {user && tab !== 'registered' && (
            <button
              onClick={() => navigate('/events/new')}
              className="btn-primary mt-6 !py-2.5 !px-6"
            >
              <Plus className="w-4 h-4 inline mr-1" />
              {t('event_publish')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event, i) => (
            <div
              key={event.id}
              style={{ animationDelay: `${i * 50}ms` }}
              className="animate-slide-up"
            >
              <BirdingEventCard
                event={event}
                currentUserId={user?.id}
                registering={registeringId === event.id}
                deleting={deletingId === event.id}
                onRegister={() => handleRegister(event.id)}
                onUnregister={() => handleUnregister(event.id)}
                onDelete={() => handleDelete(event.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
