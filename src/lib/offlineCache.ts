import type { Species, Observation, Collection, User, LocationFavorite, Tag } from '../../shared/types';

const CACHE_VERSION = '1.4.0';
const CACHE_KEY_PREFIX = 'bird_cache_';

export enum CacheKey {
  SPECIES_LIST = 'species_list',
  OBSERVATIONS_BASIC = 'observations_basic',
  OBSERVATION_DETAIL_PREFIX = 'observation_detail_',
  USER_COLLECTIONS = 'user_collections',
  SPECIES_DETAIL_PREFIX = 'species_detail_',
  USERS_BASIC = 'users_basic',
  LOCATION_FAVORITES = 'location_favorites',
  TAGS_LIST = 'tags_list',
  CACHE_META = 'cache_meta',
}

interface CacheMeta {
  version: string;
  lastSyncTime: number;
  syncedDataTypes: string[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000;

const getFullKey = (key: string): string => `${CACHE_KEY_PREFIX}${key}`;

const serialize = <T>(data: T): string => {
  return JSON.stringify({
    data,
    timestamp: Date.now(),
    version: CACHE_VERSION,
  });
};

const deserialize = <T>(str: string | null): CacheEntry<T> | null => {
  if (!str) return null;
  try {
    const parsed = JSON.parse(str) as CacheEntry<T>;
    if (parsed.version !== CACHE_VERSION) return null;
    if (Date.now() - parsed.timestamp > MAX_CACHE_AGE) return null;
    return parsed;
  } catch {
    return null;
  }
};

const normalizeForSearch = (text: string): string => {
  return text.toLowerCase().trim();
};

const stringMatch = (source: string, keyword: string): boolean => {
  if (!source || !keyword) return false;
  return normalizeForSearch(source).includes(normalizeForSearch(keyword));
};

export const offlineCache = {
  getCacheMeta(): CacheMeta | null {
    const raw = localStorage.getItem(getFullKey(CacheKey.CACHE_META));
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  updateCacheMeta(dataType: string): void {
    const meta = this.getCacheMeta() || {
      version: CACHE_VERSION,
      lastSyncTime: 0,
      syncedDataTypes: [],
    };
    meta.lastSyncTime = Date.now();
    meta.version = CACHE_VERSION;
    if (!meta.syncedDataTypes.includes(dataType)) {
      meta.syncedDataTypes.push(dataType);
    }
    localStorage.setItem(getFullKey(CacheKey.CACHE_META), JSON.stringify(meta));
  },

  isDataSynced(dataType: string): boolean {
    const meta = this.getCacheMeta();
    return meta?.syncedDataTypes.includes(dataType) ?? false;
  },

  setSpeciesList(species: Species[]): void {
    localStorage.setItem(getFullKey(CacheKey.SPECIES_LIST), serialize(species));
    this.updateCacheMeta(CacheKey.SPECIES_LIST);
  },

  getSpeciesList(): Species[] | null {
    const raw = localStorage.getItem(getFullKey(CacheKey.SPECIES_LIST));
    const entry = deserialize<Species[]>(raw);
    return entry?.data ?? null;
  },

  searchSpecies(keyword: string, limit = 50): Species[] {
    const all = this.getSpeciesList();
    if (!all || !keyword.trim()) return all?.slice(0, limit) || [];
    const kw = keyword.trim();
    return all
      .filter((s) =>
        stringMatch(s.name, kw) ||
        stringMatch(s.scientificName, kw) ||
        stringMatch(s.description, kw) ||
        stringMatch(s.order, kw) ||
        stringMatch(s.family, kw) ||
        s.habitat?.some((h) => stringMatch(h, kw)),
      )
      .slice(0, limit);
  },

  setTagsList(tags: Tag[]): void {
    localStorage.setItem(getFullKey(CacheKey.TAGS_LIST), serialize(tags));
    this.updateCacheMeta(CacheKey.TAGS_LIST);
  },

  getTagsList(): Tag[] | null {
    const raw = localStorage.getItem(getFullKey(CacheKey.TAGS_LIST));
    const entry = deserialize<Tag[]>(raw);
    return entry?.data ?? null;
  },

  setObservationsBasic(observations: Observation[]): void {
    const basic = observations.map((o) => ({
      id: o.id,
      userId: o.userId,
      speciesId: o.speciesId,
      speciesName: o.speciesName,
      latitude: o.latitude,
      longitude: o.longitude,
      locationName: o.locationName,
      observationTime: o.observationTime,
      thumbnailUrls: o.thumbnailUrls,
      photoUrls: o.photoUrls?.slice(0, 1),
      likes: o.likes,
      createdAt: o.createdAt,
      weather: o.weather,
      behavior: o.behavior,
      description: o.description,
      tags: o.tags,
      user: o.user ? {
        id: o.user.id,
        username: o.user.username,
        avatar: o.user.avatar,
      } : undefined,
      species: o.species ? {
        id: o.species.id,
        name: o.species.name,
        imageUrl: o.species.imageUrl,
      } : undefined,
    })) as unknown as Observation[];
    localStorage.setItem(getFullKey(CacheKey.OBSERVATIONS_BASIC), serialize(basic));
    this.updateCacheMeta(CacheKey.OBSERVATIONS_BASIC);
  },

  getObservationsBasic(): Observation[] | null {
    const raw = localStorage.getItem(getFullKey(CacheKey.OBSERVATIONS_BASIC));
    const entry = deserialize<Observation[]>(raw);
    return entry?.data ?? null;
  },

  searchObservations(keyword: string, limit = 100): Observation[] {
    const all = this.getObservationsBasic();
    if (!all) return [];
    if (!keyword.trim()) return all.slice(0, limit);
    const kw = keyword.trim();
    return all
      .filter((o) =>
        stringMatch(o.speciesName, kw) ||
        stringMatch(o.locationName, kw) ||
        stringMatch(o.description, kw) ||
        stringMatch(o.behavior, kw) ||
        stringMatch(o.user?.username || '', kw),
      )
      .slice(0, limit);
  },

  getObservationsBySpecies(speciesId: number): Observation[] {
    const all = this.getObservationsBasic();
    if (!all) return [];
    return all.filter((o) => o.speciesId === speciesId);
  },

  getObservationsByUser(userId: number): Observation[] {
    const all = this.getObservationsBasic();
    if (!all) return [];
    return all.filter((o) => o.userId === userId);
  },

  setObservationDetail(id: number, observation: Observation): void {
    const basic = {
      ...observation,
      comments: observation.comments?.slice(0, 20).map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        user: {
          id: c.user.id,
          username: c.user.username,
          avatar: c.user.avatar,
        },
      })),
    };
    localStorage.setItem(
      getFullKey(`${CacheKey.OBSERVATION_DETAIL_PREFIX}${id}`),
      serialize(basic),
    );
  },

