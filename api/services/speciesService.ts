import { getDb } from '../db/storage.js';
import type { Species, SpeciesMatch, BirdSize, BeakShape } from '../../shared/types.js';
import { ObservationService } from './observationService.js';

const SIZE_WEIGHT = 25;
const BEAK_WEIGHT = 25;
const COLOR_WEIGHT = 30;
const HABITAT_WEIGHT = 20;

export const SpeciesService = {
  getAll(options: { size?: BirdSize; beakShape?: BeakShape; featherColors?: string[]; habitat?: string[]; search?: string; limit?: number } = {}) {
    const db = getDb();
    let list = [...db.species];
    if (options.size) list = list.filter((s) => s.size === options.size);
    if (options.beakShape) list = list.filter((s) => s.beakShape === options.beakShape);
    if (options.featherColors && options.featherColors.length > 0) {
      list = list.filter((s) =>
        options.featherColors!.some((c) => s.featherColors.includes(c)),
      );
    }
    if (options.habitat && options.habitat.length > 0) {
      list = list.filter((s) => options.habitat!.some((h) => s.habitat.includes(h)));
    }
    if (options.search) {
      const q = options.search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.scientificName.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q),
      );
    }
    if (options.limit) list = list.slice(0, options.limit);
    return { data: list as Species[], total: list.length };
  },

  getById(id: number) {
    const db = getDb();
    const sp = db.species.find((s) => s.id === id);
    return sp ? (sp as Species) : null;
  },

  getDetail(id: number) {
    const sp = this.getById(id);
    if (!sp) return null;
    const obs = ObservationService.list({ speciesId: id, limit: 20 });
    return { ...(sp as Species), observations: obs.data };
  },

  match(options: { size?: BirdSize; beakShape?: BeakShape; featherColors?: string[]; habitat?: string[] }): SpeciesMatch[] {
    const db = getDb();
    const matches: SpeciesMatch[] = [];
    db.species.forEach((sp) => {
      let score = 0;
      let maxScore = 0;
      if (options.size) {
        maxScore += SIZE_WEIGHT;
        if (sp.size === options.size) score += SIZE_WEIGHT;
      }
      if (options.beakShape) {
        maxScore += BEAK_WEIGHT;
        if (sp.beakShape === options.beakShape) score += BEAK_WEIGHT;
      }
      if (options.featherColors && options.featherColors.length > 0) {
        maxScore += COLOR_WEIGHT;
        const overlap = options.featherColors.filter((c) => sp.featherColors.includes(c)).length;
        score += Math.round((overlap / options.featherColors.length) * COLOR_WEIGHT);
      }
      if (options.habitat && options.habitat.length > 0) {
        maxScore += HABITAT_WEIGHT;
        const overlap = options.habitat.filter((h) => sp.habitat.includes(h)).length;
        score += Math.round((overlap / options.habitat.length) * HABITAT_WEIGHT);
      }
      if (maxScore === 0) {
        matches.push({ ...(sp as Species), matchScore: 50 });
      } else {
        matches.push({ ...(sp as Species), matchScore: Math.round((score / maxScore) * 100) });
      }
    });
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  },
};