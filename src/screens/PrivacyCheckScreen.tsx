import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileSearch,
  ShieldCheck,
} from 'lucide-react';
import type { ToolRoute } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { inspectImageMetadata } from '../engines/metadataEngine';
import { scanSensitiveText } from '../engines/textSanitizerEngine';

interface PrivacyCheckScreenProps {
  onNavigate: (route: ToolRoute) => void;
}

interface Finding {
  severity: 'risk' | 'safe';
  label: string;
  targetTool?: ToolRoute;
}

export const PrivacyCheckScreen: React.FC<PrivacyCheckScreenProps> = ({ onNavigate }) => {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);

  const [textInput, setTextInput] = useState('');
  const [findings, setFindings] = useState<Finding[]>([]);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const handleFileCheck = async (f?: File | null) => {
    if (!f) return;
    const next: Finding[] = [];
    if (f.type === 'application/pdf') {
      next.push({
        severity: 'risk',
        label: `PDF: ${f.name} — Use PDF Shield to flatten & redact sensitive pages.`,
        targetTool: 'pdf-shield',
      });
    } else if (f.type.startsWith('image/')) {
      const meta = await inspectImageMetadata(f);
      if (meta.hasGps) {
        next.push({
          severity: 'risk',
          label: `GPS coordinates embedded (${meta.gpsSummary})`,
          targetTool: 'metadata-cleaner',
        });
      }
      if (meta.rawCount > 0) {
        next.push({
          severity: 'risk',
          label: `${meta.rawCount} EXIF/device metadata fields found`,
          targetTool: 'metadata-cleaner',
        });
      } else {
        next.push({
          severity: 'safe',
          label: '0 EXIF/GPS metadata fields detected',
        });
      }
      next.push({
        severity: 'risk',
        label: 'Check visual content (ID, phone, bank account) with Image Shield or Smart OCR',
        targetTool: 'image-shield',
      });
    }
    setFindings(next);
  };

  const handleTextCheck = () => {
    if (!textInput.trim()) return;
    const ents = scanSensitiveText(textInput);
    if (ents.length === 0) {
      setFindings([{ severity: 'safe', label: 'No common phone/email/ID patterns detected in text.' }]);
    } else {
      const types = Array.from(new Set(ents.map((e) => e.type))).join(', ');
      setFindings([
        {
          severity: 'risk',
          label: `${ents.length} sensitive item(s) detected: ${types}`,
          targetTool: 'text-sanitizer',
        },
      ]);
    }
  };

  const checklistKeys = [
    'check.item1',
    'check.item2',
    'check.item3',
    'check.item4',
    'check.item5',
  ];

  const hasRisks = findings.some((f) => f.severity === 'risk');

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400">{t('check.subtitle')}</p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => handleFileCheck(e.target.files?.[0])}
      />

      {/* Quick File & Text Scanner */}
      <div className="bg-surface border border-borderdark rounded-2xl p-4 space-y-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full py-3 rounded-xl bg-graphite border border-dashed border-emeraldbrand/50 hover:border-emeraldbrand text-sm font-semibold text-emeraldbrand-bright flex items-center justify-center gap-2 transition"
        >
          <FileSearch className="w-4 h-4" />
          {t('check.dropFile')}
        </button>

        <div className="text-[11px] text-center text-slate-500">{t('check.orText')}</div>

        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          rows={3}
          placeholder={t('text.placeholder')}
          className="w-full rounded-xl bg-graphite border border-borderdark p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emeraldbrand"
        />
        <button
          type="button"
          disabled={!textInput.trim()}
          onClick={handleTextCheck}
          className="w-full py-2.5 rounded-xl bg-emeraldbrand text-obsidian font-bold text-xs disabled:opacity-40"
        >
          {t('check.runCheck')}
        </button>
      </div>

      {/* Findings */}
      {findings.length > 0 && (
        <div
          className={`rounded-2xl p-4 border space-y-2.5 ${
            hasRisks
              ? 'bg-amber-500/10 border-amber-500/40'
              : 'bg-emeraldbrand/10 border-emeraldbrand/40'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            {hasRisks ? (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emeraldbrand-bright" />
            )}
            <span>{hasRisks ? t('check.scoreRisk') : t('check.scoreSafe')}</span>
          </div>
          <div className="space-y-2">
            {findings.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 bg-obsidian/60 rounded-xl px-3 py-2 text-xs"
              >
                <span className={f.severity === 'risk' ? 'text-amber-200' : 'text-emeraldbrand-soft'}>
                  {f.label}
                </span>
                {f.targetTool && (
                  <button
                    type="button"
                    onClick={() => onNavigate(f.targetTool!)}
                    className="inline-flex items-center gap-1 text-emeraldbrand-bright font-bold shrink-0"
                  >
                    {t('check.fixWith')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Pre-Share Checklist */}
      <div className="bg-surface border border-borderdark rounded-2xl p-4 space-y-2.5">
        <h3 className="text-xs font-bold text-white">{t('check.checklistTitle')}</h3>
        {checklistKeys.map((key, idx) => {
          const checked = !!checkedItems[idx];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setCheckedItems((p) => ({ ...p, [idx]: !p[idx] }))}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left text-xs transition ${
                checked
                  ? 'bg-emeraldbrand/15 border-emeraldbrand/50 text-emeraldbrand-soft'
                  : 'bg-graphite border-borderdark text-slate-300'
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${
                  checked ? 'text-emeraldbrand-bright' : 'text-slate-600'
                }`}
              />
              <span>{t(key)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
