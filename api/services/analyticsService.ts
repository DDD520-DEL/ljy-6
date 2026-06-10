import { getDb } from '../db/storage.js';

export const AnalyticsService = {
  frequency(options: { startDate?: string; endDate?: string; limit?: number } = {}) {
    const db = getDb();
    const limit = options.limit ?? 15;
    let list = [...db.observations];
    if (options.startDate) list = list.filter((o) => o.observationTime >= options.startDate);
    if (options.endDate) list = list.filter((o) => o.observationTime <= options.endDate);
    const map = new Map<number, number>();
    list.forEach((o) => {
      if (!o.speciesId) return;
      map.set(o.speciesId, (map.get(o.speciesId) || 0) + 1);
    });
    const arr = Array.from(map.entries())
      .map(([speciesId, count]) => {
        const sp = db.species.find((s) => s.id === speciesId);
        return {
          speciesId,
          speciesName: sp?.name ?? '未知',
          count,
          imageUrl: sp?.imageUrl ?? '',
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    return { data: arr, total: arr.length };
  },

  seasonal(options: { speciesId?: number } = {}) {
    const db = getDb();
    let list = [...db.observations];
    if (options.speciesId) list = list.filter((o) => o.speciesId === options.speciesId);
    const counts: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) counts[m] = 0;
    list.forEach((o) => {
      const month = new Date(o.observationTime).getMonth() + 1;
      counts[month] = (counts[month] || 0) + 1;
    });
    const arr = Object.entries(counts).map(([m, c]) => ({ month: Number(m), count: c }));
    return { data: arr };
  },

  heatmap(options: { speciesId?: number; startDate?: string; endDate?: string; month?: number } = {}) {
    const db = getDb();
    let list = [...db.observations];
    if (options.speciesId) list = list.filter((o) => o.speciesId === options.speciesId);
    if (options.startDate) list = list.filter((o) => o.observationTime >= options.startDate);
    if (options.endDate) list = list.filter((o) => o.observationTime <= options.endDate);
    if (options.month !== undefined) {
      list = list.filter((o) => new Date(o.observationTime).getMonth() + 1 === options.month);
    }
    const grid: Record<string, { lat: number; lng: number; count: number }> = {};
    list.forEach((o) => {
      const key = `${Math.round(o.latitude * 100) / 100},${Math.round(o.longitude * 100) / 100}`;
      if (grid[key]) {
        grid[key].count += 1;
      } else {
        grid[key] = { lat: o.latitude, lng: o.longitude, count: 1 };
      }
    });
    const data: [number, number, number][] = Object.values(grid).map((v) => [v.lat, v.lng, v.count]);
    return { data };
  },

  overview() {
    const db = getDb();
    return {
      totalObservations: db.observations.length,
      totalSpecies: db.species.length,
      totalUsers: db.users.length,
      totalComments: db.comments.length,
      recentObservations: db.observations
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5)
        .map((o) => ({
          id: o.id,
          speciesName: o.speciesName,
          locationName: o.locationName,
          observationTime: o.observationTime,
          photoUrl: o.photoUrls[0] ?? '',
        })),
    };
  },
};
