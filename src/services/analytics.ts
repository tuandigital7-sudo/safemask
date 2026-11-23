/**
 * Privacy-First Analytics Engine
 * - Strict allowlist of non-sensitive event names and safe metadata keys
 * - NEVER logs images, text content, IDs, phones, emails, PDFs, GPS, or mappings
 * - Respects user consent toggle (can be completely disabled in Settings)
 */

export type AnalyticsEventName =
  | 'app_open'
  | 'onboarding_complete'
  | 'image_import'
  | 'redaction_start'
  | 'redaction_complete'
  | 'export_complete'
  | 'ocr_start'
  | 'ocr_complete'
  | 'text_sanitizer_start'
  | 'text_sanitizer_complete'
  | 'pdf_import'
  | 'pdf_export'
  | 'paywall_view'
  | 'pro_conversion'
  | 'restore_purchases'
  | 'batch_start'
  | 'batch_complete'
  | 'share'
  | 'feature_usage';

const ALLOWED_PROP_KEYS = new Set([
  'tool',
  'mode',
  'count',
  'plan',
  'success',
  'format',
  'lang',
  'platform',
  'hasWatermark',
]);

const CONSENT_KEY = 'safemask_analytics_consent_v1';
const LOG_KEY = 'safemask_analytics_local_ring_v1';

export interface SafeAnalyticsRecord {
  event: AnalyticsEventName;
  ts: number;
  props?: Record<string, string | number | boolean>;
}

export function getAnalyticsConsent(): boolean {
  try {
    const val = localStorage.getItem(CONSENT_KEY);
    // Default opt-in for anonymous local event counters; user can turn off anytime
    return val === null ? true : val === 'true';
  } catch {
    return false;
  }
}

export function setAnalyticsConsent(enabled: boolean): void {
  try {
    localStorage.setItem(CONSENT_KEY, String(enabled));
    if (!enabled) {
      localStorage.removeItem(LOG_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function sanitizeAnalyticsProps(
  props?: Record<string, unknown>
): Record<string, string | number | boolean> | undefined {
  if (!props) return undefined;
  const clean: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(props)) {
    if (!ALLOWED_PROP_KEYS.has(k)) continue;
    if (typeof v === 'string' && v.length <= 40) {
      clean[k] = v;
    } else if (typeof v === 'number' && Number.isFinite(v)) {
      clean[k] = v;
    } else if (typeof v === 'boolean') {
      clean[k] = v;
    }
  }
  return Object.keys(clean).length > 0 ? clean : undefined;
}

export function trackEvent(
  event: AnalyticsEventName,
  props?: Record<string, unknown>
): SafeAnalyticsRecord | null {
  if (!getAnalyticsConsent()) return null;

  const record: SafeAnalyticsRecord = {
    event,
    ts: Date.now(),
    props: sanitizeAnalyticsProps(props),
  };

  try {
    const raw = localStorage.getItem(LOG_KEY);
    const list: SafeAnalyticsRecord[] = raw ? JSON.parse(raw) : [];
    list.push(record);
    // Keep only last 100 lightweight event counts locally
    const trimmed = list.slice(-100);
    localStorage.setItem(LOG_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore storage quota errors
  }

  return record;
}

export function getLocalAnalyticsEvents(): SafeAnalyticsRecord[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearLocalAnalytics(): void {
  try {
    localStorage.removeItem(LOG_KEY);
  } catch {
    // ignore
  }
}
