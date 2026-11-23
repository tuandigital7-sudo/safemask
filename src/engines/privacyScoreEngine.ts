import type { RedactionBox, WatermarkConfig } from '../types';
import { inspectImageMetadata, type MetadataInspection } from './metadataEngine';
import { runLocalOcrScan } from './ocrEngine';
import { loadImageFromFile, renderProtectedImage } from './redactionEngine';

export type ScoreGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
export type RiskLevel = 'safe' | 'caution' | 'danger';

export interface ScoreIssue {
  id: string;
  category: 'GPS' | 'DEVICE_EXIF' | 'TIMESTAMP' | 'OCR_ID' | 'OCR_PHONE' | 'OCR_EMAIL' | 'OCR_BANK' | 'OCR_OTHER';
  titleEn: string;
  titleVi: string;
  detail: string;
  deduction: number;
  severity: 'high' | 'medium' | 'low';
}

export interface PhotoPrivacyAudit {
  score: number;
  grade: ScoreGrade;
  riskLevel: RiskLevel;
  issues: ScoreIssue[];
  metadata: MetadataInspection;
  suggestedBoxes: RedactionBox[];
  ocrRan: boolean;
  totalWordsScanned: number;
}

export function computeScoreFromFindings(
  metadata: MetadataInspection,
  ocrBoxes: RedactionBox[]
): { score: number; grade: ScoreGrade; riskLevel: RiskLevel; issues: ScoreIssue[] } {
  let score = 100;
  const issues: ScoreIssue[] = [];

  // 1. Metadata & GPS Risks
  if (metadata.hasGps) {
    score -= 35;
    issues.push({
      id: 'gps',
      category: 'GPS',
      titleEn: 'Exact GPS Location Exposed',
      titleVi: 'Lộ tọa độ vị trí GPS chính xác',
      detail: metadata.gpsSummary || 'GPS coordinates embedded',
      deduction: 35,
      severity: 'high',
    });
  }

  if (metadata.deviceSummary) {
    score -= 10;
    issues.push({
      id: 'device',
      category: 'DEVICE_EXIF',
      titleEn: 'Camera / Device Model Exposed',
      titleVi: 'Lộ tên thiết bị / dòng máy chụp',
      detail: metadata.deviceSummary,
      deduction: 10,
      severity: 'medium',
    });
  }

  const dateField = metadata.fields.find(
    (f) => f.key === 'DateTimeOriginal' || f.key === 'CreateDate'
  );
  if (dateField) {
    score -= 8;
    issues.push({
      id: 'timestamp',
      category: 'TIMESTAMP',
      titleEn: 'Original Capture Timestamp',
      titleVi: 'Lộ ngày giờ chụp gốc trong EXIF',
      detail: dateField.value,
      deduction: 8,
      severity: 'low',
    });
  }

  if (metadata.rawCount > 0 && !metadata.hasGps && !metadata.deviceSummary && !dateField) {
    score -= 7;
    issues.push({
      id: 'exif-other',
      category: 'DEVICE_EXIF',
      titleEn: 'Hidden EXIF Metadata Tags',
      titleVi: 'Chứa thẻ dữ liệu ẩn EXIF',
      detail: `${metadata.rawCount} metadata tags`,
      deduction: 7,
      severity: 'low',
    });
  }

  // 2. OCR Visual Sensitive Data Risks
  const seenLabels = new Map<string, number>();
  for (const box of ocrBoxes) {
    const lbl = box.label || 'SENSITIVE';
    seenLabels.set(lbl, (seenLabels.get(lbl) || 0) + 1);
  }

  for (const [lbl, count] of seenLabels.entries()) {
    if (lbl.includes('ID') || lbl.includes('PASSPORT')) {
      const ded = 28;
      score -= ded;
      issues.push({
        id: `ocr-${lbl}`,
        category: 'OCR_ID',
        titleEn: `National ID / Passport Detected (${count})`,
        titleVi: `Phát hiện số CCCD / Hộ chiếu (${count})`,
        detail: `${count} region(s) detected via local OCR`,
        deduction: ded,
        severity: 'high',
      });
    } else if (lbl.includes('CARD') || lbl.includes('ACCT')) {
      const ded = 25;
      score -= ded;
      issues.push({
        id: `ocr-${lbl}`,
        category: 'OCR_BANK',
        titleEn: `Bank Account / Card Number (${count})`,
        titleVi: `Phát hiện số tài khoản / thẻ (${count})`,
        detail: `${count} region(s) detected via local OCR`,
        deduction: ded,
        severity: 'high',
      });
    } else if (lbl.includes('PHONE')) {
      const ded = 18;
      score -= ded;
      issues.push({
        id: `ocr-${lbl}`,
        category: 'OCR_PHONE',
        titleEn: `Phone Number Visible (${count})`,
        titleVi: `Lộ số điện thoại trong ảnh (${count})`,
        detail: `${count} region(s) detected via local OCR`,
        deduction: ded,
        severity: 'high',
      });
    } else if (lbl.includes('EMAIL')) {
      const ded = 14;
      score -= ded;
      issues.push({
        id: `ocr-${lbl}`,
        category: 'OCR_EMAIL',
        titleEn: `Email Address Visible (${count})`,
        titleVi: `Lộ địa chỉ Email trong ảnh (${count})`,
        detail: `${count} region(s) detected via local OCR`,
        deduction: ded,
        severity: 'medium',
      });
    } else {
      const ded = 10;
      score -= ded;
      issues.push({
        id: `ocr-${lbl}`,
        category: 'OCR_OTHER',
        titleEn: `Sensitive Detail (${lbl})`,
        titleVi: `Thông tin nhạy cảm (${lbl})`,
        detail: `${count} region(s) detected`,
        deduction: ded,
        severity: 'medium',
      });
    }
  }

  const finalScore = Math.max(0, Math.min(100, score));
  const grade: ScoreGrade =
    finalScore >= 95
      ? 'A+'
      : finalScore >= 85
      ? 'A'
      : finalScore >= 70
      ? 'B'
      : finalScore >= 50
      ? 'C'
      : finalScore >= 30
      ? 'D'
      : 'F';

  const riskLevel: RiskLevel =
    finalScore >= 85 ? 'safe' : finalScore >= 55 ? 'caution' : 'danger';

  return { score: finalScore, grade, riskLevel, issues };
}

