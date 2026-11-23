import exifr from 'exifr';
import { loadImageFromFile } from './redactionEngine';

export interface MetadataField {
  key: string;
  value: string;
  sensitive: boolean;
}

export interface MetadataInspection {
  fields: MetadataField[];
  hasGps: boolean;
  gpsSummary?: string;
  deviceSummary?: string;
  rawCount: number;
}

export interface MetadataCleanResult {
  cleanedBlob: Blob;
  removedFields: MetadataField[];
  verifiedRemainingCount: number;
  verifiedClean: boolean;
  originalSize: number;
  cleanedSize: number;
}

const SENSITIVE_KEYS = new Set([
  'latitude',
  'longitude',
  'GPSLatitude',
  'GPSLongitude',
  'GPSAltitude',
  'Make',
  'Model',
  'LensModel',
  'Software',
  'DateTimeOriginal',
  'CreateDate',
  'ModifyDate',
  'Artist',
  'Copyright',
  'SerialNumber',
  'HostComputer',
]);

function formatMetaValue(val: unknown): string {
  if (val instanceof Date) return val.toISOString();
  if (Array.isArray(val)) return val.slice(0, 6).join(', ');
  if (typeof val === 'number') return Number.isInteger(val) ? String(val) : val.toFixed(5);
  if (typeof val === 'object' && val !== null) return JSON.stringify(val).slice(0, 80);
  return String(val).slice(0, 100);
}

/**
 * Parses real EXIF, GPS, IPTC, and XMP metadata locally from an image File/Blob.
 */
export async function inspectImageMetadata(file: File | Blob): Promise<MetadataInspection> {
  try {
    const parsed = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      iptc: true,
      xmp: true,
    });

    if (!parsed || typeof parsed !== 'object') {
      return { fields: [], hasGps: false, rawCount: 0 };
    }

    const entries = Object.entries(parsed).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    );

    const fields: MetadataField[] = entries.slice(0, 35).map(([key, val]) => ({
      key,
      value: formatMetaValue(val),
      sensitive: SENSITIVE_KEYS.has(key) || key.toLowerCase().includes('gps'),
    }));

    const hasGps =
      typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number';
    const gpsSummary = hasGps
      ? `${parsed.latitude.toFixed(5)}, ${parsed.longitude.toFixed(5)}`
      : undefined;

    const deviceParts = [parsed.Make, parsed.Model].filter(Boolean);
    const deviceSummary = deviceParts.length > 0 ? deviceParts.join(' ') : undefined;

    return {
      fields,
      hasGps,
      gpsSummary,
      deviceSummary,
      rawCount: entries.length,
    };
  } catch {
    return { fields: [], hasGps: false, rawCount: 0 };
  }
}

/**
 * Strips EXIF/GPS metadata by re-encoding pixel data through HTML5 Canvas,
 * then re-inspects the ACTUAL exported Blob with `exifr` to verify cleanliness.
 */
export async function stripAndVerifyMetadata(
  file: File,
  mimeType: 'image/jpeg' | 'image/png' = 'image/jpeg'
): Promise<MetadataCleanResult> {
  const before = await inspectImageMetadata(file);
  const img = await loadImageFromFile(file);

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  ctx.drawImage(img, 0, 0);

  const cleanedBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to export clean image'))),
      mimeType,
      mimeType === 'image/jpeg' ? 0.94 : undefined
    );
  });

  // Free canvas memory immediately
  canvas.width = 0;
  canvas.height = 0;

  // Verify the ACTUAL output blob with exifr
  const after = await inspectImageMetadata(cleanedBlob);

  return {
    cleanedBlob,
    removedFields: before.fields,
    verifiedRemainingCount: after.rawCount,
    verifiedClean: after.rawCount === 0,
    originalSize: file.size,
    cleanedSize: cleanedBlob.size,
  };
}
