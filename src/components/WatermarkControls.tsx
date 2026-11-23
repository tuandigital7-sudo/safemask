import React, { useState } from 'react';
import { Bookmark, Check, Trash2 } from 'lucide-react';
import type { SavedWatermarkPreset, WatermarkConfig, WatermarkPosition } from '../types';
import { useI18n } from '../i18n/I18nContext';
import {
  deleteWatermarkPreset,
  getSavedWatermarkPresets,
  saveWatermarkPreset,
} from '../services/history';

interface WatermarkControlsProps {
  config: WatermarkConfig;
  onChange: (next: WatermarkConfig) => void;
}

const TEMPLATES = [
  'FOR VERIFICATION ONLY',
  'NO AI TRAINING • PERSONAL USE',
  'CONFIDENTIAL',
  'NOT FOR PUBLIC USE',
  'PERSONAL COPY',
  'CHỈ DÙNG ĐỂ XÁC MINH',
];

const POSITIONS: WatermarkPosition[] = ['tiled', 'diagonal', 'center', 'bottom-right', 'top-left'];
const COLORS = ['#FFFFFF', '#10B981', '#00E676', '#F59E0B', '#EF4444', '#94A3B8'];

export const WatermarkControls: React.FC<WatermarkControlsProps> = ({ config, onChange }) => {
  const { t } = useI18n();
  const [presets, setPresets] = useState<SavedWatermarkPreset[]>(() => getSavedWatermarkPresets());
  const [savedToast, setSavedToast] = useState(false);

  const update = (patch: Partial<WatermarkConfig>) => {
    onChange({ ...config, ...patch });
  };

  const handleSavePreset = () => {
    if (!config.text.trim()) return;
    const next = saveWatermarkPreset({
      id: `wm-${Date.now()}`,
      name: config.text.trim().slice(0, 22),
      config: { ...config, enabled: true },
    });
    setPresets(next);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1800);
  };

  return (
    <div className="space-y-4 bg-surface border border-borderdark rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">{t('watermark.enable')}</span>
        <button
          type="button"
          onClick={() => update({ enabled: !config.enabled })}
          className={`w-12 h-6 rounded-full transition-colors p-0.5 ${
            config.enabled ? 'bg-emeraldbrand' : 'bg-elevated border border-borderdark'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white transition-transform ${
              config.enabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Quick Templates */}
      <div>
        <div className="text-xs text-slate-400 mb-2">{t('watermark.templates')}</div>
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl}
              type="button"
              onClick={() => update({ enabled: true, text: tpl })}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${
                config.text === tpl
                  ? 'bg-emeraldbrand/20 border-emeraldbrand text-emeraldbrand-bright font-semibold'
                  : 'bg-graphite border-borderdark text-slate-300 hover:border-slate-500'
              }`}
            >
              {tpl}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Text */}
      <div>
        <label className="block text-xs text-slate-400 mb-1.5">{t('watermark.customText')}</label>
        <input
          type="text"
          value={config.text}
          onChange={(e) => update({ enabled: true, text: e.target.value })}
          placeholder="CONFIDENTIAL"
          className="w-full rounded-xl bg-graphite border border-borderdark px-3 py-2 text-sm text-white focus:outline-none focus:border-emeraldbrand"
        />
      </div>

      {/* Layout */}
      <div>
        <div className="text-xs text-slate-400 mb-1.5">{t('watermark.position')}</div>
        <div className="grid grid-cols-3 gap-1.5">
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => update({ enabled: true, position: pos })}
              className={`text-xs py-1.5 px-2 rounded-lg border transition ${
                config.position === pos
                  ? 'bg-emeraldbrand text-obsidian font-bold border-emeraldbrand'
                  : 'bg-graphite text-slate-300 border-borderdark'
              }`}
            >
              {t(`watermark.pos.${pos}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders: Size, Opacity, Angle */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>{t('watermark.size')}</span>
            <span className="text-emeraldbrand-soft">{config.fontSize}px</span>
          </div>
          <input
            type="range"
            min={14}
            max={68}
            value={config.fontSize}
            onChange={(e) => update({ fontSize: Number(e.target.value) })}
            className="w-full accent-emerald-500"
          />
        </div>
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>{t('watermark.opacity')}</span>
            <span className="text-emeraldbrand-soft">{Math.round(config.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={85}
            value={Math.round(config.opacity * 100)}
            onChange={(e) => update({ opacity: Number(e.target.value) / 100 })}
            className="w-full accent-emerald-500"
          />
        </div>
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>{t('watermark.rotation')}</span>
            <span className="text-emeraldbrand-soft">{config.rotation}°</span>
          </div>
          <input
            type="range"
            min={-60}
            max={60}
            value={config.rotation}
            onChange={(e) => update({ rotation: Number(e.target.value) })}
            className="w-full accent-emerald-500"
          />
        </div>
      </div>

      {/* Color + Font + Timestamp */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => update({ color: c })}
              aria-label={`Watermark color ${c}`}
              className={`w-6 h-6 rounded-full border-2 ${
                config.color === c ? 'border-emeraldbrand-bright scale-110' : 'border-borderdark'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <select
          value={config.fontFamily}
          onChange={(e) =>
            update({ fontFamily: e.target.value as WatermarkConfig['fontFamily'] })
          }
          className="bg-graphite border border-borderdark rounded-lg px-2.5 py-1 text-xs text-slate-200"
        >
          <option value="sans-serif">Sans</option>
          <option value="monospace">Mono</option>
          <option value="serif">Serif</option>
        </select>

        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={config.includeTimestamp}
            onChange={(e) => update({ includeTimestamp: e.target.checked })}
            className="accent-emerald-500 rounded"
          />
          {t('watermark.timestamp')}
        </label>
      </div>

      {/* Save & Saved Presets */}
      <div className="pt-2 border-t border-borderdark space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">{t('watermark.savedPresets')}</span>
          <button
            type="button"
            onClick={handleSavePreset}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emeraldbrand-bright hover:underline"
          >
            {savedToast ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            {savedToast ? t('watermark.presetSaved') : t('watermark.savePreset')}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <div
              key={p.id}
              className="inline-flex items-center gap-1 bg-graphite border border-borderdark rounded-lg pl-2.5 pr-1 py-1 text-xs text-slate-200"
            >
              <button
                type="button"
                onClick={() => onChange({ ...p.config, enabled: true })}
                className="hover:text-emeraldbrand-bright"
              >
                {p.name}
              </button>
              <button
                type="button"
                aria-label="Remove preset"
                onClick={() => setPresets(deleteWatermarkPreset(p.id))}
                className="p-0.5 text-slate-500 hover:text-red-400"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