/**
 * Runs a full local multi-layer privacy audit on a photo:
 * 1) EXIF/GPS inspection via `exifr`
 * 2) Optional deep local OCR scan via `tesseract.js`
 */
export async function auditPhotoPrivacy(
  file: File,
  imgEl: HTMLImageElement,
  runDeepOcr: boolean,
  onProgress?: (pct: number) => void
): Promise<PhotoPrivacyAudit> {
  onProgress?.(15);
  const metadata = await inspectImageMetadata(file);
  onProgress?.(35);

  let suggestedBoxes: RedactionBox[] = [];
  let totalWordsScanned = 0;
  let ocrRan = false;

  if (runDeepOcr) {
    try {
      const ocrPromise = runLocalOcrScan(
        file,
        imgEl.naturalWidth,
        imgEl.naturalHeight,
        (pct) => onProgress?.(35 + Math.round(pct * 0.6))
      );
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('OCR_TIMEOUT')), 15000)
      );
      const ocr = await Promise.race([ocrPromise, timeoutPromise]);
      suggestedBoxes = ocr.boxes;
      totalWordsScanned = ocr.totalWordsScanned;
      ocrRan = true;
    } catch {
      ocrRan = false;
    }
  }

  onProgress?.(100);
  const { score, grade, riskLevel, issues } = computeScoreFromFindings(metadata, suggestedBoxes);

  return {
    score,
    grade,
    riskLevel,
    issues,
    metadata,
    suggestedBoxes,
    ocrRan,
    totalWordsScanned,
  };
}

/**
 * 1-Tap Auto-Shield: permanently burns all selected redactions,
 * strips all EXIF/GPS metadata, optionally adds verification watermark,
 * and re-verifies the output blob with exifr.
 */
export async function applyOneTapShieldFix(
  imgEl: HTMLImageElement,
  boxesToApply: RedactionBox[],
  watermark?: WatermarkConfig,
  includeSafeMaskTag = false
): Promise<{
  protectedBlob: Blob;
  verifiedExifRemaining: number;
  newScore: number;
}> {
  const protectedBlob = await renderProtectedImage(imgEl, {
    boxes: boxesToApply,
    watermark,
    includeSafeMaskTag,
    safeMaskTagText: '100/100 Clean • SafeMask',
  });

  const recheck = await inspectImageMetadata(protectedBlob);
  const newScore = recheck.rawCount === 0 ? 100 : 92;

  return {
    protectedBlob,
    verifiedExifRemaining: recheck.rawCount,
    newScore,
  };
}

export { loadImageFromFile };
