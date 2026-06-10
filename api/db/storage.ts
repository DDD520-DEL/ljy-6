import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedSpecies } from './seedData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');

const DB_FILE = path.join(DATA_DIR, 'db.json');

interface Database {
  users: any[];
  species: any[];
  observations: any[];
  comments: any[];
  follows: any[];
  likes: any[];
  notifications: any[];
  collections: any[];
  _counters: {
    users: number;
    species: number;
    observations: number;
    comments: number;
    follows: number;
    likes: number;
    notifications: number;
    collections: number;
  };
}

let cachedDb: Database | null = null;
let saveTimer: NodeJS.Timeout | null = null;

function defaultDb(): Database {
  return {
    users: [],
    species: [],
    observations: [],
    comments: [],
    follows: [],
    likes: [],
    notifications: [],
    collections: [],
    _counters: { users: 0, species: 0, observations: 0, comments: 0, follows: 0, likes: 0, notifications: 0, collections: 0 },
  };
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadDb(): Database {
  if (cachedDb) return cachedDb;
  ensureDir();
  if (!fs.existsSync(DB_FILE)) {
    cachedDb = defaultDb();
    saveDb();
    return cachedDb;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    cachedDb = JSON.parse(raw);
    if (!cachedDb!.notifications) cachedDb!.notifications = [];
    if (!cachedDb!._counters.notifications) cachedDb!._counters.notifications = 0;
    if (!cachedDb!.collections) cachedDb!.collections = [];
    if (!cachedDb!._counters.collections) cachedDb!._counters.collections = 0;
    let needSave = false;
    cachedDb!.species.forEach((sp: any, idx: number) => {
      if (!sp.order || !sp.family) {
        const seed = seedSpecies[idx] || seedSpecies[seedSpecies.length - 1];
        if (seed) {
          sp.order = seed.order;
          sp.family = seed.family;
          needSave = true;
        }
      }
    });
    if (needSave) scheduleSave();
  } catch {
    cachedDb = defaultDb();
  }
  return cachedDb;
}

export function saveDb() {
  ensureDir();
  if (cachedDb) {
    fs.writeFileSync(DB_FILE, JSON.stringify(cachedDb, null, 2), 'utf-8');
  }
}

export function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDb, 300);
}

export function getDb(): Database {
  return loadDb();
}

export function resetDb(data: Database) {
  cachedDb = data;
  saveDb();
}

export function nextId(table: keyof Database['_counters']): number {
  const db = loadDb();
  db._counters[table] += 1;
  scheduleSave();
  return db._counters[table];
}
