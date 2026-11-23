import React, { useState } from 'react';
import { Clock, ShieldCheck, Trash2 } from 'lucide-react';
import type { HistoryEntry, ToolRoute } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { clearAllHistory, getHistory, removeHistoryEntry } from '../services/history';

interface HistoryScreenProps {
  onOpenTool: (route: ToolRoute) => void;
}

const TOOL_TITLE_MAP: Partial<Record<ToolRoute, string>> = {
  'image-shield': 'tool.imageShield.title',
  'text-sanitizer': 'tool.textSanitizer.title',
  'pdf-shield': 'tool.pdfShield.title',
  'smart-ocr': 'tool.smartOcr.title',
  'metadata-cleaner': 'tool.metadataCleaner.title',
  'batch-shield': 'tool.batchShield.title',
  watermark: 'tool.watermark.title',
  'privacy-check': 'tool.privacyCheck.title',
  'privacy-score': 'tool.privacyScore.title',
};

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onOpenTool }) => {
  const { t } = useI18n();
  const [items, setItems] = useState<HistoryEntry[]>(() => getHistory());

  const handleClear = () => {
    clearAllHistory();
    setItems([]);
  };

  const handleRemove = (id: string) => {
    removeHistoryEntry(id);
    setItems(getHistory());
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{t('history.title')}</h2>
          <p className="text-xs text-slate-400">{t('history.subtitle')}</p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs font-semibold text-red-400 hover:underline shrink-0"
          >
            {t('history.clearAll')}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="glass-panel rounded-3xl p-8 text-center space-y-3 mt-4">
          <Clock className="w-10 h-10 text-slate-500 mx-auto" />
          <p className="text-xs text-slate-400">{t('history.empty')}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between bg-surface border border-borderdark rounded-2xl px-4 py-3"
            >
              <button
                type="button"
                onClick={() => onOpenTool(item.tool)}
                className="flex items-center gap-3 text-left min-w-0 flex-1"
              >
                <div className="w-9 h-9 rounded-xl bg-emeraldbrand/15 text-emeraldbrand-bright flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    {t(TOOL_TITLE_MAP[item.tool] || 'app.name')}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {new Date(item.timestamp).toLocaleString()} • {item.itemCount}{' '}
                    {t('history.items')}
                    {typeof item.regionsRedacted === 'number' &&
                      ` • ${item.regionsRedacted} ${t('history.regions')}`}
                  </div>
                </div>
              </button>
              <button
                type="button"
                aria-label="Delete history item"
                onClick={() => handleRemove(item.id)}
                className="p-2 text-slate-500 hover:text-red-400 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
