import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { RedactionBox, WatermarkConfig } from '../types';

export interface CropRect {
  x: number; // 0..1
  y: number; // 0..1
  width: number; // 0..1
  height: number; // 0..1
}

export interface RenderOptions {
  boxes: RedactionBox[];
  watermark?: WatermarkConfig;
  crop?: CropRect | null;
  includeSafeMaskTag?: boolean;
  safeMaskTagText?: string;
  maxDimension?: number;
}

const DEFAULT_MAX_DIM = 2400;

export function loadImageFromFile(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Physically crops an HTMLImageElement into a new cropped HTMLImageElement
 * so the user immediately sees the cropped result on screen.
 */
export async function cropImageElement(
  source: HTMLImageElement,
  crop: CropRect
): Promise<HTMLImageElement> {
  const sx = Math.max(0, Math.round(crop.x * source.naturalWidth));
  const sy = Math.max(0, Math.round(crop.y * source.naturalHeight));
  const sw = Math.max(2, Math.min(source.naturalWidth - sx, Math.round(crop.width * source.naturalWidth)));
  const sh = Math.max(2, Math.min(source.naturalHeight - sy, Math.round(crop.height * source.naturalHeight)));

  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to crop image'))),
      'image/jpeg',
      0.95
    );
  });
  canvas.width = 0;
  canvas.height = 0;
  return loadImageFromFile(blob);
}

/**
 * Permanently renders redaction boxes into canvas pixel data.
 * Original pixels under redacted regions are completely overwritten.
 */
export function applyRedactionBoxesToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  boxes: RedactionBox[]
): void {
  for (const box of boxes) {
    const rx = Math.max(0, Math.round(box.x * width));
    const ry = Math.max(0, Math.round(box.y * height));
    const rw = Math.max(2, Math.min(width - rx, Math.round(box.width * width)));
    const rh = Math.max(2, Math.min(height - ry, Math.round(box.height * height)));

    if (rw <= 0 || rh <= 0) continue;

    if (box.mode === 'blackout') {
      ctx.fillStyle = '#050608';
      ctx.fillRect(rx, ry, rw, rh);
    } else if (box.mode === 'color') {
      ctx.fillStyle = box.color || '#10B981';
      ctx.fillRect(rx, ry, rw, rh);
    } else if (box.mode === 'pixelate') {
      // True destructive pixelation: downsample into coarse blocks and overwrite
      const blockSize = Math.max(10, Math.round(Math.min(width, height) * 0.022));
      const smallW = Math.max(2, Math.ceil(rw / blockSize));
      const smallH = Math.max(2, Math.ceil(rh / blockSize));

      const tmp = document.createElement('canvas');
      tmp.width = smallW;
      tmp.height = smallH;
      const tctx = tmp.getContext('2d');
      if (tctx) {
        tctx.imageSmoothingEnabled = true;
        tctx.drawImage(ctx.canvas, rx, ry, rw, rh, 0, 0, smallW, smallH);
        const prevSmooth = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tmp, 0, 0, smallW, smallH, rx, ry, rw, rh);
        ctx.imageSmoothingEnabled = prevSmooth;
      }
      tmp.width = 0;
      tmp.height = 0;
    } else if (box.mode === 'blur') {
      // Strong destructive blur via multi-pass downsample + canvas filter
      const blurRadius = Math.max(12, Math.round(Math.min(width, height) * 0.025));
      const tmp = document.createElement('canvas');
      tmp.width = rw;
      tmp.height = rh;
      const tctx = tmp.getContext('2d');
      if (tctx) {
        // First downsample heavily to destroy high-frequency text details even if CSS filter is unsupported
        const ds = document.createElement('canvas');
        ds.width = Math.max(4, Math.round(rw / 12));
        ds.height = Math.max(4, Math.round(rh / 12));
        const dctx = ds.getContext('2d');
        if (dctx) {
          dctx.drawImage(ctx.canvas, rx, ry, rw, rh, 0, 0, ds.width, ds.height);
          tctx.filter = `blur(${blurRadius}px)`;
          tctx.drawImage(ds, 0, 0, ds.width, ds.height, 0, 0, rw, rh);
          tctx.filter = 'none';
        }
        ds.width = 0;
        ds.height = 0;
        ctx.drawImage(tmp, rx, ry, rw, rh);
      }
      tmp.width = 0;
      tmp.height = 0;
    }
  }
}

