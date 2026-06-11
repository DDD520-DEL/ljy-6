import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, Trash2, Bird, ChevronRight, ArrowLeft, Clock } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useMapStore } from '../stores/mapStore';
import { useLocationFavoriteStore } from '../stores/locationFavoriteStore';
import { useT } from '../i18n';
import { formatDateTime } from '../lib/format';
import type { LocationFavorite } from '../../shared/types';

export default function FavoritesPage() {
  const t = useT();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { flyTo } = useMapStore();
  const { favorites, loadFavorites, removeFavorite } = useLocationFavoriteStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadFavorites(user.id);
  }, [user, navigate, loadFavorites]);

  const handleNavigateToMap = (favorite: LocationFavorite) => {
    flyTo(favorite.latitude, favorite.longitude, 14);
    navigate('/');
  };

  const handleDelete = (favoriteId: number) => {
    if (!user) return;
    removeFavorite(user.id, favoriteId);
    setShowDeleteConfirm(null);
  };

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-sage-50/50 to-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-white/80 text-sage-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-semibold text-forest-800">
              {t('favorites_title')}
            </h1>
            <p className="text-sm text-sage-500">
              {t('favorites_subtitle')}
            </p>
          </div>
        </div>

        <div className="card !p-4 !mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="font-semibold text-forest-800">
                {favorites.length} {t('favorites_count')}
              </div>
              <div className="text-xs text-sage-500">
                {t('favorites_hint')}
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5"
          >
            <MapPin className="w-4 h-4" />
            {t('favorites_go_map')}
          </button>
        </div>

        {favorites.length === 0 ? (
          <div className="card !p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <Star className="w-10 h-10 text-amber-300" />
            </div>
            <h3 className="font-display font-semibold text-forest-800 text-lg mb-2">
              {t('favorites_empty_title')}
            </h3>
            <p className="text-sage-500 text-sm mb-6 max-w-xs mx-auto">
              {t('favorites_empty_desc')}
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary text-sm py-2.5 px-6"
            >
              {t('favorites_go_explore')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.slice().reverse().map((favorite) => (
              <div
                key={favorite.id}
                className="card !p-0 overflow-hidden group hover:shadow-card-hover transition-shadow"
              >
                <div className="flex">
                  {favorite.thumbnailUrl ? (
                    <div className="w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 relative">
                      <img
                        src={favorite.thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                        <Star className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 bg-gradient-to-br from-forest-100 to-sage-100 flex items-center justify-center relative">
                      <Bird className="w-10 h-10 text-forest-400" />
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                        <Star className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  )}

                  <div className="flex-1 p-4 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {favorite.speciesName && (
                          <h3 className="font-display font-semibold text-forest-800 truncate">
                            {favorite.speciesName}
                          </h3>
                        )}
                        <div className="text-sm text-sage-600 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{favorite.locationName}</span>
                        </div>
                        <div className="text-xs text-sage-400 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(favorite.createdAt)}
                        </div>
                        <div className="text-xs text-sage-400 mt-0.5">
                          {favorite.latitude.toFixed(4)}, {favorite.longitude.toFixed(4)}
                        </div>
                      </div>

                      {showDeleteConfirm === favorite.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(favorite.id)}
                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                            title={t('favorites_confirm_delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="p-2 rounded-lg bg-sage-100 text-sage-600 hover:bg-sage-200 transition"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowDeleteConfirm(favorite.id)}
                          className="p-2 rounded-lg text-sage-400 hover:text-red-500 hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
                          title={t('favorites_remove')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      {favorite.observationId && (
                        <Link
                          to={`/observe/${favorite.observationId}`}
                          className="text-xs px-3 py-1.5 rounded-lg bg-sage-100 text-sage-600 hover:bg-sage-200 transition"
                        >
                          {t('favorites_view_obs')}
                        </Link>
                      )}
                      <button
                        onClick={() => handleNavigateToMap(favorite)}
                        className="flex-1 text-xs py-1.5 rounded-lg bg-forest-600 text-white hover:bg-forest-700 transition flex items-center justify-center gap-1"
                      >
                        <MapPin className="w-3 h-3" />
                        {t('favorites_locate')}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
