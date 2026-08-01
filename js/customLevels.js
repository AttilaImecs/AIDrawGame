import { LEVELS } from './levels.js';

const STORAGE_KEY = 'eggDrawCustomLevels';

// At most one unpublished draft exists at a time by construction -
// `published: false` alone identifies it, no separate "current draft"
// pointer needed.
export function loadCustomLevels() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return [];
  }
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function persist(levels) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
  } catch (e) {
    // Storage full/unavailable - changes just won't persist this session.
  }
}

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getPublishedLevels() {
  return loadCustomLevels().filter((l) => l.published);
}

export function getDraft() {
  return loadCustomLevels().find((l) => !l.published) ?? null;
}

export function saveDraft(level) {
  const levels = loadCustomLevels();
  const id = level.id || makeId();
  const next = { ...level, id, published: false };
  const index = levels.findIndex((l) => l.id === id);
  if (index === -1) levels.push(next);
  else levels[index] = next;
  persist(levels);
  return next;
}

export function publishDraft(id) {
  const levels = loadCustomLevels();
  const index = levels.findIndex((l) => l.id === id);
  if (index === -1) return;
  levels[index] = { ...levels[index], published: true };
  persist(levels);
}

export function deleteCustomLevel(id) {
  persist(loadCustomLevels().filter((l) => l.id !== id));
}

// Always recomputed fresh (never cached) so a newly-published level shows up
// in level select immediately, with no page reload needed.
export function getCombinedLevels() {
  return [...LEVELS, ...getPublishedLevels()];
}
