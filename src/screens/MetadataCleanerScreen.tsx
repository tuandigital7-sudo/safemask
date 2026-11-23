import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ImagePlus,
  MapPinOff,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { StickyActionBar } from '../components/StickyActionBar';
import {
  inspectImageMetadata,
  stripAndVerifyMetadata,
  type MetadataCleanResult,
  type MetadataInspection,
} from '../engines/metadataEngine';
import { saveFileToDevice, shareOrDownloadFile } from '../engines/redactionEngine';
import { trackEvent } from '../services/analytics';
import { addHistoryEntry } from '../services/history';

export const MetadataCleanerScreen: React.FC = () => {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [inspection, setInspection] = useState<MetadataInspection | null>(null);
  const [cleanResult, setCleanResult] = useState<MetadataCleanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImport = async (f?: File | null) => {
    if (!f) return;
    setFile(f);
    setCleanResult(null);
    setIsProcessing(true);
    try {
      const info = await inspectImageMetadata(f);
      setInspection(info);
      trackEvent('image_import', { tool: 'metadata-cleaner', count: info.rawCount });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClean = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const res = await stripAndVerifyMetadata(file);
      setCleanResult(res);
      trackEvent('export_complete', {
        tool: 'metadata-cleaner',
        count: res.removedFields.length,
        success: res.verifiedClean,
      });
      addHistoryEntry({
        tool: 'metadata-cleaner',
        itemCount: 1,
        regionsRedacted: res.removedFields.length,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async (share: boolean) => {
    if (!cleanResult || !file) return;
    const outName = `${file.name.replace(/\.[^.]+$/, '')}-clean.jpg`;
    if (share) {
      await shareOrDownloadFile(cleanResult.cleanedBlob, outName, 'SafeMask Clean Photo');
      trackEvent('share', { tool: 'metadata-cleaner' });
    } else {
      await saveFileToDevice(cleanResult.cleanedBlob, outName, 'Save Clean Photo');
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleImport(e.target.files?.[0])}
      />

      {!file ? (
        <div className="glass-panel rounded-3xl p-8 text-center space-y-5 mt-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emeraldbrand/15 border border-emeraldbrand/40 flex items-center justify-center">
            <MapPinOff className="w-8 h-8 text-emeraldbrand-bright" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-white">{t('meta.emptyTitle')}</h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              {t('meta.emptyDesc')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="px-6 py-3 rounded-2xl bg-emeraldbrand hover:bg-emeraldbrand-soft text-obsidian font-bold text-sm inline-flex items-center gap-2 transition"
          >
            <ImagePlus className="w-4 h-4" />
            {t('common.importImage')}
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between bg-surface border border-borderdark rounded-2xl px-4 py-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{file.name}</div>
              <div className="text-xs text-slate-400">
                {(file.size / 1024).toFixed(1)} KB
              </div>
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs font-semibold text-emeraldbrand-bright hover:underline shrink-0 ml-3"
            >
              {t('common.importImage')}
            </button>
          </div>

          {inspection?.hasGps && (
            <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/40 rounded-2xl p-3.5 text-xs text-red-300">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <div className="font-bold">{t('meta.gpsWarning')}</div>
                <div className="font-mono text-[11px] opacity-85">{inspection.gpsSummary}</div>
              </div>
            </div>
          )}

          {/* Detected Metadata Table */}
          {inspection && (
            <div className="bg-surface border border-borderdark rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  {t('meta.detected')} ({inspection.rawCount})
                </span>
                {inspection.deviceSummary && (
                  <span className="text-[11px] text-slate-400">{inspection.deviceSummary}</span>
                )}
              </div>

              {inspection.fields.length === 0 ? (
                <p className="text-xs text-emeraldbrand-soft">{t('meta.noneDetected')}</p>
              ) : (
                <div className="max-h-56 overflow-y-auto divide-y divide-borderdark/60 text-xs">
                  {inspection.fields.map((f) => (
                    <div key={f.key} className="py-2 flex items-center justify-between gap-3">
                      <span
                        className={`font-mono ${
                          f.sensitive ? 'text-amber-300 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        {f.key}
                      </span>
                      <span className="text-slate-200 truncate max-w-[58%] text-right">
                        {f.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!cleanResult ? (
            <StickyActionBar>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleClean}
                className="w-full py-3.5 rounded-2xl bg-emeraldbrand hover:bg-emeraldbrand-soft text-obsidian font-extrabold text-sm flex items-center justify-center gap-2 emerald-glow disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                {isProcessing ? t('common.loading') : t('meta.cleanBtn')}
              </button>
            </StickyActionBar>
          ) : (
            <div className="space-y-3">
              <div
                className={`rounded-2xl p-4 border space-y-1.5 ${
                  cleanResult.verifiedClean
                    ? 'bg-emeraldbrand/10 border-emeraldbrand/40'
                    : 'bg-amber-500/10 border-amber-500/40'
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-bold text-emeraldbrand-bright">
                  <CheckCircle2 className="w-4 h-4" />
                  {cleanResult.verifiedClean ? t('meta.verifiedClean') : t('meta.remainingWarn')}
                </div>
                <p className="text-xs text-slate-300">{t('meta.verifiedDesc')}</p>
                <p className="text-[11px] text-slate-400">
                  {t('meta.removedList')}: {cleanResult.removedFields.length} •{' '}
                  {(cleanResult.cleanedSize / 1024).toFixed(1)} KB
                </p>
              </div>

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
            </div>
          )}
        </>
      )}
    </div>
  );
};
