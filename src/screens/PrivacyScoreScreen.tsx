import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Crown,
  Download,
  Gauge,
  ImagePlus,
  Share2,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { RedactionBox, WatermarkConfig } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { RedactionCanvas } from '../components/RedactionCanvas';
import { StickyActionBar } from '../components/StickyActionBar';
import {
  applyOneTapShieldFix,
  auditPhotoPrivacy,
  loadImageFromFile,
  type PhotoPrivacyAudit,
} from '../engines/privacyScoreEngine';
import {
  renderViralScoreCard,
  saveFileToDevice,
  shareOrDownloadFile,
} from '../engines/redactionEngine';
import { trackEvent } from '../services/analytics';
import { addHistoryEntry } from '../services/history';

interface PrivacyScoreScreenProps {
  isPro: boolean;
  onOpenPaywall: () => void;
}

const VERIFY_WATERMARK: WatermarkConfig = {
  enabled: true,
  text: 'CHỈ DÙNG ĐỂ XÁC MINH',
  position: 'tiled',
  fontSize: 26,
  opacity: 0.24,
  color: '#10B981',
  rotation: -28,
  fontFamily: 'sans-serif',
  includeTimestamp: true,
};

export const PrivacyScoreScreen: React.FC<PrivacyScoreScreenProps> = ({
  isPro,
  onOpenPaywall,
}) => {
  const { t, lang } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [audit, setAudit] = useState<PhotoPrivacyAudit | null>(null);
  const [boxes, setBoxes] = useState<RedactionBox[]>([]);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [addVerifyWatermark, setAddVerifyWatermark] = useState(false);

  const [fixedResult, setFixedResult] = useState<{
    blob: Blob;
    beforeScore: number;
    afterScore: number;
    exifRemaining: number;
  } | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  const [freeScansUsed, setFreeScansUsed] = useState(0);

  const canRunDeepPro = isPro || freeScansUsed < 1;

  const handleImport = async (f?: File | null) => {
    if (!f) return;
    const loaded = await loadImageFromFile(f);
    setFile(f);
    setImgEl(loaded);
    setAudit(null);
    setBoxes([]);
    setFixedResult(null);
    setIsScanning(true);
    setScanProgress(10);
    trackEvent('image_import', { tool: 'privacy-score' });

    try {
      const result = await auditPhotoPrivacy(f, loaded, canRunDeepPro, (pct) =>
        setScanProgress(pct)
      );
      setAudit(result);
      setBoxes(result.suggestedBoxes);
      if (!isPro && canRunDeepPro) {
        setFreeScansUsed((n) => n + 1);
      }
      trackEvent('feature_usage', { tool: 'privacy-score', count: result.score });
    } finally {
      setIsScanning(false);
    }
  };

  const handleOneTapFix = async () => {
    if (!imgEl || !audit) return;
    setIsFixing(true);
    try {
      const wmConfig: WatermarkConfig = {
        ...VERIFY_WATERMARK,
        text: lang === 'vi' ? 'CHỈ DÙNG ĐỂ XÁC MINH' : 'FOR VERIFICATION ONLY',
      };
      const res = await applyOneTapShieldFix(
        imgEl,
        boxes,
        addVerifyWatermark ? wmConfig : undefined,
        !isPro
      );
      setFixedResult({
        blob: res.protectedBlob,
        beforeScore: audit.score,
        afterScore: res.newScore,
        exifRemaining: res.verifiedExifRemaining,
      });
      trackEvent('redaction_complete', {
        tool: 'privacy-score',
        count: boxes.length,
        hasWatermark: addVerifyWatermark,
      });
      addHistoryEntry({
        tool: 'privacy-score',
        itemCount: 1,
        regionsRedacted: boxes.length,
      });
    } finally {
      setIsFixing(false);
    }
  };

  const handleShareScoreCard = async () => {
    if (!imgEl || !fixedResult || !audit) return;
    const cardBlob = await renderViralScoreCard(
      imgEl,
      fixedResult.beforeScore,
      fixedResult.afterScore,
      Math.max(1, audit.issues.length)
    );
    await shareOrDownloadFile(cardBlob, 'safemask-score-card.jpg', 'SafeMask Privacy Score Card');
    trackEvent('share', { tool: 'privacy-score', format: 'score-card' });
  };

  const handleExport = async (share: boolean) => {
    if (!fixedResult || !file) return;
    const outName = `${file.name.replace(/\.[^.]+$/, '')}-safe100.jpg`;
      if (share) {
        await shareOrDownloadFile(fixedResult.blob, outName, 'SafeMask 100/100 Protected Photo');
        trackEvent('share', { tool: 'privacy-score' });
      } else {
        await saveFileToDevice(fixedResult.blob, outName, 'Save Protected Photo');
      }
  };

  const displayScore = fixedResult ? fixedResult.afterScore : (audit?.score ?? 0);
  const ringRadius = 56;
  const ringCirc = 2 * Math.PI * ringRadius;
  const ringOffset = ringCirc - (displayScore / 100) * ringCirc;
  const ringColor =
    displayScore >= 85 ? '#00E676' : displayScore >= 55 ? '#F59E0B' : '#EF4444';

  const statusText =
    displayScore >= 85
      ? t('score.statusSafe')
      : displayScore >= 55
      ? t('score.statusCaution')
      : t('score.statusDanger');

  return (
    <div className="space-y-4 pb-6">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleImport(e.target.files?.[0])}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleImport(e.target.files?.[0])}
      />

      {!imgEl ? (
        <div className="glass-panel rounded-3xl p-7 text-center space-y-5 mt-2 relative overflow-hidden">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-emeraldbrand/15 blur-3xl pointer-events-none" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emeraldbrand/15 border border-emeraldbrand/40 text-emeraldbrand-bright text-[11px] font-bold">
            <Crown className="w-3.5 h-3.5" />
            <span>{t('score.proBadge')}</span>
          </div>

          <div className="w-24 h-24 mx-auto rounded-full bg-obsidian border-2 border-emeraldbrand/50 flex flex-col items-center justify-center emerald-glow">
            <Gauge className="w-9 h-9 text-emeraldbrand-bright" />
            <span className="text-[11px] font-extrabold text-emeraldbrand-soft mt-0.5">
              0–100
            </span>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-extrabold text-white">{t('score.emptyTitle')}</h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              {t('score.emptyDesc')}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-5 py-3.5 rounded-2xl bg-emeraldbrand hover:bg-emeraldbrand-soft text-obsidian font-extrabold text-sm flex items-center gap-2 emerald-glow transition"
            >
              <ImagePlus className="w-4 h-4" />
              {t('score.pickBtn')}
            </button>
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="px-4 py-3.5 rounded-2xl bg-elevated border border-borderdark text-slate-200 font-semibold text-sm flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              {t('common.takePhoto')}
            </button>
          </div>
        </div>
      ) : isScanning ? (
        <div className="glass-panel rounded-3xl p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emeraldbrand/15 border border-emeraldbrand/40 flex items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8 text-emeraldbrand-bright" />
          </div>
          <div className="text-base font-bold text-white">{t('score.scanningTitle')}</div>
          <p className="text-xs text-slate-400">{t('score.scanningDesc')}</p>
          <div className="w-full max-w-xs mx-auto h-2 bg-graphite rounded-full overflow-hidden">
            <div
              className="h-full bg-emeraldbrand-bright transition-all duration-200"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
          <div className="text-xs font-mono text-emeraldbrand-bright">{scanProgress}%</div>
        </div>
      ) : (
        audit && (
          <>
            {/* Score Hero Card */}
            <div className="glass-panel rounded-3xl p-5 relative overflow-hidden">
              <div className="flex items-center gap-5">
                {/* Animated SVG Radial Gauge */}
                <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                  <svg className="w-32 h-32 -rotate-90" viewBox="0 0 132 132">
                    <circle
                      cx="66"
                      cy="66"
                      r={ringRadius}
                      fill="none"
                      stroke="#1E2631"
                      strokeWidth="10"
                    />
                    <circle
                      cx="66"
                      cy="66"
                      r={ringRadius}
                      fill="none"
                      stroke={ringColor}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={ringCirc}
                      strokeDashoffset={ringOffset}
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white leading-none">
                      {displayScore}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 mt-0.5">/ 100</span>
                  </div>
                </div>

                {/* Score Verdict */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-black"
                      style={{
                        backgroundColor: `${ringColor}22`,
                        color: ringColor,
                        border: `1px solid ${ringColor}66`,
                      }}
                    >
                      {fixedResult ? 'A+' : audit.grade}
                    </span>
                    <span className="text-xs font-bold text-slate-300 truncate">{statusText}</span>
                  </div>

                  {fixedResult ? (
                    <div className="space-y-1">
                      <div className="text-sm font-extrabold text-emeraldbrand-bright">
                        {fixedResult.beforeScore}/100 → {fixedResult.afterScore}/100
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        {t('score.fixedSummary')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 leading-snug">
                      {audit.issues.length === 0
                        ? t('score.noIssues')
                        : `${audit.issues.length} ${t('score.issuesFound')}`}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="text-[11px] font-bold text-emeraldbrand-bright hover:underline pt-1"
                  >
                    {t('score.scanAnother')}
                  </button>
                </div>
              </div>
            </div>

            {/* Detected Risks Breakdown */}
            {!fixedResult && audit.issues.length > 0 && (
              <div className="bg-surface border border-borderdark rounded-2xl p-4 space-y-2.5">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>{t('score.breakdownTitle')}</span>
                  {!audit.ocrRan && (
                    <button
                      type="button"
                      onClick={onOpenPaywall}
                      className="text-[11px] text-emeraldbrand-bright inline-flex items-center gap-1"
                    >
                      <Crown className="w-3 h-3" />
                      {t('score.unlockOcr')}
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {audit.issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="flex items-start justify-between gap-2 bg-graphite rounded-xl px-3 py-2.5 border border-borderdark/70"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <AlertTriangle
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            issue.severity === 'high'
                              ? 'text-red-400'
                              : issue.severity === 'medium'
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white">
                            {lang === 'vi' ? issue.titleVi : issue.titleEn}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">{issue.detail}</div>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-red-400 shrink-0">
                        -{issue.deduction}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Photo Preview (User can also draw extra manual boxes) */}
            <RedactionCanvas
              source={imgEl}
              boxes={boxes}
              onChangeBoxes={setBoxes}
              activeMode="blackout"
              watermark={addVerifyWatermark ? VERIFY_WATERMARK : undefined}
              selectedBoxId={selectedBoxId}
              onSelectBox={setSelectedBoxId}
            />

            {!fixedResult ? (
              <>
                <label className="flex items-center justify-between bg-surface border border-borderdark rounded-2xl px-4 py-3 text-xs text-slate-200 cursor-pointer">
                  <span>{t('score.addVerifyWatermark')}</span>
                  <input
                    type="checkbox"
                    checked={addVerifyWatermark}
                    onChange={(e) => setAddVerifyWatermark(e.target.checked)}
                    className="accent-emerald-500 w-4 h-4"
                  />
                </label>

                <StickyActionBar>
                  <button
                    type="button"
                    disabled={isFixing}
                    onClick={handleOneTapFix}
                    className="w-full py-3.5 rounded-2xl bg-emeraldbrand hover:bg-emeraldbrand-soft text-obsidian font-extrabold text-sm flex items-center justify-center gap-2 emerald-glow transition disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" />
                    {isFixing ? t('common.loading') : t('score.fixTo100Btn')}
                  </button>
                </StickyActionBar>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2 bg-emeraldbrand/15 border border-emeraldbrand/40 rounded-2xl px-4 py-3 text-xs text-emeraldbrand-bright font-semibold">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span className="truncate">
                      {t('score.verifiedCleanBanner')} ({fixedResult.exifRemaining} EXIF)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleShareScoreCard}
                    className="px-3 py-1.5 rounded-xl bg-obsidian/80 border border-emeraldbrand/60 text-[11px] font-extrabold text-emeraldbrand-bright shrink-0"
                  >
                    {t('score.shareScoreCard')}
                  </button>
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
              </>
            )}

            <div className="flex items-center gap-2 text-[11px] text-slate-500 justify-center pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emeraldbrand" />
              <span>{t('ocr.disclaimer')}</span>
            </div>
          </>
        )
      )}
    </div>
  );
};
