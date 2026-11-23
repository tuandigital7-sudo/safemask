import type { HistoryEntry, SavedWatermarkPreset, ToolRoute } from '../types';

const HISTORY_KEY = 'safemask_meta_history_v1';
const FAVORITES_KEY = 'safemask_favorites_v1';
const WATERMARK_PRESETS_KEY = 'safemask_watermark_presets_v1';

/**
 * Metadata-only local history.
 * NEVER stores image pixels, PDF bytes, text contents, or sensitive mappings.
 */
export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): HistoryEntry {
  const full: HistoryEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
  };
  try {
    const current = getHistory();
    const updated = [full, ...current].slice(0, 40);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return full;
}

export function removeHistoryEntry(id: string): void {
  try {
    const updated = getHistory().filter((item) => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function clearAllHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
}

export function getFavoriteTools(): ToolRoute[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : ['image-shield', 'text-sanitizer'];
  } catch {
    return ['image-shield', 'text-sanitizer'];
  }
}

export function toggleFavoriteTool(tool: ToolRoute): ToolRoute[] {
  const current = getFavoriteTools();
  const next = current.includes(tool)
    ? current.filter((t) => t !== tool)
    : [...current, tool];
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function getSavedWatermarkPresets(): SavedWatermarkPreset[] {
  try {
    const raw = localStorage.getItem(WATERMARK_PRESETS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback defaults
  }
  return [
    {
      id: 'default-verify',
      name: 'ID Verification',
      config: {
        enabled: true,
        text: 'FOR VERIFICATION ONLY',
        position: 'tiled',
        fontSize: 26,
        opacity: 0.28,
        color: '#10B981',
        rotation: -28,
        fontFamily: 'sans-serif',
        includeTimestamp: true,
      },
    },
    {
      id: 'default-confidential',
      name: 'Confidential',
      config: {
        enabled: true,
        text: 'CONFIDENTIAL',
        position: 'diagonal',
        fontSize: 42,
        opacity: 0.32,
        color: '#FFFFFF',
        rotation: -32,
        fontFamily: 'sans-serif',
        includeTimestamp: false,
      },
    },
  ];
}

export function saveWatermarkPreset(preset: SavedWatermarkPreset): SavedWatermarkPreset[] {
  const current = getSavedWatermarkPresets();
  const filtered = current.filter((p) => p.id !== preset.id);
  const next = [preset, ...filtered];
  try {
    localStorage.setItem(WATERMARK_PRESETS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function deleteWatermarkPreset(id: string): SavedWatermarkPreset[] {
  const next = getSavedWatermarkPresets().filter((p) => p.id !== id);
  try {
    localStorage.setItem(WATERMARK_PRESETS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}
