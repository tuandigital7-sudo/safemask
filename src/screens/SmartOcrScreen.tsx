import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckSquare,
  Download,
  ScanText,
  Share2,
  Square,
  Undo2,
} from 'lucide-react';
import type { RedactionBox } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { RedactionCanvas } from '../components/RedactionCanvas';
import { StickyActionBar } from '../components/StickyActionBar';
import {
  loadImageFromFile,
  renderProtectedImage,
  saveFileToDevice,
  shareOrDownloadFile,
} from '../engines/redactionEngine';
import { runLocalOcrScan } from '../engines/ocrEngine';
import { trackEvent } from '../services/analytics';
import { addHistoryEntry } from '../services/history';

export const SmartOcrScreen: React.FC<{ isPro?: boolean }> = ({ isPro = false }) => {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [suggestions, setSuggestions] = useState<RedactionBox[]>([]);
  const [appliedBoxes, setAppliedBoxes] = useState<RedactionBox[]>([]);
  const [undoSnapshot, setUndoSnapshot] = useState<RedactionBox[] | null>(null);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasScanned, setHasScanned] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleFile = async (f?: File | null) => {
    if (!f) return;
    const loaded = await loadImageFromFile(f);
    setFile(f);
    setImgEl(loaded);
    setSuggestions([]);
    setAppliedBoxes([]);
    setUndoSnapshot(null);
    setHasScanned(false);
    setStatusMsg(null);
    trackEvent('image_import', { tool: 'smart-ocr' });
  };

  const handleScan = async () => {
    if (!file || !imgEl) return;
    setIsScanning(true);
    setProgress(5);
    setStatusMsg(null);
    trackEvent('ocr_start', { tool: 'smart-ocr' });
    try {
      const result = await runLocalOcrScan(
        file,
        imgEl.naturalWidth,
        imgEl.naturalHeight,
        (pct) => setProgress(pct)
      );
      setSuggestions(result.boxes);
      setHasScanned(true);
      trackEvent('ocr_complete', { tool: 'smart-ocr', count: result.boxes.length });
    } catch {
      setHasScanned(true);
      setSuggestions([]);
    } finally {
      setIsScanning(false);
      setProgress(100);
    }
  };

  const toggleSuggestion = (id: string) => {
    setSuggestions((prev) =>
      prev.map((b) => (b.id === id ? { ...b, selected: !b.selected } : b))
    );
  };

  const selectAll = () =>
    setSuggestions((prev) => prev.map((b) => ({ ...b, selected: true })));
  const deselectAll = () =>
    setSuggestions((prev) => prev.map((b) => ({ ...b, selected: false })));

  const applySelected = () => {
    const chosen = suggestions.filter((s) => s.selected);
    setUndoSnapshot(appliedBoxes);
    setAppliedBoxes([...appliedBoxes, ...chosen]);
    setSuggestions((prev) => prev.filter((s) => !s.selected));
  };

  const handleUndo = () => {
    if (!undoSnapshot) return;
    setAppliedBoxes(undoSnapshot);
    setUndoSnapshot(null);
  };

  const handleExport = async (share: boolean) => {
    if (!imgEl) return;
    const blob = await renderProtectedImage(imgEl, {
      boxes: appliedBoxes,
      includeSafeMaskTag: !isPro,
    });
    const name = `${(file?.name || 'ocr').replace(/\.[^.]+$/, '')}-redacted.jpg`;
    if (share) {
      await shareOrDownloadFile(blob, name, 'SafeMask OCR Protected');
      trackEvent('share', { tool: 'smart-ocr' });
    } else {
      await saveFileToDevice(blob, name, 'Save Protected Photo');
    }
    trackEvent('export_complete', { tool: 'smart-ocr', count: appliedBoxes.length });
    addHistoryEntry({
      tool: 'smart-ocr',
      itemCount: 1,
      regionsRedacted: appliedBoxes.length,
    });
    setStatusMsg(t('image.exportedSuccess'));
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {!imgEl ? (
        <div className="glass-panel rounded-3xl p-8 text-center space-y-5 mt-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emeraldbrand/15 border border-emeraldbrand/40 flex items-center justify-center">
            <ScanText className="w-8 h-8 text-emeraldbrand-bright" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-white">{t('ocr.emptyTitle')}</h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              {t('ocr.emptyDesc')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="px-6 py-3 rounded-2xl bg-emeraldbrand hover:bg-emeraldbrand-soft text-obsidian font-bold text-sm inline-flex items-center gap-2 transition"
          >
            <ScanText className="w-4 h-4" />
            {t('common.importImage')}
          </button>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">{t('ocr.networkNote')}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={isScanning}
              onClick={handleScan}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emeraldbrand hover:bg-emeraldbrand-soft text-obsidian font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition"
            >
              <ScanText className="w-4 h-4" />
              {isScanning ? `${t('ocr.scanning')} ${progress}%` : t('ocr.scanBtn')}
            </button>
            {undoSnapshot && (
              <button
                type="button"
                onClick={handleUndo}
                className="p-2.5 rounded-xl bg-surface border border-borderdark text-slate-200"
                aria-label={t('common.undo')}
              >
                <Undo2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {isScanning && (
            <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-emeraldbrand-bright transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Canvas displays applied redactions and also allows manual draw */}
          <RedactionCanvas
            source={imgEl}
            boxes={appliedBoxes}
            onChangeBoxes={setAppliedBoxes}
            activeMode="blackout"
            selectedBoxId={selectedBoxId}
            onSelectBox={setSelectedBoxId}
          />

          {/* Suggested OCR Boxes for User Review (Never auto-redacted without review) */}
          {hasScanned && (
            <div className="bg-surface border border-borderdark rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  {t('ocr.foundCount')}: {suggestions.length}
                </span>
                {suggestions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-xs text-emeraldbrand-bright hover:underline"
                    >
                      {t('ocr.selectAll')}
                    </button>
                    <button
                      type="button"
                      onClick={deselectAll}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      {t('ocr.deselectAll')}
                    </button>
                  </div>
                )}
              </div>

              {suggestions.length === 0 ? (
                <p className="text-xs text-slate-400">{t('ocr.noneFound')}</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleSuggestion(s.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          s.selected
                            ? 'bg-emeraldbrand/20 border-emeraldbrand text-emeraldbrand-bright'
                            : 'bg-graphite border-borderdark text-slate-400'
                        }`}
                      >
                        {s.selected ? (
                          <CheckSquare className="w-3.5 h-3.5" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                        {s.label || 'SENSITIVE'}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={applySelected}
                    className="w-full py-2.5 rounded-xl bg-emeraldbrand text-obsidian font-bold text-xs transition hover:bg-emeraldbrand-soft"
                  >
                    {t('ocr.apply')}
                  </button>
                </>
              )}
            </div>
          )}

          <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-graphite border border-borderdark rounded-xl p-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{t('ocr.disclaimer')}</span>
          </div>

          {statusMsg && (
            <div className="flex items-center gap-2 text-xs text-emeraldbrand-bright bg-emeraldbrand/10 border border-emeraldbrand/30 rounded-xl px-3.5 py-2.5">
              <Check className="w-4 h-4 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          <StickyActionBar>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleExport(false)}
                className="py-3.5 rounded-2xl bg-surface border border-borderdark text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t('common.save')}
              </button>
              <button
                type="button"
                onClick={() => handleExport(true)}
                className="py-3.5 rounded-2xl bg-emeraldbrand text-obsidian font-extrabold text-sm flex items-center justify-center gap-2 emerald-glow"
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
