import { useEffect, useState } from 'react';
import { Users, MessageCircle, Sparkles, Home } from 'lucide-react';
import api from '../lib/api';
import type { Observation, User } from '../../shared/types';
import { ObservationCard } from '../components/ObservationCard';
import { UserCard } from '../components/UserCard';

type TabType = 'feed' | 'users';

export default function CommunityPage() {
  const [tab, setTab] = useState<TabType>('feed');
  const [observations, setObservations] = useState<Observation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/observations', { params: { limit: 30 } });
      setObservations(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users', { params: { limit: 30 } });
      setUsers(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'feed') fetchFeed();
    else fetchUsers();
  }, [tab]);

  return (
    <div className="max-w-[1400px mx-auto px-4 py-8 sm:py-10">
      <div className="mb-10 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 text-sm font-medium mb-4">
          <Users className="w-4 h-4" />
          观鸟社区
        </div>
        <h1 className="section-title !text-3xl md:!text-4xl">发现同好 · 分享飞羽之美</h1>
        <p className="text-sage-600 mt-3">浏览观鸟爱好者的最新动态和精选记录</p>
      </div>

      <div className="flex items-center justify-center mb-8">
        <div className="inline-flex p-1.5 rounded-2xl bg-sage-100">
          <button
            onClick={() => setTab('feed')}
            className={`px-6 py-2.5 rounded-xl font-medium transition flex items-center gap-2 ${
              tab === 'feed' ? 'bg-white text-forest-700 shadow-card' : 'text-sage-600'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            动态广场
          </button>
          <button
            onClick={() => setTab('users')}
            className={`px-6 py-2.5 rounded-xl font-medium transition flex items-center gap-2 ${
              tab === 'users' ? 'bg-white text-forest-700 shadow-card' : 'text-sage-600'
            }`}
          >
            <Users className="w-4 h-4" />
            观鸟者
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="aspect-[16/10] bg-sage-100" />
              <div className="p-4 space-y-2">
                <div className="flex gap-2">
                  <div className="w-9 h-9 rounded-full bg-sage-100" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 bg-sage-100 rounded w-1/2" />
                    <div className="h-3 bg-sage-100 rounded w-1/3" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : tab === 'feed' ? (
        observations.length === 0 ? (
          <div className="card py-20 text-center text-sage-400">
            <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">还没有观测动态</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {observations.map((obs, i) => (
              <div key={obs.id} style={{ animationDelay: `${i * 50}ms` }} className="animate-slide-up">
                <ObservationCard observation={obs} onUpdate={fetchFeed} />
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {users.map((u, i) => (
            <div key={u.id} style={{ animationDelay: `${i * 60}ms` }} className="animate-slide-up">
              <UserCard user={u} onUpdate={fetchUsers} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
