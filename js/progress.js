const STORAGE_KEY = 'eggDrawUnlocked';

export function getUnlockedCount(totalLevels) {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    // localStorage unavailable (private mode, etc.) - fall back to level 1 only.
  }
  const n = raw ? parseInt(raw, 10) : 1;
  const safe = Number.isFinite(n) && n > 0 ? n : 1;
  return Math.min(safe, totalLevels);
}

export function markLevelComplete(index, totalLevels) {
  const unlocked = getUnlockedCount(totalLevels);
  const next = Math.min(Math.max(unlocked, index + 2), totalLevels);
  try {
    localStorage.setItem(STORAGE_KEY, String(next));
  } catch (e) {
    // ignore - progress just won't persist this session
  }
}
