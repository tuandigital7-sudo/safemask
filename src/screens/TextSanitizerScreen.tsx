import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  ClipboardPaste,
  Copy,
  EyeOff,
  Plus,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Undo2,
} from 'lucide-react';
import type { DetectedEntity } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { StickyActionBar } from '../components/StickyActionBar';
import {
  buildSanitizedOutput,
  restoreSanitizedText,
  scanSensitiveText,
} from '../engines/textSanitizerEngine';
import { trackEvent } from '../services/analytics';
import { addHistoryEntry } from '../services/history';

const SAMPLE_VI =
  'Chào anh Minh, liên hệ tôi qua 0987654321, email nguyenvana@gmail.com. CCCD: 034092001234, STK: 19034567890123. Địa chỉ: 45 Lê Lợi, TP Thái Bình.';
const SAMPLE_EN =
  'Hi Alex, contact me at +1 415-555-0198 or alex.chen@company.com. Account: 482910482910, Passport: C8492014. Address: 742 Evergreen Terrace, Suite 4B.';

export const TextSanitizerScreen: React.FC = () => {
  const { t, lang } = useI18n();

  const [inputText, setInputText] = useState('');
  const [entities, setEntities] = useState<DetectedEntity[]>([]);
  const [customTerms, setCustomTerms] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [outputText, setOutputText] = useState('');
  const [copied, setCopied] = useState(false);
  const [restoredNotice, setRestoredNotice] = useState(false);

  // Strictly in-memory session mapping ONLY. Cleared on Reset and Unmount!
  const sessionMappingRef = useRef<Record<string, string>>({});

  useEffect(() => {
    return () => {
      // Wipe sensitive mapping immediately on leaving screen
      sessionMappingRef.current = {};
    };
  }, []);

  const runScan = (text: string, terms: string[] = customTerms) => {
    trackEvent('text_sanitizer_start', { tool: 'text-sanitizer' });
    const found = scanSensitiveText(text, terms);
    const built = buildSanitizedOutput(text, found);
    setEntities(built.entities);
    setOutputText(built.sanitizedText);
    sessionMappingRef.current = built.tokenToOriginal;
    setRestoredNotice(false);
    trackEvent('text_sanitizer_complete', {
      tool: 'text-sanitizer',
      count: found.length,
    });
    if (found.length > 0) {
      addHistoryEntry({
        tool: 'text-sanitizer',
        itemCount: 1,
        regionsRedacted: found.length,
      });
    }
  };

  const toggleEntity = (id: string) => {
    const next = entities.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e));
    const built = buildSanitizedOutput(inputText, next);
    setEntities(next);
    setOutputText(built.sanitizedText);
    sessionMappingRef.current = built.tokenToOriginal;
  };

  const setAllEntities = (enabled: boolean) => {
    const next = entities.map((e) => ({ ...e, enabled }));
    const built = buildSanitizedOutput(inputText, next);
    setEntities(next);
    setOutputText(built.sanitizedText);
    sessionMappingRef.current = built.tokenToOriginal;
  };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setInputText(clip);
        runScan(clip);
      }
    } catch {
      // Clipboard API requires user gesture/permission in some browsers
    }
  };

  const handleAddCustom = () => {
    const term = customInput.trim();
    if (!term) return;
    const nextTerms = [...customTerms, term];
    setCustomTerms(nextTerms);
    setCustomInput('');
    if (inputText) runScan(inputText, nextTerms);
  };

  const handleCopy = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      trackEvent('export_complete', { tool: 'text-sanitizer', format: 'text' });
    } catch {
      // fallback
    }
  };

  const handleRestore = () => {
    if (!outputText) return;
    const restored = restoreSanitizedText(outputText, sessionMappingRef.current);
    setOutputText(restored);
    setRestoredNotice(true);
    setTimeout(() => setRestoredNotice(false), 2200);
  };

  const handleReset = () => {
    setInputText('');
    setEntities([]);
    setCustomTerms([]);
    setCustomInput('');
    setOutputText('');
    sessionMappingRef.current = {};
    setRestoredNotice(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400">{t('text.subtitle')}</p>

      {/* Input Area */}
      <div className="bg-surface border border-borderdark rounded-2xl p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handlePaste}
            className="px-3 py-1.5 rounded-xl bg-graphite border border-borderdark text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 hover:border-emeraldbrand/50"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-emeraldbrand-bright" />
            {t('text.paste')}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const sample = lang === 'vi' ? SAMPLE_VI : SAMPLE_EN;
                setInputText(sample);
                runScan(sample);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-graphite border border-borderdark text-xs text-emeraldbrand-soft hover:border-emeraldbrand/50"
            >
              {t('text.sampleBtn')}
            </button>
            <button
              type="button"
              onClick={handleReset}
              aria-label={t('common.reset')}
              className="p-1.5 rounded-xl bg-graphite border border-borderdark text-slate-400 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={5}
          placeholder={t('text.placeholder')}
          className="w-full rounded-xl bg-graphite border border-borderdark p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emeraldbrand resize-y"
        />

        <button
          type="button"
          disabled={!inputText.trim()}
          onClick={() => runScan(inputText)}
          className="w-full py-3 rounded-xl bg-emeraldbrand hover:bg-emeraldbrand-soft text-obsidian font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition"
        >
          <Sparkles className="w-4 h-4" />
          {t('text.scan')}
        </button>
      </div>

      {/* Detected Entities & Custom Mask */}
      <div className="bg-surface border border-borderdark rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white">
            {t('text.detectedTitle')} ({entities.length})
          </span>
          {entities.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAllEntities(true)}
                className="text-xs text-emeraldbrand-bright hover:underline"
              >
                {t('text.hideAll')}
              </button>
              <button
                type="button"
                onClick={() => setAllEntities(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                {t('text.showAll')}
              </button>
            </div>
          )}
        </div>

        {entities.length === 0 ? (
          <p className="text-xs text-slate-500">{t('text.noItems')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {entities.map((ent) => (
              <button
                key={ent.id}
                type="button"
                onClick={() => toggleEntity(ent.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs border transition ${
                  ent.enabled
                    ? 'bg-emeraldbrand/20 border-emeraldbrand text-emeraldbrand-bright font-semibold'
                    : 'bg-graphite border-borderdark text-slate-400 line-through'
                }`}
              >
                <EyeOff className="w-3 h-3" />
                <span>{ent.token}</span>
              </button>
            ))}
          </div>
        )}

        {/* Custom Word Masking */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
            placeholder={t('text.customAdd')}
            className="flex-1 rounded-xl bg-graphite border border-borderdark px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emeraldbrand"
          />
          <button
            type="button"
            onClick={handleAddCustom}
            className="px-3 py-2 rounded-xl bg-elevated border border-borderdark text-xs font-semibold text-emeraldbrand-bright inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('text.add')}
          </button>
        </div>
      </div>

      {/* Sanitized Output */}
      {outputText && (
        <div className="bg-surface border border-emeraldbrand/40 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emeraldbrand-bright">
              {t('text.outputTitle')}
            </span>
            {restoredNotice && (
              <span className="text-[11px] text-amber-300">{t('text.restored')}</span>
            )}
          </div>
          <textarea
            value={outputText}
            onChange={(e) => setOutputText(e.target.value)}
            rows={4}
            className="w-full rounded-xl bg-obsidian border border-borderdark p-3 text-sm font-mono text-emeraldbrand-soft focus:outline-none focus:border-emeraldbrand"
          />
          <StickyActionBar>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleRestore}
                className="py-3.5 rounded-2xl bg-surface border border-borderdark text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Undo2 className="w-4 h-4" />
                {t('text.restore')}
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="py-3.5 rounded-2xl bg-emeraldbrand hover:bg-emeraldbrand-soft text-obsidian font-extrabold text-xs flex items-center justify-center gap-1.5 emerald-glow"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('common.copied') : t('text.copySafe')}
              </button>
            </div>
          </StickyActionBar>
        </div>
      )}

      {/* Privacy & Accuracy Disclosures */}
      <div className="space-y-2 text-[11px] text-slate-400 bg-graphite border border-borderdark rounded-xl p-3">
        <div className="flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-emeraldbrand-bright shrink-0 mt-0.5" />
          <span>{t('text.memoryNotice')}</span>
        </div>
        <p className="pl-6 text-slate-500">{t('text.disclaimer')}</p>
      </div>
    </div>
  );
};
