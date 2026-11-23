import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Layers,
  Lock,
  Play,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { StickyActionBar } from '../components/StickyActionBar';
import { PRICING_CONFIG } from '../config/pricing';
import {
  loadImageFromFile,
  renderProtectedImage,
  saveFileToDevice,
} from '../engines/redactionEngine';
import { addHistoryEntry, getSavedWatermarkPresets } from '../services/history';
import { trackEvent } from '../services/analytics';

interface BatchShieldScreenProps {
  isPro: boolean;
  onOpenPaywall: () => void;
}

interface ProcessedItem {
  name: string;
  blob: Blob;
}

export const BatchShieldScreen: React.FC<BatchShieldScreenProps> = ({ isPro, onOpenPaywall }) => {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);

  const [files, setFiles] = useState<File[]>([]);
  const [stripMeta, setStripMeta] = useState(true);
  const [applyWm, setApplyWm] = useState(true);
  const presets = getSavedWatermarkPresets();
  const [selectedPresetId, setSelectedPresetId] = useState(presets[0]?.id || '');

  const [isRunning, setIsRunning] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [outputs, setOutputs] = useState<ProcessedItem[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const maxAllowed = isPro
    ? PRICING_CONFIG.proLimits.batchMaxImages
    : PRICING_CONFIG.freeLimits.batchMaxImages;

  const handleSelect = (fileList: FileList | null) => {
    if (!fileList) return;
    const arr = Array.from(fileList).slice(0, maxAllowed);
    setFiles(arr);
    setOutputs([]);
    setStatusMsg(null);
  };

  /**
   * Memory-safe sequential processing: loads, processes, and releases ONE image at a time.
   */
  const handleStart = async () => {
    if (files.length === 0) return;
    cancelRef.current = false;
    setIsRunning(true);
    setOutputs([]);
    setCurrentIdx(0);
    setStatusMsg(null);
    trackEvent('batch_start', { tool: 'batch-shield', count: files.length });

    const chosenPreset = presets.find((p) => p.id === selectedPresetId)?.config;
    const results: ProcessedItem[] = [];

    for (let i = 0; i < files.length; i++) {
      if (cancelRef.current) {
        setIsRunning(false);
        setStatusMsg(t('batch.cancelled'));
        return;
      }
      setCurrentIdx(i + 1);
      const f = files[i];
      try {
        const img = await loadImageFromFile(f);
        const blob = await renderProtectedImage(img, {
          boxes: [],
          watermark: applyWm ? chosenPreset : undefined,
          maxDimension: 2048,
        });
        results.push({
          name: `${f.name.replace(/\.[^.]+$/, '')}-safemask.jpg`,
          blob,
        });
        // Yield to UI thread so progress stays responsive
        await new Promise((r) => setTimeout(r, 30));
      } catch {
        // skip unreadable file
      }
    }

    setOutputs(results);
    setIsRunning(false);
    setStatusMsg(t('batch.completed'));
    trackEvent('batch_complete', { tool: 'batch-shield', count: results.length });
    addHistoryEntry({ tool: 'batch-shield', itemCount: results.length });
  };

  const handleCancel = () => {
    cancelRef.current = true;
  };

  const handleDownloadAll = async () => {
    for (const item of outputs) {
      await saveFileToDevice(item.blob, item.name, 'Save Protected Photo');
    }
    trackEvent('export_complete', { tool: 'batch-shield', count: outputs.length });
  };

  const handleClearTemp = () => {
    setFiles([]);
    setOutputs([]);
    setStatusMsg(null);
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleSelect(e.target.files)}
      />

      {/* Plan Limit Banner */}
      <div className="flex items-center justify-between bg-surface border border-borderdark rounded-2xl px-4 py-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Lock className="w-4 h-4 text-emeraldbrand-bright" />
          <span>{isPro ? t('batch.proLimit') : t('batch.freeLimit')}</span>
        </div>
        {!isPro && (
          <button
            type="button"
            onClick={onOpenPaywall}
            className="px-2.5 py-1 rounded-lg bg-emeraldbrand text-obsidian font-bold shrink-0"
          >
            {t('nav.pro')}
          </button>
        )}
      </div>

      {files.length === 0 ? (
        <div className="glass-panel rounded-3xl p-8 text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emeraldbrand/15 border border-emeraldbrand/40 flex items-center justify-center">
            <Layers className="w-8 h-8 text-emeraldbrand-bright" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-white">{t('batch.emptyTitle')}</h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              {t('batch.emptyDesc')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="px-6 py-3 rounded-2xl bg-emeraldbrand hover:bg-emeraldbrand-soft text-obsidian font-bold text-sm inline-flex items-center gap-2 transition"
          >
            <Layers className="w-4 h-4" />
            {t('batch.selectPhotos')}
          </button>
        </div>
      ) : (
        <>
          <div className="bg-surface border border-borderdark rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">
                {files.length} / {maxAllowed} {t('history.items')}
              </span>
              <button
                type="button"
                onClick={handleClearTemp}
                className="text-xs text-slate-400 hover:text-red-400 inline-flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t('common.clear')}
              </button>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1.5 text-xs text-slate-300">
              {files.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="flex items-center justify-between bg-graphite rounded-lg px-3 py-1.5"
                >
                  <span className="truncate">{f.name}</span>
                  <span className="text-slate-500 shrink-0 ml-2">
                    {(f.size / 1024).toFixed(0)} KB
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Preset Options */}
          <div className="bg-surface border border-borderdark rounded-2xl p-4 space-y-3 text-xs">
            <label className="flex items-center justify-between cursor-pointer text-slate-200">
              <span>{t('batch.stripMeta')}</span>
              <input
                type="checkbox"
                checked={stripMeta}
                onChange={(e) => setStripMeta(e.target.checked)}
                className="accent-emerald-500 w-4 h-4"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer text-slate-200">
              <span>{t('batch.applyWatermark')}</span>
              <input
                type="checkbox"
                checked={applyWm}
                onChange={(e) => setApplyWm(e.target.checked)}
                className="accent-emerald-500 w-4 h-4"
              />
            </label>
            {applyWm && presets.length > 0 && (
              <select
                value={selectedPresetId}
                onChange={(e) => setSelectedPresetId(e.target.value)}
                className="w-full bg-graphite border border-borderdark rounded-xl px-3 py-2 text-xs text-white"
              >
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.config.text})
                  </option>
                ))}
              </select>
            )}
          </div>

          {isRunning && (
            <div className="bg-surface border border-emeraldbrand/40 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emeraldbrand-bright font-semibold">
                  {t('batch.progress')} {currentIdx} / {files.length}
                </span>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-red-400 inline-flex items-center gap-1 font-semibold"
                >
                  <XCircle className="w-4 h-4" />
                  {t('common.cancel')}
                </button>
              </div>
              <div className="w-full h-2 bg-graphite rounded-full overflow-hidden">
                <div
                  className="h-full bg-emeraldbrand-bright transition-all"
                  style={{ width: `${Math.round((currentIdx / files.length) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {statusMsg && (
            <div className="flex items-center gap-2 text-xs text-emeraldbrand-bright bg-emeraldbrand/10 border border-emeraldbrand/30 rounded-xl px-3.5 py-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          <StickyActionBar>
            {outputs.length > 0 ? (
              <button
                type="button"
                onClick={handleDownloadAll}
                className="w-full py-3.5 rounded-2xl bg-emeraldbrand hover:bg-emeraldbrand-soft text-obsidian font-extrabold text-sm flex items-center justify-center gap-2 emerald-glow"
              >
                <Download className="w-4 h-4" />
                {t('batch.downloadAll')} ({outputs.length})
              </button>
            ) : (
              <button
                type="button"
                disabled={isRunning}
                onClick={handleStart}
                className="w-full py-3.5 rounded-2xl bg-emeraldbrand hover:bg-emeraldbrand-soft text-obsidian font-extrabold text-sm flex items-center justify-center gap-2 emerald-glow disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {t('batch.start')}
              </button>
            )}
          </StickyActionBar>
        </>
      )}
    </div>
  );
};
