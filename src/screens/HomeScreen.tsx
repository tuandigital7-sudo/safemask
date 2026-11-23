import React from 'react';
import { ArrowRight, CheckSquare, Crown, Stamp } from 'lucide-react';
import type { ToolRoute } from '../types';
import { useI18n } from '../i18n/I18nContext';

interface HomeScreenProps {
  onOpenTool: (route: ToolRoute) => void;
  favorites?: ToolRoute[];
  onToggleFavorite?: (tool: ToolRoute) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenTool }) => {
  const { t } = useI18n();

  const cards: Array<{
    route: ToolRoute;
    titleKey: string;
    art: string;
  }> = [
    { route: 'image-shield', titleKey: 'tool.imageShield.title', art: '/art/card-image.webp' },
    { route: 'text-sanitizer', titleKey: 'tool.textSanitizer.title', art: '/art/card-ai.webp' },
    { route: 'pdf-shield', titleKey: 'tool.pdfShield.title', art: '/art/card-pdf.webp' },
    { route: 'smart-ocr', titleKey: 'tool.smartOcr.title', art: '/art/card-ocr.webp' },
    { route: 'metadata-cleaner', titleKey: 'tool.metadataCleaner.title', art: '/art/card-meta.webp' },
    { route: 'batch-shield', titleKey: 'tool.batchShield.title', art: '/art/card-batch.webp' },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
      {/* Visual-First Hero Banner — Fits cleanly with zero scroll */}
      <button
        type="button"
        onClick={() => onOpenTool('privacy-score')}
        className="w-full text-left relative overflow-hidden rounded-3xl border border-emeraldbrand/45 flex-[1.05] min-h-[118px] flex flex-col justify-between p-4 emerald-glow active:scale-[0.99] transition group"
      >
        <img
          src="/art/hero-score.webp"
          alt="SafeMask Privacy Score"
          className="absolute inset-0 w-full h-full object-cover object-right group-hover:scale-[1.03] transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian/95 via-obsidian/65 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian/75 via-transparent to-transparent" />

        <div className="relative z-10 inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full bg-obsidian/75 backdrop-blur-md border border-emeraldbrand/50 text-[10px] font-extrabold tracking-wider text-emeraldbrand-bright">
          <Crown className="w-3 h-3" />
          <span>0–100 PRO</span>
        </div>

        <div className="relative z-10 space-y-1.5 max-w-[66%]">
          <h1 className="text-lg font-extrabold text-white leading-tight tracking-tight">
            {t('tool.privacyScore.title')}
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emeraldbrand text-obsidian font-extrabold text-[11px] shadow-lg">
            <span>{t('score.pickBtn')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </button>

      {/* Compact Quick Action Pills */}
      <div className="shrink-0 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onOpenTool('watermark')}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-2xl bg-surface/90 border border-borderdark hover:border-emeraldbrand/50 text-xs font-bold text-slate-100 active:scale-[0.98] transition"
        >
          <Stamp className="w-3.5 h-3.5 text-emeraldbrand-bright shrink-0" />
          <span className="truncate">{t('tool.watermark.title')}</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenTool('privacy-check')}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-2xl bg-surface/90 border border-borderdark hover:border-emeraldbrand/50 text-xs font-bold text-slate-100 active:scale-[0.98] transition"
        >
          <CheckSquare className="w-3.5 h-3.5 text-emeraldbrand-bright shrink-0" />
          <span className="truncate">{t('tool.privacyCheck.title')}</span>
        </button>
      </div>

      {/* 6 Full-Bleed Visual 3D Tool Cards — Auto-fits exact viewport height (3 rows × 2 cols) */}
      <div className="flex-[2.55] min-h-0 grid grid-cols-2 grid-rows-3 gap-2.5">
        {cards.map((card) => (
          <button
            key={card.route}
            type="button"
            onClick={() => onOpenTool(card.route)}
            className="group relative w-full h-full min-h-0 rounded-2xl overflow-hidden border border-borderdark hover:border-emeraldbrand/60 active:scale-[0.97] transition-all text-left bg-graphite shadow-card"
          >
            <img
              src={card.art}
              alt={t(card.titleKey)}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian/95 via-obsidian/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 px-3 py-2.5">
              <div className="text-[13px] font-extrabold text-white tracking-tight leading-none drop-shadow">
                {t(card.titleKey)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
