const STORAGE_KEY = 'eggDrawUnlocked';

// All levels are shown in level select for now, regardless of progress -
// the "only show previously-beaten levels" lock was hiding newly-added
// levels from view during active development. Re-gate this once the level
// set stabilizes.
export function getUnlockedCount(totalLevels) {
  return totalLevels;
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
