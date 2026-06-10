import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Binoculars, Eye, MapPin, Target, Award, Plus, LogIn } from 'lucide-react';
import api from '../lib/api';
import type { User, YearListItem, Observation } from '../../shared/types';
import { UserCard } from '../components/UserCard';
import { ObservationCard } from '../components/ObservationCard';
import { formatDateShort } from '../lib/format';
import { useAuthStore } from '../stores/authStore';

export default function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: curUser } = useAuthStore();
  const id = Number(userId);

  const [profile, setProfile] = useState<any>(null);
  const [yearList, setYearList] = useState<YearListItem[]>([]);
  const [yearTotal, setYearTotal] = useState(0);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'list' | 'obs' | 'following' | 'followers'>('list');

  const fetchAll = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [pRes, yRes, fFollowing, fFollowers] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/users/${id}/yearlist`, { params: { year } }),
        api.get(`/users/${id}/following`),
        api.get(`/users/${id}/followers`),
      ]);
      setProfile(pRes.data.data);
      setYearList(yRes.data.data || []);
      setYearTotal(yRes.data.total || 0);
      setObservations(pRes.data.data?.observations || []);
      setFollowing(fFollowing.data.data || []);
      setFollowers(fFollowers.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [id, year]);

  const isSelf = curUser?.id === id;

  const toggleFollow = async () => {
    if (!curUser) return navigate('/login');
    if (profile?.isFollowing) await api.delete(`/users/follow/${id}`);
    else await api.post(`/users/follow/${id}`);
    fetchAll();
  };

  if (loading || !profile) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="card overflow-hidden animate-pulse">
          <div className="h-48 bg-gradient-to-r from-forest-100 to-sky-100" />
          <div className="p-6 space-y-3">
            <div className="h-20 w-20 rounded-full bg-sage-100 -mt-16 border-4 border-white" />
            <div className="h-6 bg-sage-100 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  const progressPct = Math.min(100, (yearTotal / 50) * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
      <div className="card overflow-hidden mb-6 animate-fade-in">
        <div className="h-48 bg-gradient-to-br from-forest-500 via-forest-600 to-sky-500 relative">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'60\' height=\'60\' viewBox=\'0 0 60 60\'%3E%3Cg fill=\'%23fff\' fill-opacity=\'0.5\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/svg%3E")' }} />
        </div>
        <div className="px-6 sm:px-8 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-16">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <img src={profile.avatar} alt="" className="w-28 h-28 rounded-2xl border-4 border-white shadow-card bg-white" />
              <div className="sm:pb-2">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-white drop-shadow-md">
                  {profile.username}
                  {isSelf && <span className="ml-2 text-sm font-sans font-normal text-white/80">(我)</span>}
                </h1>
                <div className="flex items-center gap-2 mt-1 text-white/90 text-sm">
                  <Calendar className="w-4 h-4" />
                  加入于 {formatDateShort(profile.createdAt)}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {!isSelf && curUser ? (
                <button onClick={toggleFollow} className={profile.isFollowing ? 'btn-secondary' : 'btn-primary'}>
                  {profile.isFollowing ? '取消关注' : '+ 关注'}
                </button>
              ) : null}
              {!curUser && (
                <button onClick={() => navigate('/login')} className="btn-primary flex items-center gap-1.5">
                  <LogIn className="w-4 h-4" />
                  登录
                </button>
              )}
              {isSelf && (
                <button onClick={() => navigate('/observe/new')} className="btn-primary flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  记录观测
                </button>
              )}
            </div>
          </div>

          {profile.bio && (
            <div className="mt-6 text-sage-700 bg-sage-50 p-4 rounded-2xl text-sm">
              {profile.bio}
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat icon={<Binoculars className="w-5 h-5" />} label="观测记录" value={profile.observationsCount} color="bg-forest-100 text-forest-600" />
            <Stat icon={<Eye className="w-5 h-5" />} label="发现物种" value={profile.speciesCount} color="bg-sky-100 text-sky-600" />
            <Stat icon={<Target className="w-5 h-5" />} label="关注" value={profile.followingCount} color="bg-earth-100 text-earth-600" />
            <Stat icon={<Award className="w-5 h-5" />} label="粉丝" value={profile.followersCount} color="bg-rose-100 text-rose-600" />
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-semibold text-forest-800 flex items-center gap-2">
                <Award className="w-5 h-5 text-forest-600" />
                {year} 年观鸟清单
              </h3>
              <div className="flex items-center gap-1">
                {[2026, 2025, 2024].map((y) => (
                  <button
                    key={y}
                    onClick={() => setYear(y)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      year === y ? 'bg-forest-600 text-white' : 'text-sage-600 hover:bg-sage-50'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-r from-forest-500 to-forest-600 text-white p-5 rounded-2xl shadow-card">
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-sm opacity-90">年度收集进度</span>
                <span className="font-display text-3xl font-bold">{yearTotal}</span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-yellow-400 transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="mt-3 text-xs opacity-80 flex justify-between">
                <span>目标 50 种</span>
                <span>{Math.round(progressPct)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-2">
        <TabBtn active={tab === 'list'} onClick={() => setTab('list')}>年度清单 ({yearTotal})</TabBtn>
        <TabBtn active={tab === 'obs'} onClick={() => setTab('obs')}>观测记录 ({observations.length})</TabBtn>
        <TabBtn active={tab === 'following'} onClick={() => setTab('following')}>关注 ({following.length})</TabBtn>
        <TabBtn active={tab === 'followers'} onClick={() => setTab('followers')}>粉丝 ({followers.length})</TabBtn>
      </div>

      <div className="animate-fade-in">
        {tab === 'list' && (
          yearList.length === 0 ? (
            <EmptyCard icon={<Award className="w-12 h-12" />} title="还没有年度记录" desc="快去记录你的第一只鸟吧！" to={isSelf ? '/observe/new' : undefined} />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {yearList.map((item, i) => (
                <div
                  key={item.speciesId}
                  className="card overflow-hidden animate-slide-up flex items-center gap-4 p-4"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <Link to={`/species/${item.speciesId}`} className="shrink-0">
                    <img src={item.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-sage-100" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/species/${item.speciesId}`} className="block">
                      <div className="font-display font-semibold text-forest-800 truncate">{item.speciesName}</div>
                      <div className="text-[11px] text-sage-500 italic truncate">{item.scientificName}</div>
                    </Link>
                    <div className="flex items-center gap-3 mt-2 text-xs text-sage-500">
                      <span className="flex items-center gap-1">
                        <Binoculars className="w-3 h-3" />
                        {item.count}次
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        首次{formatDateShort(item.firstDate)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
        {tab === 'obs' && (
          observations.length === 0 ? (
            <EmptyCard icon={<MapPin className="w-12 h-12" />} title="暂无观测记录" desc={isSelf ? '快去发布第一条记录吧' : ''} />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {observations.map((obs, i) => (
                <div key={obs.id} style={{ animationDelay: `${i * 50}ms` }} className="animate-slide-up">
                  <ObservationCard observation={obs} onUpdate={fetchAll} />
                </div>
              ))}
            </div>
          )
        )}
        {tab === 'following' && (
          following.length === 0 ? (
            <EmptyCard icon={<Target className="w-12 h-12" />} title="还没有关注的观鸟者" />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {following.map((u, i) => (
                <div key={u.id} style={{ animationDelay: `${i * 60}ms` }} className="animate-slide-up">
                  <UserCard user={u} onUpdate={fetchAll} />
                </div>
              ))}
            </div>
          )
        )}
        {tab === 'followers' && (
          followers.length === 0 ? (
            <EmptyCard icon={<Award className="w-12 h-12" />} title="还没有粉丝关注" />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {followers.map((u, i) => (
                <div key={u.id} style={{ animationDelay: `${i * 60}ms` }} className="animate-slide-up">
                  <UserCard user={u} onUpdate={fetchAll} />
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const [bgClr, textClr] = color.split(' ');
  return (
    <div className="p-4 rounded-2xl bg-white border border-sage-100">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${bgClr} ${textClr} mb-2`}>
        {icon}
      </div>
      <div className="font-display text-2xl font-bold text-forest-800">{value}</div>
      <div className="text-xs text-sage-500">{label}</div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
        active ? 'bg-forest-100 text-forest-700 shadow-soft' : 'text-sage-600 hover:bg-sage-50'
      }`}
    >
      {children}
    </button>
  );
}

function EmptyCard({ icon, title, desc, to }: { icon: React.ReactNode; title: string; desc?: string; to?: string }) {
  const Comp: any = to ? Link : 'div';
  const props: any = to ? { to } : {};
  return (
    <Comp {...props} className="card py-16 text-center text-sage-400 block hover:shadow-card-hover transition">
      <div className="mx-auto mb-4 inline-flex text-sage-300">{icon}</div>
      <div className="text-lg font-medium text-sage-600">{title}</div>
      {desc && <div className="text-sm mt-1">{desc}</div>}
    </Comp>
  );
}
