import { useEffect, useState } from 'react';
import { Trophy, Target, Award, Calendar, TrendingUp, Crown, Medal, Star, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import type { ChallengeWithProgress, ChallengeRankingItem, Badge, UserChallengeProgress } from '../../shared/types';
import { useAuthStore } from '../stores/authStore';
import { formatDateShort } from '../lib/format';
import { RARITY_COLORS, RARITY_LABELS } from '../lib/constants';

const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

export default function ChallengesPage() {
  const { user } = useAuthStore();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([]);
  const [rankings, setRankings] = useState<ChallengeRankingItem[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'challenges' | 'rankings' | 'badges'>('challenges');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const reqs: Promise<any>[] = [
        api.get('/challenges', { params: { year, month, withProgress: user ? 'true' : 'false' } }),
        api.get('/challenges/rankings', { params: { year, month } }),
        api.get('/challenges/badges'),
      ];
      const [cRes, rRes, bRes] = await Promise.all(reqs);
      setChallenges(cRes.data.data || []);
      setRankings(rRes.data.data || []);
      setBadges(bRes.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [year, month, user?.id]);

  const handleRefreshProgress = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      await api.post('/challenges/refresh-progress');
      await fetchAll();
    } finally {
      setRefreshing(false);
    }
  };

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-sage-100 rounded-2xl w-1/3" />
          <div className="grid md:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-sage-100 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const myRank = user ? rankings.find((r) => r.userId === user.id) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
      <div className="mb-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-forest-800 flex items-center gap-3">
              <Trophy className="w-10 h-10 text-amber-500" />
              观鸟挑战
            </h1>
            <p className="text-sage-600 mt-2">完成月度挑战，收集专属徽章，与全国观鸟爱好者一较高下</p>
          </div>
          {user && (
            <button
              onClick={handleRefreshProgress}
              disabled={refreshing}
              className="btn-secondary flex items-center gap-2 self-start sm:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              刷新进度
            </button>
          )}
        </div>

        <div className="card p-4 flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl hover:bg-sage-100 transition"
          >
            <ChevronLeft className="w-5 h-5 text-sage-600" />
          </button>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-forest-800">
                {year} 年 {MONTH_NAMES[month]}
              </div>
              {isCurrentMonth && (
                <span className="chip bg-forest-100 text-forest-700 text-xs">当前月份</span>
              )}
            </div>
          </div>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl hover:bg-sage-100 transition"
          >
            <ChevronRight className="w-5 h-5 text-sage-600" />
          </button>
        </div>
      </div>

      {myRank && (
        <div className="card p-5 mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-display text-2xl font-bold shadow-lg">
                #{myRank.rank}
              </div>
              <div>
                <div className="font-display text-lg font-semibold text-forest-800">我的排名</div>
                <div className="text-sm text-sage-600">
                  已完成 <span className="font-bold text-forest-700">{myRank.completedCount}</span> / {challenges.length} 个挑战
                  <span className="mx-2">·</span>
                  总进度 <span className="font-bold text-forest-700">{myRank.totalProgress}%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Crown className={`w-6 h-6 ${myRank.rank <= 3 ? 'text-amber-500' : 'text-sage-300'}`} />
              <span className="text-sm text-sage-600">
                {myRank.rank <= 3 ? '太棒了！保持领先！' : myRank.rank <= 10 ? '加油！冲击前十名！' : '继续努力！'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <TabBtn active={tab === 'challenges'} onClick={() => setTab('challenges')} icon={<Target className="w-4 h-4" />}>
          本月挑战 ({challenges.length})
        </TabBtn>
        <TabBtn active={tab === 'rankings'} onClick={() => setTab('rankings')} icon={<TrendingUp className="w-4 h-4" />}>
          排行榜 ({rankings.length})
        </TabBtn>
        <TabBtn active={tab === 'badges'} onClick={() => setTab('badges')} icon={<Award className="w-4 h-4" />}>
          徽章图鉴 ({badges.length})
        </TabBtn>
      </div>

      <div className="animate-fade-in">
        {tab === 'challenges' && (
          challenges.length === 0 ? (
            <EmptyCard icon={<Target className="w-12 h-12" />} title="本月暂无挑战" desc="系统将在月初自动生成新挑战" />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {challenges.map((challenge, i) => (
                <ChallengeCard key={challenge.id} challenge={challenge} index={i} />
              ))}
            </div>
          )
        )}

        {tab === 'rankings' && (
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-sage-100 bg-sage-50">
              <h3 className="font-display text-lg font-semibold text-forest-800 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                {year} 年 {MONTH_NAMES[month]} 挑战排行榜
              </h3>
            </div>
            {rankings.length === 0 ? (
              <div className="p-12 text-center text-sage-400">
                <Medal className="w-12 h-12 mx-auto mb-3 opacity-50" />
                暂无排行数据
              </div>
            ) : (
              <div className="divide-y divide-sage-100">
                {rankings.map((item) => (
                  <RankingRow key={item.userId} item={item} isMe={user?.id === item.userId} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'badges' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {badges.map((badge, i) => (
              <BadgeCard key={badge.id} badge={badge} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChallengeCard({ challenge, index }: { challenge: ChallengeWithProgress; index: number }) {
  const progress = challenge.progress as UserChallengeProgress | null;
  const currentValue = progress?.currentValue || 0;
  const isCompleted = progress?.completed || false;
  const progressPct = Math.min(100, (currentValue / challenge.target) * 100);

  return (
    <div
      className={`card overflow-hidden animate-slide-up ${isCompleted ? 'ring-2 ring-emerald-400' : ''}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={`h-3 ${isCompleted ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="text-xs text-sage-500 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {challenge.month}
            </div>
            <h3 className="font-display text-lg font-bold text-forest-800 leading-tight">
              {challenge.title}
            </h3>
          </div>
          {isCompleted && (
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-emerald-600 fill-emerald-500" />
            </div>
          )}
        </div>

        <p className="text-sm text-sage-600 mb-4 line-clamp-2">
          {challenge.description}
        </p>

        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-sage-600">当前进度</span>
            <span className="font-bold text-forest-800">
              {currentValue} / {challenge.target} {challenge.unit}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-sage-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isCompleted
                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                  : 'bg-gradient-to-r from-amber-400 to-orange-500'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {progress?.completedAt && (
          <div className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 flex items-center gap-1.5">
            <Award className="w-4 h-4" />
            已于 {formatDateShort(progress.completedAt)} 完成
          </div>
        )}
      </div>
    </div>
  );
}

function RankingRow({ item, isMe }: { item: ChallengeRankingItem; isMe: boolean }) {
  const progressPct = Math.min(100, item.totalProgress / 3);

  return (
    <div
      className={`flex items-center gap-4 p-4 hover:bg-sage-50 transition ${
        isMe ? 'bg-amber-50' : ''
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold flex-shrink-0 ${
          item.rank === 1
            ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-md'
            : item.rank === 2
            ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-md'
            : item.rank === 3
            ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-white shadow-md'
            : 'bg-sage-100 text-sage-600'
        }`}
      >
        {item.rank <= 3 ? (
          <Crown className="w-5 h-5" />
        ) : (
          item.rank
        )}
      </div>

      <Link
        to={`/profile/${item.userId}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        <img
          src={item.user.avatar}
          alt={item.user.username}
          className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
        />
        <div className="min-w-0">
          <div className="font-medium text-forest-800 truncate flex items-center gap-2">
            {item.user.username}
            {isMe && <span className="chip bg-amber-100 text-amber-700 text-[10px]">我</span>}
          </div>
          <div className="text-xs text-sage-500">
            {item.user.observationsCount} 次观测 · {item.user.speciesCount} 种发现
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-4 text-right flex-shrink-0">
        <div>
          <div className="font-display font-bold text-forest-800">
            {item.completedCount}
            <span className="text-sm font-normal text-sage-500"> / 3</span>
          </div>
          <div className="text-xs text-sage-500">已完成</div>
        </div>
        <div className="w-20">
          <div className="w-full h-2 rounded-full bg-sage-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-forest-400 to-forest-600"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="text-xs text-sage-500 mt-0.5">{item.totalProgress}%</div>
        </div>
      </div>
    </div>
  );
}

function BadgeCard({ badge, index }: { badge: Badge; index: number }) {
  return (
    <div
      className="card p-5 text-center animate-slide-up group hover:shadow-card-hover transition-all"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div
        className={`w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${
          RARITY_COLORS[badge.rarity] || RARITY_COLORS.common
        } flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform`}
      >
        {badge.icon}
      </div>
      <h4 className="font-display font-semibold text-forest-800 mb-1">{badge.name}</h4>
      <p className="text-xs text-sage-500 mb-2 line-clamp-2">{badge.description}</p>
      <span
        className={`chip text-[10px] !py-0.5 !px-2 ${
          badge.rarity === 'legendary'
            ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700'
            : badge.rarity === 'epic'
            ? 'bg-purple-100 text-purple-700'
            : badge.rarity === 'rare'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        {RARITY_LABELS[badge.rarity]}
      </span>
    </div>
  );
}

function TabBtn({ active, onClick, children, icon }: { active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap flex items-center gap-2 ${
        active ? 'bg-forest-600 text-white shadow-lg' : 'text-sage-600 hover:bg-sage-100'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function EmptyCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc?: string }) {
  return (
    <div className="card py-16 text-center text-sage-400">
      <div className="mx-auto mb-4 inline-flex text-sage-300">{icon}</div>
      <div className="text-lg font-medium text-sage-600">{title}</div>
      {desc && <div className="text-sm mt-1">{desc}</div>}
    </div>
  );
}
