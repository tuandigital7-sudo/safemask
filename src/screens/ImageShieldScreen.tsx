import React, { useRef, useState } from 'react';
import {
  Camera,
  Check,
  Crop,
  Crown,
  Download,
  Eye,
  Hand,
  ImagePlus,
  PenTool,
  Redo2,
  RotateCcw,
  Share2,
  Stamp,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { RedactionBox, RedactionMode, WatermarkConfig } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { RedactionCanvas } from '../components/RedactionCanvas';
import { WatermarkControls } from '../components/WatermarkControls';
import { StickyActionBar } from '../components/StickyActionBar';
import {
  cropImageElement,
  loadImageFromFile,
  renderProtectedImage,
  saveFileToDevice,
  shareOrDownloadFile,
  type CropRect,
} from '../engines/redactionEngine';
import { trackEvent } from '../services/analytics';
import { addHistoryEntry } from '../services/history';

interface ImageShieldScreenProps {
  initialWatermarkOpen?: boolean;
  isPro?: boolean;
  onOpenPaywall?: () => void;
}

const DEFAULT_WATERMARK: WatermarkConfig = {
  enabled: false,
  text: 'FOR VERIFICATION ONLY',
  position: 'tiled',
  fontSize: 28,
  opacity: 0.28,
  color: '#10B981',
  rotation: -28,
  fontFamily: 'sans-serif',
  includeTimestamp: false,
};

export const ImageShieldScreen: React.FC<ImageShieldScreenProps> = ({
  initialWatermarkOpen = false,
  isPro = false,
  onOpenPaywall,
}) => {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [originalImgEl, setOriginalImgEl] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState('protected.jpg');
  const [boxes, setBoxes] = useState<RedactionBox[]>([]);
  const [undoStack, setUndoStack] = useState<RedactionBox[][]>([]);
  const [redoStack, setRedoStack] = useState<RedactionBox[][]>([]);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);

  const [mode, setMode] = useState<RedactionMode>('blackout');
  const [customColor, setCustomColor] = useState('#10B981');
  const [interactionMode, setInteractionMode] = useState<'draw' | 'pan' | 'crop'>('draw');
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [zoom, setZoom] = useState(1);

  const [showWatermarkPanel, setShowWatermarkPanel] = useState(initialWatermarkOpen);
  const [watermark, setWatermark] = useState<WatermarkConfig>({
    ...DEFAULT_WATERMARK,
    enabled: initialWatermarkOpen,
  });
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  // Balanced Free/Pro: Free includes subtle viral corner badge; Pro defaults to clean unbranded export
  const [includeSafeMaskTag, setIncludeSafeMaskTag] = useState(!isPro);
  const [isExporting, setIsExporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const pushBoxes = (next: RedactionBox[]) => {
    setUndoStack((prev) => [...prev.slice(-24), boxes]);
    setRedoStack([]);
    setBoxes(next);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, boxes]);
    setUndoStack((u) => u.slice(0, -1));
    setBoxes(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, boxes]);
    setRedoStack((r) => r.slice(0, -1));
    setBoxes(next);
  };

  const handleReset = () => {
    pushBoxes([]);
    if (originalImgEl) setImgEl(originalImgEl);
    setCropRect(null);
    setZoom(1);
    setInteractionMode('draw');
    setSelectedBoxId(null);
    setStatusMsg(null);
  };

  const handleApplyCrop = async () => {
    if (!imgEl || !cropRect) return;
    try {
      const cropped = await cropImageElement(imgEl, cropRect);
      // Remap existing redaction boxes into the newly cropped image coordinates
      const remapped: RedactionBox[] = boxes
        .map((b) => {
          const x1 = Math.max(0, (b.x - cropRect.x) / cropRect.width);
          const y1 = Math.max(0, (b.y - cropRect.y) / cropRect.height);
          const x2 = Math.min(1, (b.x + b.width - cropRect.x) / cropRect.width);
          const y2 = Math.min(1, (b.y + b.height - cropRect.y) / cropRect.height);
          return { ...b, x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
        })
        .filter((b) => b.width > 0.01 && b.height > 0.01);

      setImgEl(cropped);
      setBoxes(remapped);
      setUndoStack([]);
      setRedoStack([]);
      setCropRect(null);
      setInteractionMode('draw');
      setZoom(1);
    } catch {
      // ignore crop error
    }
  };

  const handleImport = async (file?: File | null) => {
    if (!file) return;
    try {
      const loaded = await loadImageFromFile(file);
      setImgEl(loaded);
      setOriginalImgEl(loaded);
      const base = file.name.replace(/\.[^.]+$/, '');
      setFileName(`${base}-safemask.jpg`);
      setBoxes([]);
      setUndoStack([]);
      setRedoStack([]);
      setCropRect(null);
      setZoom(1);
      setStatusMsg(null);
      trackEvent('image_import', { tool: initialWatermarkOpen ? 'watermark' : 'image-shield' });
    } catch {
      // ignore invalid image
    }
  };

  const handleExport = async (share: boolean) => {
    if (!imgEl) return;
    setIsExporting(true);
    setStatusMsg(null);
    trackEvent('redaction_start', { tool: 'image-shield', count: boxes.length });
    try {
      const blob = await renderProtectedImage(imgEl, {
        boxes,
        watermark,
        crop: cropRect,
        includeSafeMaskTag,
      });

      if (share) {
        await shareOrDownloadFile(blob, fileName, 'SafeMask Protected Photo');
        trackEvent('share', { tool: 'image-shield' });
      } else {
        await saveFileToDevice(blob, fileName, 'Save Protected Photo');
      }

      trackEvent('redaction_complete', {
        tool: 'image-shield',
        count: boxes.length,
        hasWatermark: watermark.enabled,
      });
      trackEvent('export_complete', { tool: 'image-shield', format: 'jpeg' });
      addHistoryEntry({
        tool: initialWatermarkOpen ? 'watermark' : 'image-shield',
        itemCount: 1,
        regionsRedacted: boxes.length,
      });
      setStatusMsg(t('image.exportedSuccess'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleImport(e.target.files?.[0])}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleImport(e.target.files?.[0])}
      />

      {!imgEl ? (
        <div className="glass-panel rounded-3xl p-8 text-center space-y-5 mt-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emeraldbrand/15 border border-emeraldbrand/40 flex items-center justify-center">
            <ImagePlus className="w-8 h-8 text-emeraldbrand-bright" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-white">{t('image.emptyTitle')}</h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              {t('image.emptyDesc')}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-3 rounded-2xl bg-emeraldbrand hover:bg-emeraldbrand-soft text-obsidian font-bold text-sm flex items-center gap-2 transition"
            >
              <ImagePlus className="w-4 h-4" />
              {t('common.importImage')}
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="px-4 py-3 rounded-2xl bg-elevated border border-borderdark text-slate-200 font-semibold text-sm flex items-center gap-2 hover:border-emeraldbrand/50 transition"
            >
              <Camera className="w-4 h-4" />
              {t('common.takePhoto')}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Top Action Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                aria-label={t('common.undo')}
                className="p-2 rounded-xl bg-surface border border-borderdark text-slate-200 disabled:opacity-35"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                aria-label={t('common.redo')}
                className="p-2 rounded-xl bg-surface border border-borderdark text-slate-200 disabled:opacity-35"
              >
                <Redo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                aria-label={t('common.reset')}
                className="p-2 rounded-xl bg-surface border border-borderdark text-slate-200"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400 pl-1">
                {boxes.length} {t('image.regionsCount')}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))))}
                aria-label={t('image.zoomOut')}
                className="p-2 rounded-xl bg-surface border border-borderdark text-slate-300"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-slate-400 w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
                aria-label={t('image.zoomIn')}
                className="p-2 rounded-xl bg-surface border border-borderdark text-slate-300"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowBeforeAfter((v) => !v)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1 transition ${
                  showBeforeAfter
                    ? 'bg-emeraldbrand/20 border-emeraldbrand text-emeraldbrand-bright'
                    : 'bg-surface border-borderdark text-slate-300'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                {t('common.beforeAfter')}
              </button>
            </div>
          </div>

          {showBeforeAfter && (
            <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
              {t('common.beforeAfterWarn')}
            </div>
          )}

          {/* Interactive Canvas */}
          <RedactionCanvas
            source={imgEl}
            boxes={boxes}
            onChangeBoxes={pushBoxes}
            activeMode={mode}
            activeColor={customColor}
            watermark={watermark}
            zoom={zoom}
            interactionMode={interactionMode}
            cropRect={cropRect}
            onChangeCropRect={setCropRect}
            showBeforeAfter={showBeforeAfter}
            selectedBoxId={selectedBoxId}
            onSelectBox={setSelectedBoxId}
          />

          {/* Instant Apply / Cancel Crop bar right below canvas */}
          {interactionMode === 'crop' && (
            <div className="flex items-center justify-between gap-2 bg-amber-500/15 border border-amber-400/50 rounded-2xl px-3.5 py-2.5">
              <span className="text-xs font-semibold text-amber-200">
                {cropRect ? t('image.applyCrop') : 'Drag on photo to select crop area'}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCropRect(null);
                    setInteractionMode('draw');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-graphite border border-borderdark text-xs font-bold text-slate-300"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  disabled={!cropRect}
                  onClick={handleApplyCrop}
                  className="px-3.5 py-1.5 rounded-xl bg-emeraldbrand text-obsidian text-xs font-extrabold disabled:opacity-40 flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  {t('image.applyCrop')}
                </button>
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-400 text-center">{t('image.dragHint')}</p>

          {/* Mode Selector Bar */}
          <div className="bg-surface border border-borderdark rounded-2xl p-3 space-y-3">
            <div className="grid grid-cols-4 gap-1.5">
              {(['blackout', 'blur', 'pixelate', 'color'] as RedactionMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setInteractionMode('draw');
                  }}
                  className={`py-2 rounded-xl text-xs font-semibold border transition ${
                    mode === m && interactionMode === 'draw'
                      ? 'bg-emeraldbrand text-obsidian border-emeraldbrand'
                      : 'bg-graphite text-slate-300 border-borderdark'
                  }`}
                >
                  {t(`image.mode.${m}`)}
                </button>
              ))}
            </div>

            {mode === 'color' && (
              <div className="flex items-center gap-2 pt-1">
                {['#10B981', '#0F172A', '#FFFFFF', '#3B82F6', '#EF4444', '#F59E0B'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCustomColor(c)}
                    className={`w-6 h-6 rounded-full border-2 ${
                      customColor === c ? 'border-emeraldbrand-bright scale-110' : 'border-borderdark'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}

            {/* Interaction tools: Draw / Pan / Crop / Watermark / Change Photo */}
            <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-borderdark flex-wrap">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setInteractionMode('draw')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border ${
                    interactionMode === 'draw'
                      ? 'bg-emeraldbrand/20 border-emeraldbrand text-emeraldbrand-bright'
                      : 'bg-graphite border-borderdark text-slate-300'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  {t('image.draw')}
                </button>
                <button
                  type="button"
                  onClick={() => setInteractionMode('pan')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border ${
                    interactionMode === 'pan'
                      ? 'bg-emeraldbrand/20 border-emeraldbrand text-emeraldbrand-bright'
                      : 'bg-graphite border-borderdark text-slate-300'
                  }`}
                >
                  <Hand className="w-3.5 h-3.5" />
                  {t('image.pan')}
                </button>
                <button
                  type="button"
                  onClick={() => setInteractionMode(interactionMode === 'crop' ? 'draw' : 'crop')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border ${
                    interactionMode === 'crop'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-graphite border-borderdark text-slate-300'
                  }`}
                >
                  <Crop className="w-3.5 h-3.5" />
                  {t('image.crop')}
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowWatermarkPanel((v) => !v)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border ${
                    showWatermarkPanel || watermark.enabled
                      ? 'bg-emeraldbrand/20 border-emeraldbrand text-emeraldbrand-bright'
                      : 'bg-graphite border-borderdark text-slate-300'
                  }`}
                >
                  <Stamp className="w-3.5 h-3.5" />
                  {t('image.watermarkTab')}
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-xl text-xs bg-graphite border border-borderdark text-slate-300"
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {showWatermarkPanel && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center">
              <div className="w-full max-w-lg max-h-[75dvh] overflow-y-auto bg-graphite border-t border-borderdark rounded-t-3xl p-4 safe-bottom space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-white">{t('watermark.title')}</span>
                  <button
                    type="button"
                    onClick={() => setShowWatermarkPanel(false)}
                    className="p-1.5 rounded-full bg-surface text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <WatermarkControls config={watermark} onChange={setWatermark} />
                <button
                  type="button"
                  onClick={() => setShowWatermarkPanel(false)}
                  className="w-full py-3 rounded-2xl bg-emeraldbrand text-obsidian font-extrabold text-sm"
                >
                  {t('common.done')}
                </button>
              </div>
            </div>
          )}

          {/* Balanced Free/Pro SafeMask Badge Control */}
          <div className="flex items-center justify-between bg-surface border border-borderdark rounded-2xl px-4 py-2.5 text-xs text-slate-300">
            <span className="truncate pr-2">
              {isPro ? t('image.safeMaskBadge') : t('common.removeBadgePro')}
            </span>
            {isPro ? (
              <input
                type="checkbox"
                checked={includeSafeMaskTag}
                onChange={(e) => setIncludeSafeMaskTag(e.target.checked)}
                className="accent-emerald-500 w-4 h-4 shrink-0"
              />
            ) : (
              <button
                type="button"
                onClick={onOpenPaywall}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emeraldbrand/15 border border-emeraldbrand/50 text-[11px] font-extrabold text-emeraldbrand-bright shrink-0"
              >
                <Crown className="w-3 h-3" />
                <span>PRO</span>
              </button>
            )}
          </div>

          {statusMsg && (
            <div className="flex items-center gap-2 text-xs text-emeraldbrand-bright bg-emeraldbrand/10 border border-emeraldbrand/30 rounded-xl px-3.5 py-2.5">
              <Check className="w-4 h-4 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Export / Share Safe CTA — Pinned to bottom so no scrolling needed */}
          <StickyActionBar>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleExport(false)}
                className="py-3.5 rounded-2xl bg-surface border border-borderdark hover:border-emeraldbrand/60 text-white font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {t('common.save')}
              </button>
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleExport(true)}
                className="py-3.5 rounded-2xl bg-emeraldbrand hover:bg-emeraldbrand-soft text-obsidian font-extrabold text-sm flex items-center justify-center gap-2 transition emerald-glow disabled:opacity-50"
              >
                <Share2 className="w-4 h-4" />
                {t('common.share')}
              </button>
            </div>
          </StickyActionBar>
        </>
      )}
    </div>
  );
};
