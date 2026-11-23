import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Lock,
  Redo2,
  Share2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { RedactionBox, RedactionMode } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { RedactionCanvas } from '../components/RedactionCanvas';
import { StickyActionBar } from '../components/StickyActionBar';
import {
  exportRasterizedRedactedPdf,
  loadPdfFromFile,
  renderPdfPageToCanvas,
  type LoadedPdf,
} from '../engines/pdfEngine';
import { saveFileToDevice, shareOrDownloadFile } from '../engines/redactionEngine';
import { PRICING_CONFIG } from '../config/pricing';
import { trackEvent } from '../services/analytics';
import { addHistoryEntry } from '../services/history';

interface PdfShieldScreenProps {
  isPro: boolean;
  onOpenPaywall: () => void;
}

export const PdfShieldScreen: React.FC<PdfShieldScreenProps> = ({ isPro, onOpenPaywall }) => {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [loadedPdf, setLoadedPdf] = useState<LoadedPdf | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCanvas, setPageCanvas] = useState<HTMLCanvasElement | null>(null);
  const [pageBoxes, setPageBoxes] = useState<Record<number, RedactionBox[]>>({});
  const [undoMap, setUndoMap] = useState<Record<number, RedactionBox[][]>>({});
  const [redoMap, setRedoMap] = useState<Record<number, RedactionBox[][]>>({});
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);

  const [mode, setMode] = useState<RedactionMode>('blackout');
  const [zoom, setZoom] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const maxExportPages = isPro
    ? PRICING_CONFIG.proLimits.pdfMaxPages
    : PRICING_CONFIG.freeLimits.pdfMaxPagesFree;

  const handleImport = async (f?: File | null) => {
    if (!f) return;
    const pdf = await loadPdfFromFile(f);
    setFile(f);
    setLoadedPdf(pdf);
    setCurrentPage(1);
    setPageBoxes({});
    setUndoMap({});
    setRedoMap({});
    setStatusMsg(null);
    trackEvent('pdf_import', { tool: 'pdf-shield', count: pdf.numPages });
  };

  useEffect(() => {
    if (!loadedPdf) return;
    let active = true;
    renderPdfPageToCanvas(loadedPdf.doc, currentPage, 1.5).then((canvas) => {
      if (active) setPageCanvas(canvas);
    });
    return () => {
      active = false;
    };
  }, [loadedPdf, currentPage]);

  const currentBoxes = pageBoxes[currentPage] || [];

  const updateCurrentBoxes = (next: RedactionBox[]) => {
    setUndoMap((prev) => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []).slice(-15), currentBoxes],
    }));
    setRedoMap((prev) => ({ ...prev, [currentPage]: [] }));
    setPageBoxes((prev) => ({ ...prev, [currentPage]: next }));
  };

  const handleUndo = () => {
    const stack = undoMap[currentPage] || [];
    if (stack.length === 0) return;
    const prev = stack[stack.length - 1];
    setRedoMap((r) => ({ ...r, [currentPage]: [...(r[currentPage] || []), currentBoxes] }));
    setUndoMap((u) => ({ ...u, [currentPage]: stack.slice(0, -1) }));
    setPageBoxes((p) => ({ ...p, [currentPage]: prev }));
  };

  const handleRedo = () => {
    const stack = redoMap[currentPage] || [];
    if (stack.length === 0) return;
    const next = stack[stack.length - 1];
    setUndoMap((u) => ({ ...u, [currentPage]: [...(u[currentPage] || []), currentBoxes] }));
    setRedoMap((r) => ({ ...r, [currentPage]: stack.slice(0, -1) }));
    setPageBoxes((p) => ({ ...p, [currentPage]: next }));
  };

  const handleExport = async (share: boolean) => {
    if (!loadedPdf || !file) return;
    setIsExporting(true);
    setStatusMsg(null);
    try {
      const blob = await exportRasterizedRedactedPdf(
        loadedPdf.doc,
        pageBoxes,
        maxExportPages,
        (cur, tot) => setExportProgress(`${cur}/${tot}`)
      );
      const outName = `${file.name.replace(/\.pdf$/i, '')}-redacted.pdf`;
      if (share) {
        await shareOrDownloadFile(blob, outName, 'SafeMask Redacted PDF');
        trackEvent('share', { tool: 'pdf-shield' });
      } else {
        await saveFileToDevice(blob, outName, 'Save Redacted PDF');
      }

      const totalRegions = Object.values(pageBoxes).reduce((sum, arr) => sum + arr.length, 0);
      trackEvent('pdf_export', { tool: 'pdf-shield', count: totalRegions });
      addHistoryEntry({
        tool: 'pdf-shield',
        itemCount: Math.min(loadedPdf.numPages, maxExportPages),
        regionsRedacted: totalRegions,
      });
      setStatusMsg(t('pdf.exportedSuccess'));
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => handleImport(e.target.files?.[0])}
      />

      {!loadedPdf ? (
        <div className="glass-panel rounded-3xl p-8 text-center space-y-5 mt-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emeraldbrand/15 border border-emeraldbrand/40 flex items-center justify-center">
            <FileText className="w-8 h-8 text-emeraldbrand-bright" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-white">{t('pdf.emptyTitle')}</h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              {t('pdf.emptyDesc')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="px-6 py-3 rounded-2xl bg-emeraldbrand hover:bg-emeraldbrand-soft text-obsidian font-bold text-sm inline-flex items-center gap-2 transition"
          >
            <FileText className="w-4 h-4" />
            {t('common.importPdf')}
          </button>
        </div>
      ) : (
        <>
          {/* Page Navigation & Undo/Zoom */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-xl bg-surface border border-borderdark text-slate-200 disabled:opacity-35"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-white px-2">
                {t('pdf.pageOf')} {currentPage} / {loadedPdf.numPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= loadedPdf.numPages}
                onClick={() => setCurrentPage((p) => Math.min(loadedPdf.numPages, p + 1))}
                className="p-2 rounded-xl bg-surface border border-borderdark text-slate-200 disabled:opacity-35"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleUndo}
                disabled={(undoMap[currentPage] || []).length === 0}
                className="p-2 rounded-xl bg-surface border border-borderdark text-slate-200 disabled:opacity-35"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={(redoMap[currentPage] || []).length === 0}
                className="p-2 rounded-xl bg-surface border border-borderdark text-slate-200 disabled:opacity-35"
              >
                <Redo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
                className="p-2 rounded-xl bg-surface border border-borderdark text-slate-300"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
                className="p-2 rounded-xl bg-surface border border-borderdark text-slate-300"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isPro && loadedPdf.numPages > maxExportPages && (
            <div className="flex items-center justify-between gap-3 bg-emeraldbrand/10 border border-emeraldbrand/40 rounded-2xl px-3.5 py-2.5 text-xs">
              <div className="flex items-center gap-2 text-emeraldbrand-soft">
                <Lock className="w-4 h-4 shrink-0" />
                <span>{t('pdf.freeLimitNotice')}</span>
              </div>
              <button
                type="button"
                onClick={onOpenPaywall}
                className="px-3 py-1 rounded-lg bg-emeraldbrand text-obsidian font-bold shrink-0"
              >
                {t('nav.pro')}
              </button>
            </div>
          )}

          {pageCanvas && (
            <RedactionCanvas
              source={pageCanvas}
              boxes={currentBoxes}
              onChangeBoxes={updateCurrentBoxes}
              activeMode={mode}
              zoom={zoom}
              selectedBoxId={selectedBoxId}
              onSelectBox={setSelectedBoxId}
            />
          )}

          {/* Mode bar */}
          <div className="grid grid-cols-3 gap-2 bg-surface border border-borderdark rounded-2xl p-2.5">
            {(['blackout', 'blur', 'pixelate'] as RedactionMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`py-2 rounded-xl text-xs font-semibold border transition ${
                  mode === m
                    ? 'bg-emeraldbrand text-obsidian border-emeraldbrand'
                    : 'bg-graphite text-slate-300 border-borderdark'
                }`}
              >
                {t(`image.mode.${m}`)}
              </button>
            ))}
          </div>

          {/* Mandatory Rasterized PDF Security Disclosure */}
          <div className="flex items-start gap-2.5 text-[11px] text-slate-300 bg-graphite border border-borderdark rounded-2xl p-3.5 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{t('pdf.rasterNotice')}</span>
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
                disabled={isExporting}
                onClick={() => handleExport(false)}
                className="py-3.5 rounded-2xl bg-surface border border-borderdark text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isExporting ? `${t('pdf.exporting')} ${exportProgress}` : t('pdf.exportBtn')}
              </button>
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleExport(true)}
                className="py-3.5 rounded-2xl bg-emeraldbrand text-obsidian font-extrabold text-sm flex items-center justify-center gap-2 emerald-glow disabled:opacity-50"
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