export function applyWatermarkToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  watermark?: WatermarkConfig
): void {
  if (!watermark || !watermark.enabled || !watermark.text.trim()) return;

  const baseText = watermark.text.trim();
  const stamp = watermark.includeTimestamp
    ? ` • ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`
    : '';
  const fullText = `${baseText}${stamp}`;

  const scaleFactor = Math.min(width, height) / 720;
  const pxSize = Math.max(14, Math.round(watermark.fontSize * scaleFactor));

  ctx.save();
  ctx.globalAlpha = Math.max(0.05, Math.min(0.9, watermark.opacity));
  ctx.fillStyle = watermark.color || '#FFFFFF';
  ctx.font = `700 ${pxSize}px ${watermark.fontFamily || 'sans-serif'}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const rad = (watermark.rotation * Math.PI) / 180;

  if (watermark.position === 'tiled') {
    const textMetrics = ctx.measureText(fullText);
    const stepX = Math.max(textMetrics.width + pxSize * 3, width * 0.38);
    const stepY = Math.max(pxSize * 4.2, height * 0.2);

    ctx.translate(width / 2, height / 2);
    ctx.rotate(rad);

    const diag = Math.hypot(width, height);
    for (let y = -diag / 2; y <= diag / 2; y += stepY) {
      for (let x = -diag / 2; x <= diag / 2; x += stepX) {
        ctx.fillText(fullText, x, y);
      }
    }
  } else if (watermark.position === 'diagonal' || watermark.position === 'center') {
    ctx.translate(width / 2, height / 2);
    if (watermark.position === 'diagonal') {
      ctx.rotate(rad);
    }
    ctx.fillText(fullText, 0, 0);
  } else if (watermark.position === 'bottom-right') {
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(fullText, width - pxSize, height - pxSize);
  } else if (watermark.position === 'top-left') {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(fullText, pxSize, pxSize);
  }

  ctx.restore();
}

export function applySubtleSafeMaskTag(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  customLabel = 'Protected by SafeMask'
): void {
  const pad = Math.max(14, Math.round(Math.min(width, height) * 0.02));
  const fontSize = Math.max(12, Math.round(Math.min(width, height) * 0.018));
  const label = customLabel;

  ctx.save();
  ctx.font = `700 ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
  const tw = ctx.measureText(label).width;
  const bw = tw + pad * 1.5;
  const bh = fontSize + pad * 0.85;
  const bx = width - bw - pad;
  const by = height - bh - pad;

  ctx.fillStyle = 'rgba(8, 10, 13, 0.78)';
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(bx, by, bw, bh, bh / 2);
  } else {
    ctx.rect(bx, by, bw, bh);
  }
  ctx.fill();

  ctx.strokeStyle = 'rgba(16, 185, 129, 0.72)';
  ctx.lineWidth = Math.max(1, fontSize * 0.09);
  ctx.stroke();

  ctx.fillStyle = '#34D399';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, bx + bw / 2, by + bh / 2);
  ctx.restore();
}

/**
 * Generates a 9:16 (1080x1920) Viral Shareable Score Card for TikTok / IG Stories.
 * The background photo is heavily blurred so ZERO sensitive details are ever visible.
 */
export async function renderViralScoreCard(
  source: HTMLImageElement,
  beforeScore: number,
  afterScore: number,
  fixedItemsCount: number
): Promise<Blob> {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');

  // 1. Dark Obsidian Background + Heavily Blurred Safe Photo Backdrop
  ctx.fillStyle = '#080A0D';
  ctx.fillRect(0, 0, W, H);

  const ds = document.createElement('canvas');
  ds.width = 24;
  ds.height = 42;
  const dctx = ds.getContext('2d');
  if (dctx) {
    dctx.drawImage(source, 0, 0, ds.width, ds.height);
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.filter = 'blur(24px)';
    ctx.drawImage(ds, 0, 0, W, H);
    ctx.restore();
  }
  ds.width = 0;
  ds.height = 0;

  // Radial emerald glow
  const grad = ctx.createRadialGradient(W / 2, H * 0.42, 60, W / 2, H * 0.42, 520);
  grad.addColorStop(0, 'rgba(16, 185, 129, 0.24)');
  grad.addColorStop(1, 'rgba(8, 10, 13, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Header badge
  ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(W / 2 - 220, 220, 440, 74, 37);
  else ctx.rect(W / 2 - 220, 220, 440, 74);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#00E676';
  ctx.font = '800 32px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SAFEMASK PRIVACY AUDIT', W / 2, 257);

  // Big Score Transformation Card
  ctx.fillStyle = 'rgba(16, 20, 26, 0.92)';
  ctx.strokeStyle = 'rgba(38, 48, 61, 0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(96, 420, W - 192, 920, 56);
  else ctx.rect(96, 420, W - 192, 920);
  ctx.fill();
  ctx.stroke();

  // Before Score
  ctx.fillStyle = '#94A3B8';
  ctx.font = '700 34px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('BEFORE', W / 2, 530);

  ctx.fillStyle = beforeScore < 55 ? '#EF4444' : beforeScore < 85 ? '#F59E0B' : '#34D399';
  ctx.font = '900 132px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`${beforeScore}/100`, W / 2, 650);

  // Arrow
  ctx.fillStyle = '#10B981';
  ctx.font = '800 64px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('↓', W / 2, 785);

  // After Score
  ctx.fillStyle = '#34D399';
  ctx.font = '700 34px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('AFTER 1-TAP SHIELD', W / 2, 900);

  ctx.fillStyle = '#00E676';
  ctx.font = '900 164px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`${afterScore}/100`, W / 2, 1045);

  // Summary Pill
  ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(170, 1170, W - 340, 86, 43);
  else ctx.rect(170, 1170, W - 340, 86);
  ctx.fill();

  ctx.fillStyle = '#F1F5F9';
  ctx.font = '700 32px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(
    `GPS & EXIF Stripped • ${fixedItemsCount} Risk(s) Fixed`,
    W / 2,
    1213
  );

  // Footer
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 44px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('SafeMask – Privacy Toolkit', W / 2, 1580);
  ctx.fillStyle = '#10B981';
  ctx.font = '600 34px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('Hide it. Share it. Stay safe.', W / 2, 1645);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Score card failed'))), 'image/jpeg', 0.92);
  });
  canvas.width = 0;
  canvas.height = 0;
  return blob;
}

