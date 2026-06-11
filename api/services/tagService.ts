import { getDb, nextId, scheduleSave } from '../db/storage.js';
import type { Tag } from '../../shared/types.js';

const DEFAULT_COLORS = [
  '#2D6A4F', '#40916C', '#52B788', '#74C69D',
  '#E07A5F', '#F2CC8F', '#81B29A', '#3D405B',
  '#9B5DE5', '#F15BB5', '#00BBF9', '#00F5D4',
  '#EF476F', '#FFD166', '#06D6A0', '#118AB2',
];

export const TagService = {
  list(): Tag[] {
    const db = getDb();
    return [...db.tags].sort((a, b) => a.name.localeCompare(b.name));
  },

  getById(id: number): Tag | null {
    const db = getDb();
    return db.tags.find((t) => t.id === id) || null;
  },

  getOrCreate(name: string): Tag {
    const db = getDb();
    const existing = db.tags.find((t) => t.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) return existing;

    const usedColors = db.tags.map((t: Tag) => t.color);
    const availableColor = DEFAULT_COLORS.find((c) => !usedColors.includes(c)) || DEFAULT_COLORS[db.tags.length % DEFAULT_COLORS.length];

    const tag: Tag = {
      id: nextId('tags'),
      name: name.trim(),
      color: availableColor,
      createdAt: new Date().toISOString(),
    };
    db.tags.push(tag);
    scheduleSave();
    return tag;
  },

  create(name: string, color?: string): Tag {
    const db = getDb();
    const existing = db.tags.find((t) => t.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) return existing;

    const tag: Tag = {
      id: nextId('tags'),
      name: name.trim(),
      color: color || DEFAULT_COLORS[db.tags.length % DEFAULT_COLORS.length],
      createdAt: new Date().toISOString(),
    };
    db.tags.push(tag);
    scheduleSave();
    return tag;
  },

  update(id: number, data: { name?: string; color?: string }): Tag | null {
    const db = getDb();
    const tag = db.tags.find((t) => t.id === id);
    if (!tag) return null;
    if (data.name !== undefined) tag.name = data.name.trim();
    if (data.color !== undefined) tag.color = data.color;
    scheduleSave();
    return tag;
  },

  delete(id: number): boolean {
    const db = getDb();
    const idx = db.tags.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    db.tags.splice(idx, 1);
    db.observationTags = db.observationTags.filter((ot) => ot.tagId !== id);
    scheduleSave();
    return true;
  },

  getTagsForObservation(observationId: number): Tag[] {
    const db = getDb();
    const tagIds = db.observationTags
      .filter((ot) => ot.observationId === observationId)
      .map((ot) => ot.tagId);
    return db.tags.filter((t) => tagIds.includes(t.id));
  },

  setTagsForObservation(observationId: number, tagNames: string[]): Tag[] {
    const db = getDb();
    db.observationTags = db.observationTags.filter((ot) => ot.observationId !== observationId);

    const uniqueNames = [...new Set(tagNames.map((n) => n.trim()).filter((n) => n.length > 0))];
    const tags: Tag[] = [];

    for (const name of uniqueNames) {
      const tag = this.getOrCreate(name);
      const id = nextId('observationTags');
      db.observationTags.push({ id, observationId, tagId: tag.id });
      tags.push(tag);
    }

    scheduleSave();
    return tags;
  },

  addTagToObservation(observationId: number, tagName: string): Tag | null {
    const db = getDb();
    const tag = this.getOrCreate(tagName);
    const existing = db.observationTags.find(
      (ot) => ot.observationId === observationId && ot.tagId === tag.id,
    );
    if (existing) return tag;
    const id = nextId('observationTags');
    db.observationTags.push({ id, observationId, tagId: tag.id });
    scheduleSave();
    return tag;
  },

  removeTagFromObservation(observationId: number, tagId: number): boolean {
    const db = getDb();
    const before = db.observationTags.length;
    db.observationTags = db.observationTags.filter(
      (ot) => !(ot.observationId === observationId && ot.tagId === tagId),
    );
    scheduleSave();
    return db.observationTags.length < before;
  },

  getObservationsByTagId(tagId: number): number[] {
    const db = getDb();
    return db.observationTags
      .filter((ot) => ot.tagId === tagId)
      .map((ot) => ot.observationId);
  },
};
