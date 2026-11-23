import { createWorker } from 'tesseract.js';
import type { RedactionBox } from '../types';

export interface OcrScanResult {
  boxes: RedactionBox[];
  totalWordsScanned: number;
}

const SENSITIVE_WORD_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: 'EMAIL', regex: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/i },
  { label: 'SSN / ID', regex: /\b\d{3}-\d{2}-\d{4}\b/ },
  { label: 'PHONE', regex: /(?:\+1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}|(?:\+84|84|0)(?:3|5|7|8|9)[0-9.\-\s]{7,11}/ },
  { label: 'ID / CCCD', regex: /\b\d{9,12}\b/ },
  { label: 'CARD / ACCT', regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}(?:[\s-]?\d{4})?\b/ },
  { label: 'DOB', regex: /\b\d{1,2}[\/.-]\d{1,2}[\/.-](?:19|20)\d{2}\b/ },
  { label: 'PASSPORT', regex: /\b[A-Z]\d{7,8}\b/ },
];

function detectSensitiveLabel(text: string): string | null {
  const cleaned = text.trim();
  if (cleaned.length < 6) return null;
  for (const p of SENSITIVE_WORD_PATTERNS) {
    if (p.regex.test(cleaned)) return p.label;
  }
  return null;
}

/**
 * Runs local on-device OCR via Tesseract.js WebAssembly worker.
 * Suggests bounding boxes for potentially sensitive data without auto-applying.
 */
export async function runLocalOcrScan(
  imageFile: File | Blob,
  imgWidth: number,
  imgHeight: number,
  onProgress?: (pct: number) => void
): Promise<OcrScanResult> {
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        onProgress?.(Math.round(m.progress * 100));
      }
    },
  });

  try {
    const { data } = await worker.recognize(imageFile);
    const boxes: RedactionBox[] = [];
    const seenKeys = new Set<string>();

    // Inspect both lines (for spaced phone/card numbers) and individual words
    const words = data.words || [];
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const label = detectSensitiveLabel(w.text || '');
      if (label && w.bbox) {
        const padX = Math.max(4, (w.bbox.x1 - w.bbox.x0) * 0.08);
        const padY = Math.max(4, (w.bbox.y1 - w.bbox.y0) * 0.16);
        const x = Math.max(0, (w.bbox.x0 - padX) / imgWidth);
        const y = Math.max(0, (w.bbox.y0 - padY) / imgHeight);
        const width = Math.min(1 - x, (w.bbox.x1 - w.bbox.x0 + padX * 2) / imgWidth);
        const height = Math.min(1 - y, (w.bbox.y1 - w.bbox.y0 + padY * 2) / imgHeight);
        const key = `${Math.round(x * 100)}-${Math.round(y * 100)}`;
        if (!seenKeys.has(key) && width > 0.01 && height > 0.01) {
          seenKeys.add(key);
          boxes.push({
            id: `ocr-${Date.now()}-${i}`,
            x,
            y,
            width,
            height,
            mode: 'blackout',
            label,
            source: 'ocr',
            selected: true,
          });
        }
      }
    }

    return {
      boxes,
      totalWordsScanned: words.length,
    };
  } finally {
    await worker.terminate();
  }
}
