import { Link } from 'react-router-dom';
import { Binoculars, Eye, UserPlus, UserMinus, MapPin } from 'lucide-react';
import type { User } from '../../shared/types';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';

interface Props {
  user: User;
  onUpdate?: () => void;
}

export function UserCard({ user, onUpdate }: Props) {
  const { user: curUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const isSelf = curUser?.id === user.id;

  const toggleFollow = async () => {
    if (!curUser || isSelf) return;
    setLoading(true);
    try {
      if (user.isFollowing) {
        await api.delete(`/users/follow/${user.id}`);
      } else {
        await api.post(`/users/follow/${user.id}`);
      }
      onUpdate?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5 animate-fade-in">
      <Link to={`/profile/${user.id}`} className="flex items-start gap-4">
        <img
          src={user.avatar}
          alt={user.username}
          className="w-16 h-16 rounded-2xl border-2 border-forest-100 bg-white shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-semibold text-forest-800 hover:text-forest-600 transition truncate">
            {user.username}
          </h3>
          {user.bio && <p className="mt-1 text-sm text-sage-600 line-clamp-2">{user.bio}</p>}
        </div>
      </Link>

      <div className="mt-4 grid grid-cols-3 gap-2 py-3 border-y border-sage-50">
        <Stat icon={<Binoculars className="w-3.5 h-3.5" />} label="观测" value={user.observationsCount} />
        <Stat icon={<Eye className="w-3.5 h-3.5" />} label="物种" value={user.speciesCount} />
        <Stat icon={<MapPin className="w-3.5 h-3.5" />} label="粉丝" value={user.followersCount} />
      </div>

      <div className="mt-4 flex gap-2">
        <Link to={`/profile/${user.id}`} className="btn-secondary flex-1 !py-2 text-sm">
          查看主页
        </Link>
        {!isSelf && curUser && (
          <button
            onClick={toggleFollow}
            disabled={loading}
            className={user.isFollowing ? 'btn-secondary flex-1 !py-2 text-sm' : 'btn-primary flex-1 !py-2 text-sm'}
          >
            <span className="inline-flex items-center justify-center gap-1.5">
              {user.isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {user.isFollowing ? '已关注' : '关注'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 text-forest-600">
        {icon}
        <span className="font-semibold">{value}</span>
      </div>
      <div className="text-[11px] text-sage-500 mt-0.5">{label}</div>
    </div>
  );
}
