import type { DetectedEntity, SensitiveEntityType } from '../types';

export interface SanitizeResult {
  sanitizedText: string;
  entities: DetectedEntity[];
  /** In-memory session mapping ONLY. Never persisted to storage. */
  tokenToOriginal: Record<string, string>;
}

interface PatternSpec {
  type: SensitiveEntityType;
  regex: RegExp;
  groupIndex?: number;
}

const PATTERNS: PatternSpec[] = [
  // Email addresses
  {
    type: 'EMAIL',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  },
  // US Social Security Number (XXX-XX-XXXX)
  {
    type: 'ID',
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
  },
  // US & International Phone Numbers + Vietnamese Phone Numbers
  {
    type: 'PHONE',
    regex: /(?<!\d)(?:\+1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}(?!\d)|(?<!\d)(?:\+84|84|0)(?:3|5|7|8|9)[0-9]{1}[.\-\s]?[0-9]{3}[.\-\s]?[0-9]{4}(?!\d)|(?<!\d)\+[1-9]\d{1,2}[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}(?!\d)/g,
  },
  // Credit / Debit card numbers (16 digits grouped)
  {
    type: 'CARD',
    regex: /(?<!\d)(?:4\d{3}|5[1-5]\d{2}|3[47]\d{2}|9704)[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}(?!\d)/g,
  },
  // Vietnamese CCCD (12 digits starting with 0)
  {
    type: 'ID',
    regex: /(?<!\d)0[0-9]{11}(?!\d)/g,
  },
  // Contextual CMND / CCCD / ID / Passport
  {
    type: 'ID',
    regex: /(?:CCCD|CMND|ID|Căn cước|Số định danh)\s*[:#-]?\s*([0-9]{9,12})/gi,
    groupIndex: 1,
  },
  {
    type: 'PASSPORT',
    regex: /(?:Passport|Hộ chiếu)\s*[:#-]?\s*([A-Z][0-9]{7,8})/gi,
    groupIndex: 1,
  },
  // Bank account numbers (contextual VN & EN)
  {
    type: 'ACCOUNT',
    regex: /(?:STK|Số tài khoản|Tài khoản|Account|Acct|IBAN|Bank)\s*[:#-]?\s*([A-Z0-9]{8,20})/gi,
    groupIndex: 1,
  },
  // Date of Birth (contextual)
  {
    type: 'DOB',
    regex: /(?:DOB|Ngày sinh|Sinh ngày|Birthdate)\s*[:#-]?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/gi,
    groupIndex: 1,
  },
  // Street Address (VN & EN contextual)
  {
    type: 'ADDRESS',
    regex: /(?:Địa chỉ|Address|Số nhà)\s*[:#-]?\s*([^\n.;]{8,85})/gi,
    groupIndex: 1,
  },
];

/**
 * Scans text for common sensitive PII patterns and builds non-overlapping entities.
 */
export function scanSensitiveText(
  input: string,
  customTerms: string[] = []
): DetectedEntity[] {
  const rawMatches: Array<{
    type: SensitiveEntityType;
    original: string;
    start: number;
    end: number;
  }> = [];

  for (const spec of PATTERNS) {
    const regex = new RegExp(spec.regex.source, spec.regex.flags);
    let m: RegExpExecArray | null;
    while ((m = regex.exec(input)) !== null) {
      let value = m[0];
      let start = m.index;
      if (spec.groupIndex && m[spec.groupIndex]) {
        value = m[spec.groupIndex];
        const offsetInMatch = m[0].indexOf(value);
        start = m.index + Math.max(0, offsetInMatch);
      }
      const end = start + value.length;
      if (value.trim().length > 0) {
        rawMatches.push({ type: spec.type, original: value, start, end });
      }
    }
  }

  // Custom user-specified terms
  for (const term of customTerms) {
    const trimmed = term.trim();
    if (!trimmed) continue;
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    let m: RegExpExecArray | null;
    while ((m = regex.exec(input)) !== null) {
      rawMatches.push({
        type: 'CUSTOM',
        original: m[0],
        start: m.index,
        end: m.index + m[0].length,
      });
    }
  }

  // Sort by start asc, longer match first
  rawMatches.sort((a, b) => a.start - b.start || b.end - a.end);

  // Deduplicate overlapping spans
  const nonOverlapping: typeof rawMatches = [];
  let lastEnd = -1;
  for (const item of rawMatches) {
    if (item.start >= lastEnd) {
      nonOverlapping.push(item);
      lastEnd = item.end;
    }
  }

  // Assign deterministic tokens per type, reusing same token if exact same value repeats
  const counters: Record<string, number> = {};
  const valueToToken = new Map<string, string>();

  return nonOverlapping.map((item, idx) => {
    const key = `${item.type}::${item.original}`;
    let token = valueToToken.get(key);
    if (!token) {
      counters[item.type] = (counters[item.type] || 0) + 1;
      token = `[${item.type}_${counters[item.type]}]`;
      valueToToken.set(key, token);
    }
    return {
      id: `ent-${idx}-${item.start}`,
      type: item.type,
      token,
      original: item.original,
      start: item.start,
      end: item.end,
      enabled: true,
    };
  });
}

/**
 * Applies selected entities to produce sanitized text + in-memory mapping.
 */
export function buildSanitizedOutput(
  originalText: string,
  entities: DetectedEntity[]
): SanitizeResult {
  const active = entities
    .filter((e) => e.enabled)
    .sort((a, b) => a.start - b.start);

  let result = '';
  let cursor = 0;
  const tokenToOriginal: Record<string, string> = {};

  for (const ent of active) {
    if (ent.start < cursor) continue;
    result += originalText.slice(cursor, ent.start);
    result += ent.token;
    tokenToOriginal[ent.token] = ent.original;
    cursor = ent.end;
  }
  result += originalText.slice(cursor);

  return {
    sanitizedText: result,
    entities,
    tokenToOriginal,
  };
}

/**
 * Restores original sensitive values from an in-memory session mapping.
 */
export function restoreSanitizedText(
  sanitizedText: string,
  tokenToOriginal: Record<string, string>
): string {
  let restored = sanitizedText;
  for (const [token, original] of Object.entries(tokenToOriginal)) {
    restored = restored.split(token).join(original);
  }
  return restored;
}
