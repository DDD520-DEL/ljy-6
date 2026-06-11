import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, X, Bird, Binoculars, Users as UsersIcon, MapPin, Calendar, Database } from 'lucide-react';
import api from '../lib/api';
import { useT } from '../i18n';
import type { Species, Observation, User } from '../../shared/types';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { offlineCache } from '../lib/offlineCache';

type SearchTab = 'all' | 'species' | 'observations' | 'users';

interface SearchResults {
  species: Species[];
  observations: Observation[];
  users: User[];
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isOnline = useOnlineStatus();
  const t = useT();
  const [inputValue, setInputValue] = useState(searchParams.get('q') || '');
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResults>({ species: [], observations: [], users: [] });
  const [totals, setTotals] = useState({ species: 0, observations: 0, users: 0 });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [usingCache, setUsingCache] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults({ species: [], observations: [], users: [] });
      setTotals({ species: 0, observations: 0, users: 0 });
      setUsingCache(false);
      return;
    }
    setLoading(true);
    setUsingCache(false);
    try {
      const res = await api.get('/search', { params: { q: q.trim() } });
      if (res.data?.success) {
        setResults(res.data.data);
        setTotals(res.data.total);
      }
    } catch (err) {
      console.warn('从服务器搜索失败，尝试使用缓存搜索:', err);
      const cached = offlineCache.searchAll(q.trim());
      setResults(cached);
      setTotals({
        species: cached.species.length,
        observations: cached.observations.length,
        users: cached.users.length,
      });
      setUsingCache(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setKeyword(q);
    setInputValue(q);
    if (q) {
      doSearch(q);
    }
  }, [searchParams, doSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputValue.trim();
    if (q) {
      setSearchParams({ q });
    }
  };

  const clearSearch = () => {
    setInputValue('');
    setSearchParams({});
    setKeyword('');
    setResults({ species: [], observations: [], users: [] });
    setTotals({ species: 0, observations: 0, users: 0 });
  };

  const totalCount = totals.species + totals.observations + totals.users;

  const tabs: { key: SearchTab; label: string; count: number; icon: React.ReactNode }[] = [
    { key: 'all', label: t('search_tab_all'), count: totalCount, icon: <Search className="w-4 h-4" /> },
    { key: 'species', label: t('search_tab_species'), count: totals.species, icon: <Bird className="w-4 h-4" /> },
    { key: 'observations', label: t('search_tab_observations'), count: totals.observations, icon: <Binoculars className="w-4 h-4" /> },
    { key: 'users', label: t('search_tab_users'), count: totals.users, icon: <UsersIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-8">
        <h1 className="section-title flex items-center justify-center gap-3">
          <Search className="w-8 h-8 text-forest-600" />
          {t('search_title')}
        </h1>
        <p className="mt-2 text-sage-500">{t('search_subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sage-400" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t('search_placeholder')}
            className="input-base !pl-12 !pr-24 !py-4 !text-lg !rounded-2xl shadow-card"
            autoFocus
          />
          {inputValue && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-24 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-sage-100 transition"
            >
              <X className="w-4 h-4 text-sage-400" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary !py-2.5 !px-5 !rounded-xl text-sm"
          >
            {t('search_title')}
          </button>
        </div>
      </form>

      {keyword && !loading && (
        <div className="text-center text-sage-500 text-sm mb-6 flex items-center justify-center gap-2 flex-wrap">
          <span>
            {t('search_results_for')} "<span className="font-medium text-forest-700">{keyword}</span>" · {totalCount} {t('search_count')}
          </span>
          {usingCache && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
              <Database className="w-3 h-3" />
              {t('offline_search_hint')}
            </span>
          )}
        </div>
      )}

      {usingCache && keyword && !loading && (
        <div className="text-xs text-sage-500 bg-amber-50/60 border border-amber-100 rounded-xl px-4 py-2.5 mb-6 text-center">
          {t('offline_using_cache')}
        </div>
      )}

      {keyword && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-forest-600 text-white shadow-md'
                  : 'bg-white text-sage-600 border border-sage-200 hover:bg-forest-50 hover:border-forest-200'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-white/20' : 'bg-sage-100'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-forest-200 border-t-forest-600 rounded-full animate-spin" />
        </div>
      )}

      {!loading && !keyword && (
        <div className="flex flex-col items-center justify-center py-20 text-sage-400">
          <Search className="w-16 h-16 mb-4 stroke-1" />
          <div className="text-lg font-medium">{t('search_hint')}</div>
          <div className="text-sm mt-1">{t('search_hint_desc')}</div>
        </div>
      )}

      {!loading && keyword && totalCount === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-sage-400">
          <Search className="w-16 h-16 mb-4 stroke-1" />
          <div className="text-lg font-medium">{t('search_no_results')}</div>
          <div className="text-sm mt-1">{t('search_no_results_desc')}</div>
        </div>
      )}

      {!loading && keyword && totalCount > 0 && (
        <div className="space-y-8">
          {(activeTab === 'all' || activeTab === 'species') && results.species.length > 0 && (
            <section>
              {activeTab === 'all' && (
                <div className="flex items-center gap-2 mb-4">
                  <Bird className="w-5 h-5 text-forest-600" />
                  <h2 className="font-display text-lg font-semibold text-forest-800">
                    {t('search_tab_species')}
                  </h2>
                  <span className="text-xs text-sage-500 bg-sage-100 px-2 py-0.5 rounded-full">{totals.species}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.species.map((sp) => (
                  <SpeciesCardHighlight key={sp.id} species={sp} keyword={keyword} />
                ))}
              </div>
            </section>
          )}

          {(activeTab === 'all' || activeTab === 'observations') && results.observations.length > 0 && (
            <section>
              {activeTab === 'all' && (
                <div className="flex items-center gap-2 mb-4">
                  <Binoculars className="w-5 h-5 text-forest-600" />
                  <h2 className="font-display text-lg font-semibold text-forest-800">
                    {t('search_tab_observations')}
                  </h2>
                  <span className="text-xs text-sage-500 bg-sage-100 px-2 py-0.5 rounded-full">{totals.observations}</span>
                </div>
              )}
              <div className="space-y-4">
                {results.observations.map((obs) => (
                  <ObservationCardHighlight key={obs.id} observation={obs} keyword={keyword} />
                ))}
              </div>
            </section>
          )}

          {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
            <section>
              {activeTab === 'all' && (
                <div className="flex items-center gap-2 mb-4">
                  <UsersIcon className="w-5 h-5 text-forest-600" />
                  <h2 className="font-display text-lg font-semibold text-forest-800">
                    {t('search_tab_users')}
                  </h2>
                  <span className="text-xs text-sage-500 bg-sage-100 px-2 py-0.5 rounded-full">{totals.users}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.users.map((u) => (
                  <UserCardHighlight key={u.id} user={u} keyword={keyword} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function HighlightText({ text, keyword }: { text: string; keyword: string }) {
  if (!keyword.trim() || !text) return <>{text}</>;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  const testRegex = new RegExp(escaped, 'i');
  return (
    <>
      {parts.map((part, i) =>
        testRegex.test(part) ? (
          <mark key={i} className="bg-amber-200/70 text-forest-900 rounded px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function SpeciesCardHighlight({ species, keyword }: { species: Species; keyword: string }) {
  return (
    <Link to={`/species/${species.id}`} className="card group block overflow-hidden animate-fade-in">
      <div className="relative aspect-[4/3] overflow-hidden bg-sage-50">
        <img
          src={species.imageUrl}
          alt={species.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg font-semibold text-forest-800 group-hover:text-forest-600 transition">
          <HighlightText text={species.name} keyword={keyword} />
        </h3>
        <div className="text-xs text-sage-500 italic mt-0.5">
          <HighlightText text={species.scientificName} keyword={keyword} />
        </div>
        <p className="mt-2 text-sm text-sage-600 line-clamp-2">
          <HighlightText text={species.description} keyword={keyword} />
        </p>
      </div>
    </Link>
  );
}

function ObservationCardHighlight({ observation, keyword }: { observation: Observation; keyword: string }) {
  const t = useT();
  const photo = observation.thumbnailUrls?.[0] || observation.photoUrls?.[0];
  const u = observation.user;

  return (
    <Link to={`/observe/${observation.id}`} className="card group block animate-fade-in">
      <div className="flex gap-4 p-4">
        {photo && (
          <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-sage-50">
            <img src={photo} alt={observation.speciesName} className="w-full h-full object-cover" loading="lazy" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base font-semibold text-forest-800 group-hover:text-forest-600 transition">
            <HighlightText text={observation.speciesName} keyword={keyword} />
          </h3>
          {observation.description && (
            <p className="mt-1 text-sm text-sage-600 line-clamp-2">
              <HighlightText text={observation.description} keyword={keyword} />
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-sage-500">
            {u && (
              <div className="flex items-center gap-1">
                <img src={u.avatar} alt={u.username} className="w-4 h-4 rounded-full" />
                <HighlightText text={u.username} keyword={keyword} />
              </div>
            )}
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-forest-500" />
              {observation.locationName || t('map_unknown_location')}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-forest-500" />
              {observation.observationTime.slice(0, 10)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function UserCardHighlight({ user, keyword }: { user: User; keyword: string }) {
  const t = useT();
  return (
    <Link to={`/profile/${user.id}`} className="card p-5 animate-fade-in block">
      <div className="flex items-center gap-4">
        <img
          src={user.avatar}
          alt={user.username}
          className="w-14 h-14 rounded-2xl border-2 border-forest-100 bg-white shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base font-semibold text-forest-800 hover:text-forest-600 transition truncate">
            <HighlightText text={user.username} keyword={keyword} />
          </h3>
          {user.bio && (
            <p className="mt-1 text-sm text-sage-600 line-clamp-2">
              <HighlightText text={user.bio} keyword={keyword} />
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-sage-600">
        <div><span className="font-semibold text-forest-700">{user.observationsCount}</span> {t('user_card_obs')}</div>
        <div><span className="font-semibold text-forest-700">{user.speciesCount}</span> {t('user_card_species')}</div>
        <div><span className="font-semibold text-forest-700">{user.followersCount}</span> {t('user_card_followers')}</div>
      </div>
    </Link>
  );
}
