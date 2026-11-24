import React, { useState } from 'react';
import {
  ChevronRight,
  Crown,
  ExternalLink,
  Globe,
  Shield,
  Trash2,
  WifiOff,
} from 'lucide-react';
import type { EntitlementState, ToolRoute } from '../types';
import { useI18n } from '../i18n/I18nContext';
import {
  clearLocalAnalytics,
  getAnalyticsConsent,
  setAnalyticsConsent,
} from '../services/analytics';
import { clearAllHistory } from '../services/history';
import { ENABLE_STORE_PAYWALL } from '../config/pricing';

interface SettingsScreenProps {
  entitlement: EntitlementState;
  onNavigate: (route: ToolRoute) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ entitlement, onNavigate }) => {
  const { t, lang, setLang } = useI18n();
  const [analyticsOn, setAnalyticsOn] = useState<boolean>(() => getAnalyticsConsent());
  const [clearedToast, setClearedToast] = useState(false);

  const toggleAnalytics = () => {
    const next = !analyticsOn;
    setAnalyticsOn(next);
    setAnalyticsConsent(next);
  };

  const handleClearData = () => {
    clearAllHistory();
    clearLocalAnalytics();
    setClearedToast(true);
    setTimeout(() => setClearedToast(false), 2000);
  };

  return (
    <div className="space-y-4 pb-6">
      <h2 className="text-lg font-bold text-white">{t('settings.title')}</h2>

      {/* Pro Card (Hidden in v1.0.0 Early Access until StoreKit 2 IAP is enabled in v1.1) */}
      {ENABLE_STORE_PAYWALL && (
        <button
          type="button"
          onClick={() => onNavigate('paywall')}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emeraldbrand/20 to-surface border border-emeraldbrand/50 text-left emerald-glow"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emeraldbrand/20 flex items-center justify-center text-emeraldbrand-bright">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">{t('settings.proSection')}</div>
              <div className="text-xs text-emeraldbrand-soft">
                {entitlement.isPro ? t('settings.proStatusActive') : t('settings.proStatusFree')}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-emeraldbrand-bright" />
        </button>
      )}

      {/* Language Switcher */}
      <div className="bg-surface border border-borderdark rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-sm font-semibold text-white">
          <Globe className="w-4 h-4 text-emeraldbrand-bright" />
          <span>{t('settings.language')}</span>
        </div>
        <div className="flex items-center gap-1 bg-graphite p-1 rounded-xl border border-borderdark">
          <button
            type="button"
            onClick={() => setLang('vi')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              lang === 'vi' ? 'bg-emeraldbrand text-obsidian' : 'text-slate-400'
            }`}
          >
            Tiếng Việt
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              lang === 'en' ? 'bg-emeraldbrand text-obsidian' : 'text-slate-400'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Privacy & Analytics Consent */}
      <div className="bg-surface border border-borderdark rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Shield className="w-3.5 h-3.5 text-emeraldbrand-bright" />
          <span>{t('settings.privacySection')}</span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white">{t('settings.analyticsToggle')}</div>
            <div className="text-xs text-slate-400 mt-0.5">{t('settings.analyticsDesc')}</div>
          </div>
          <button
            type="button"
            onClick={toggleAnalytics}
            aria-label="Toggle anonymous local analytics"
            className={`w-11 h-6 rounded-full p-0.5 shrink-0 transition-colors ${
              analyticsOn ? 'bg-emeraldbrand' : 'bg-graphite border border-borderdark'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                analyticsOn ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Honest Network Separation Transparency */}
      <div className="bg-surface border border-borderdark rounded-2xl p-4 space-y-2 text-xs text-slate-300">
        <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-slate-400">
          <WifiOff className="w-3.5 h-3.5 text-emeraldbrand-bright" />
          <span>{t('settings.networkSection')}</span>
        </div>
        <ul className="space-y-1.5 list-disc pl-4 text-slate-400">
          <li>{t('settings.networkCore')}</li>
          <li>{t('settings.networkOcr')}</li>
          <li>{t('settings.networkBilling')}</li>
        </ul>
      </div>

      {/* Legal & Clear Data */}
      <div className="bg-surface border border-borderdark rounded-2xl divide-y divide-borderdark text-sm">
        <button
          type="button"
          onClick={() => onNavigate('legal-privacy')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-slate-200 hover:text-white"
        >
          <span>{t('settings.privacyPolicy')}</span>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
        <button
          type="button"
          onClick={() => onNavigate('legal-terms')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-slate-200 hover:text-white"
        >
          <span>{t('settings.terms')}</span>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
        <a
          href={`https://safemask.tuandigital.vn/?lang=${lang}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full px-4 py-3.5 flex items-center justify-between text-slate-200 hover:text-white"
        >
          <span>{t('settings.website')}</span>
          <ExternalLink className="w-4 h-4 text-slate-500" />
        </a>
        <button
          type="button"
          onClick={handleClearData}
          className="w-full px-4 py-3.5 flex items-center justify-between text-red-400 hover:text-red-300"
        >
          <span className="inline-flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            {clearedToast ? t('settings.cleared') : t('settings.clearData')}
          </span>
        </button>
      </div>

      <p className="text-center text-[11px] text-slate-500">
        SafeMask • {t('settings.version')}
      </p>
    </div>
  );
};
