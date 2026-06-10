import { getDb, nextId, scheduleSave } from '../db/storage.js';
import type { Collection, Species } from '../../shared/types.js';

export const CollectionService = {
  add(userId: number, speciesId: number) {
    const db = getDb();
    const existing = db.collections.find((c) => c.userId === userId && c.speciesId === speciesId);
    if (existing) return false;
    const species = db.species.find((s) => s.id === speciesId);
    if (!species) return false;
    const id = nextId('collections');
    const collection = {
      id,
      userId,
      speciesId,
      createdAt: new Date().toISOString(),
    };
    db.collections.push(collection);
    scheduleSave();
    return { ...collection, species: species as Species };
  },

  remove(userId: number, speciesId: number) {
    const db = getDb();
    const before = db.collections.length;
    db.collections = db.collections.filter((c) => !(c.userId === userId && c.speciesId === speciesId));
    if (db.collections.length < before) {
      scheduleSave();
      return true;
    }
    return false;
  },

  isCollected(userId: number, speciesId: number) {
    const db = getDb();
    return db.collections.some((c) => c.userId === userId && c.speciesId === speciesId);
  },

  getUserCollections(userId: number) {
    const db = getDb();
    return db.collections
      .filter((c) => c.userId === userId)
      .map((c) => {
        const species = db.species.find((s) => s.id === c.speciesId);
        return { ...c, species: species as Species } as Collection;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getCollectionsGrouped(userId: number) {
    const collections = this.getUserCollections(userId);
    const orderMap = new Map<string, Map<string, Collection[]>>();
    collections.forEach((c) => {
      if (!c.species) return;
      const order = c.species.order || '未分类';
      const family = c.species.family || '未分类';
      if (!orderMap.has(order)) {
        orderMap.set(order, new Map());
      }
      const familyMap = orderMap.get(order)!;
      if (!familyMap.has(family)) {
        familyMap.set(family, []);
      }
      familyMap.get(family)!.push(c);
    });
    const result: {
      order: string;
      families: { family: string; collections: Collection[]; count: number }[];
      orderCount: number;
    }[] = [];
    orderMap.forEach((familyMap, order) => {
      const families: { family: string; collections: Collection[]; count: number }[] = [];
      let orderCount = 0;
      familyMap.forEach((cols, family) => {
        families.push({ family, collections: cols, count: cols.length });
        orderCount += cols.length;
      });
      families.sort((a, b) => a.family.localeCompare(b.family, 'zh'));
      result.push({ order, families, orderCount });
    });
    result.sort((a, b) => a.order.localeCompare(b.order, 'zh'));
    return { data: result, total: collections.length };
  },
};