  getObservationDetail(id: number): Observation | null {
    const raw = localStorage.getItem(getFullKey(`${CacheKey.OBSERVATION_DETAIL_PREFIX}${id}`));
    const entry = deserialize<Observation>(raw);
    return entry?.data ?? null;
  },

  setUsersBasic(users: User[]): void {
    localStorage.setItem(getFullKey(CacheKey.USERS_BASIC), serialize(users));
    this.updateCacheMeta(CacheKey.USERS_BASIC);
  },

  getUsersBasic(): User[] | null {
    const raw = localStorage.getItem(getFullKey(CacheKey.USERS_BASIC));
    const entry = deserialize<User[]>(raw);
    return entry?.data ?? null;
  },

  searchUsers(keyword: string, limit = 50): User[] {
    const all = this.getUsersBasic();
    if (!all || !keyword.trim()) return all?.slice(0, limit) || [];
    const kw = keyword.trim();
    return all
      .filter((u) =>
        stringMatch(u.username, kw) ||
        stringMatch(u.bio, kw),
      )
      .slice(0, limit);
  },

  addUserToCache(user: User): void {
    const all = this.getUsersBasic() || [];
    const idx = all.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      all[idx] = user;
    } else {
      all.push(user);
    }
    this.setUsersBasic(all);
  },

  setUserCollections(userId: number, collections: Collection[]): void {
    const enriched = collections.map((c) => {
      if (!c.species) {
        const speciesList = this.getSpeciesList();
        const matched = speciesList?.find((s) => s.id === c.speciesId);
        if (matched) {
          return { ...c, species: matched };
        }
      }
      return c;
    });
    localStorage.setItem(
      getFullKey(`${CacheKey.USER_COLLECTIONS}_${userId}`),
      serialize(enriched),
    );
    this.updateCacheMeta(CacheKey.USER_COLLECTIONS);
  },

  getUserCollections(userId: number): Collection[] | null {
    const raw = localStorage.getItem(getFullKey(`${CacheKey.USER_COLLECTIONS}_${userId}`));
    const entry = deserialize<Collection[]>(raw);
    let data = entry?.data ?? null;
    if (data) {
      const speciesList = this.getSpeciesList();
      if (speciesList) {
        data = data.map((c) => {
          if (!c.species) {
            const matched = speciesList.find((s) => s.id === c.speciesId);
            if (matched) {
              return { ...c, species: matched };
            }
          }
          return c;
        });
      }
    }
    return data;
  },

  isSpeciesCollected(userId: number, speciesId: number): boolean {
    const collections = this.getUserCollections(userId);
    if (!collections) return false;
    return collections.some((c) => c.speciesId === speciesId);
  },

  addCollection(userId: number, speciesId: number): void {
    const collections = this.getUserCollections(userId) || [];
    if (collections.some((c) => c.speciesId === speciesId)) return;
    const species = this.getSpeciesDetail(speciesId) || this.getSpeciesList()?.find((s) => s.id === speciesId);
    const newCollection: Collection = {
      id: Date.now(),
      userId,
      speciesId,
      createdAt: new Date().toISOString(),
      species: species || undefined,
    };
    collections.push(newCollection);
    this.setUserCollections(userId, collections);
  },

  removeCollection(userId: number, speciesId: number): void {
    const collections = this.getUserCollections(userId) || [];
    const filtered = collections.filter((c) => c.speciesId !== speciesId);
    this.setUserCollections(userId, filtered);
  },

  setSpeciesDetail(id: number, species: Species & { observations?: Observation[] }): void {
    const basic = {
      ...species,
      observations: species.observations?.slice(0, 10).map((o) => ({
        id: o.id,
        speciesName: o.speciesName,
        latitude: o.latitude,
        longitude: o.longitude,
        locationName: o.locationName,
        observationTime: o.observationTime,
        thumbnailUrls: o.thumbnailUrls,
        photoUrls: o.photoUrls?.slice(0, 1),
        user: o.user ? {
          id: o.user.id,
          username: o.user.username,
          avatar: o.user.avatar,
        } : undefined,
      })),
    };
    localStorage.setItem(
      getFullKey(`${CacheKey.SPECIES_DETAIL_PREFIX}${id}`),
      serialize(basic),
    );
  },

  getSpeciesDetail(id: number): (Species & { observations?: Observation[] }) | null {
    const raw = localStorage.getItem(getFullKey(`${CacheKey.SPECIES_DETAIL_PREFIX}${id}`));
    const entry = deserialize<Species & { observations?: Observation[] }>(raw);
    return entry?.data ?? null;
  },

  searchAll(keyword: string): {
    species: Species[];
    observations: Observation[];
    users: User[];
  } {
    return {
      species: this.searchSpecies(keyword, 20),
      observations: this.searchObservations(keyword, 30),
      users: this.searchUsers(keyword, 20),
    };
  },

  async preloadAllData(userId?: number): Promise<{
    speciesLoaded: boolean;
    observationsLoaded: boolean;
    collectionsLoaded: boolean;
    usersLoaded: boolean;
  }> {
    const result = {
      speciesLoaded: false,
      observationsLoaded: false,
      collectionsLoaded: false,
      usersLoaded: false,
    };

    try {
      const { default: api } = await import('./api');

      const speciesRes = await api.get('/species', { params: { limit: 1000 } });
      if (speciesRes.data?.data) {
        this.setSpeciesList(speciesRes.data.data);
        result.speciesLoaded = true;
      }
    } catch (err) {
      console.warn('预加载物种数据失败:', err);
    }

    try {
      const { default: api } = await import('./api');
      const obsRes = await api.get('/observations', { params: { limit: 200 } });
      if (obsRes.data?.data) {
        this.setObservationsBasic(obsRes.data.data);
        result.observationsLoaded = true;
        const usersMap = new Map<number, User>();
        obsRes.data.data.forEach((o: Observation) => {
          if (o.user) {
            usersMap.set(o.user.id, o.user);
          }
        });
        if (usersMap.size > 0) {
          this.setUsersBasic(Array.from(usersMap.values()));
          result.usersLoaded = true;
        }
      }
    } catch (err) {
      console.warn('预加载观测数据失败:', err);
    }

    if (userId) {
      try {
        const { default: api } = await import('./api');
        const colRes = await api.get(`/collections/user/${userId}`);
        if (colRes.data?.data) {
          this.setUserCollections(userId, colRes.data.data);
          result.collectionsLoaded = true;
        }
      } catch (err) {
        console.warn('预加载收藏数据失败:', err);
      }
    }

    return result;
  },

  async preloadAdditionalData(userId?: number): Promise<void> {
    if (userId) {
      try {
        const { default: api } = await import('./api');
        const userRes = await api.get(`/users/${userId}`);
        if (userRes.data?.data) {
          this.addUserToCache(userRes.data.data);
        }
      } catch (err) {
        console.warn('预加载用户数据失败:', err);
      }
    }
  },

  clearAll(): void {
    Object.values(CacheKey).forEach((key) => {
      if (key === CacheKey.CACHE_META) {
        localStorage.removeItem(getFullKey(key));
      } else {
        const prefix = getFullKey(key);
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith(prefix)) {
            localStorage.removeItem(k);
          }
        });
      }
    });
  },

  clearUserCollections(userId: number): void {
    localStorage.removeItem(getFullKey(`${CacheKey.USER_COLLECTIONS}_${userId}`));
  },

  setLocationFavorites(userId: number, favorites: LocationFavorite[]): void {
    localStorage.setItem(
      getFullKey(`${CacheKey.LOCATION_FAVORITES}_${userId}`),
      serialize(favorites),
    );
    this.updateCacheMeta(CacheKey.LOCATION_FAVORITES);
  },

  getLocationFavorites(userId: number): LocationFavorite[] | null {
    const raw = localStorage.getItem(getFullKey(`${CacheKey.LOCATION_FAVORITES}_${userId}`));
    const entry = deserialize<LocationFavorite[]>(raw);
    return entry?.data ?? null;
  },

  isLocationFavorited(userId: number, lat: number, lng: number): boolean {
    const favorites = this.getLocationFavorites(userId);
    if (!favorites) return false;
    return favorites.some(
      (f) => Math.abs(f.latitude - lat) < 0.000001 && Math.abs(f.longitude - lng) < 0.000001
    );
  },

  clearLocationFavorites(userId: number): void {
    localStorage.removeItem(getFullKey(`${CacheKey.LOCATION_FAVORITES}_${userId}`));
  },

  getCacheSize(): number {
    let size = 0;
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        size += localStorage.getItem(key)?.length || 0;
      }
    });
    return Math.round(size / 1024);
  },

  getCacheSummary(userId?: number): {
    speciesCount: number;
    observationsCount: number;
    collectionsCount: number;
    locationFavoritesCount: number;
    usersCount: number;
    sizeKB: number;
    lastSync: number | null;
  } {
    const meta = this.getCacheMeta();
    let collectionsCount = 0;
    let locationFavoritesCount = 0;
    if (userId) {
      collectionsCount = this.getUserCollections(userId)?.length || 0;
      locationFavoritesCount = this.getLocationFavorites(userId)?.length || 0;
    }
    return {
      speciesCount: this.getSpeciesList()?.length || 0,
      observationsCount: this.getObservationsBasic()?.length || 0,
      collectionsCount,
      locationFavoritesCount,
      usersCount: this.getUsersBasic()?.length || 0,
      sizeKB: this.getCacheSize(),
      lastSync: meta?.lastSyncTime || null,
    };
  },
};

export default offlineCache;