/**
 * Renders full protected output into a clean Canvas and returns a Blob (EXIF stripped).
 */
export async function renderProtectedImage(
  source: HTMLImageElement | HTMLCanvasElement,
  options: RenderOptions,
  mimeType: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.92
): Promise<Blob> {
  const maxDim = options.maxDimension ?? DEFAULT_MAX_DIM;
  const srcW = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const srcH = source instanceof HTMLImageElement ? source.naturalHeight : source.height;

  // Step 1: Draw full source (scaled down if exceeding maxDim) and apply redactions in original coordinate space
  const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
  const fullW = Math.max(1, Math.round(srcW * scale));
  const fullH = Math.max(1, Math.round(srcH * scale));

  const workCanvas = document.createElement('canvas');
  workCanvas.width = fullW;
  workCanvas.height = fullH;
  const wctx = workCanvas.getContext('2d');
  if (!wctx) throw new Error('Canvas 2D context unavailable');

  wctx.drawImage(source, 0, 0, fullW, fullH);
  applyRedactionBoxesToCanvas(wctx, fullW, fullH, options.boxes);

  // Step 2: Optional crop
  let outCanvas = workCanvas;
  if (options.crop && options.crop.width > 0.02 && options.crop.height > 0.02) {
    const cx = Math.round(options.crop.x * fullW);
    const cy = Math.round(options.crop.y * fullH);
    const cw = Math.max(2, Math.round(options.crop.width * fullW));
    const ch = Math.max(2, Math.round(options.crop.height * fullH));
    const cropped = document.createElement('canvas');
    cropped.width = cw;
    cropped.height = ch;
    const cctx = cropped.getContext('2d');
    if (cctx) {
      cctx.drawImage(workCanvas, cx, cy, cw, ch, 0, 0, cw, ch);
    }
    workCanvas.width = 0;
    workCanvas.height = 0;
    outCanvas = cropped;
  }

  const octx = outCanvas.getContext('2d');
  if (octx) {
    applyWatermarkToCanvas(octx, outCanvas.width, outCanvas.height, options.watermark);
    if (options.includeSafeMaskTag) {
      applySubtleSafeMaskTag(octx, outCanvas.width, outCanvas.height, options.safeMaskTagText);
    }
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    outCanvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to export canvas blob'));
      },
      mimeType,
      mimeType === 'image/jpeg' ? quality : undefined
    );
  });

  // Release canvas memory promptly
  outCanvas.width = 0;
  outCanvas.height = 0;
  return blob;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = typeof reader.result === 'string' ? reader.result : '';
      resolve(res.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function shareOrDownloadFile(
  blob: Blob,
  filename: string,
  title = 'SafeMask Protected File'
): Promise<'shared' | 'downloaded'> {
  // 1. Native Capacitor Share Sheet on iOS / Android (supports Save Image, Save to Files, AirDrop, etc.)
  if (Capacitor.isNativePlatform()) {
    try {
      const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const base64Data = await blobToBase64(blob);
      const saved = await Filesystem.writeFile({
        path: safeName,
        data: base64Data,
        directory: Directory.Cache,
      });
      await Share.share({
        title,
        files: [saved.uri],
        dialogTitle: title,
      });
      return 'shared';
    } catch {
      // Fallback below
    }
  }

  // 2. Web Share API (iOS Safari / Android Chrome)
  const file = new File([blob], filename, { type: blob.type });
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title,
        files: [file],
      });
      return 'shared';
    } catch {
      // User cancelled or unsupported; fallback to download
    }
  }

  // 3. Standard Download (Desktop browsers)
  downloadBlob(blob, filename);
  return 'downloaded';
}

/**
 * Unified Save helper that works on iOS/Android Capacitor WKWebView
 * (where `<a download>` on blob URLs is silently ignored by iOS WebKit)
 * as well as desktop browsers.
 */
export async function saveFileToDevice(
  blob: Blob,
  filename: string,
  title = 'Save Protected File'
): Promise<'saved' | 'downloaded'> {
  if (Capacitor.isNativePlatform()) {
    await shareOrDownloadFile(blob, filename, title);
    return 'saved';
  }
  downloadBlob(blob, filename);
  return 'downloaded';
}
