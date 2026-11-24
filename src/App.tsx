import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Crown,
  Home,
  Settings,
  Download,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import type { EntitlementState, MainTab, ToolRoute } from './types';
import { useI18n } from './i18n/I18nContext';
import { SafeMaskLogo } from './components/Logo';
import { Onboarding } from './components/Onboarding';
import { HomeScreen } from './screens/HomeScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ImageShieldScreen } from './screens/ImageShieldScreen';
import { SmartOcrScreen } from './screens/SmartOcrScreen';
import { TextSanitizerScreen } from './screens/TextSanitizerScreen';
import { PdfShieldScreen } from './screens/PdfShieldScreen';
import { MetadataCleanerScreen } from './screens/MetadataCleanerScreen';
import { BatchShieldScreen } from './screens/BatchShieldScreen';
import { PrivacyCheckScreen } from './screens/PrivacyCheckScreen';
import { PrivacyScoreScreen } from './screens/PrivacyScoreScreen';
import { PaywallScreen } from './screens/PaywallScreen';
import { LegalScreen } from './screens/LegalScreen';
import { billingService } from './services/billing/BillingService';
import { ENABLE_STORE_PAYWALL } from './config/pricing';
import { trackEvent } from './services/analytics';
import { getFavoriteTools, toggleFavoriteTool } from './services/history';

const ONBOARDING_KEY = 'safemask_onboarding_done_v1';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const App: React.FC = () => {
  const { t, lang } = useI18n();
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ONBOARDING_KEY) !== 'true';
    } catch {
      return false;
    }
  });

  const [tab, setTab] = useState<MainTab>('home');
  const [route, setRoute] = useState<ToolRoute>('home');
  const [favorites, setFavorites] = useState<ToolRoute[]>(() => getFavoriteTools());
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const [entitlement, setEntitlement] = useState<EntitlementState>({
    isPro: !ENABLE_STORE_PAYWALL,
    activePlan: null,
    source: 'none',
    isProductionVerified: false,
  });

  useEffect(() => {
    trackEvent('app_open', { lang, platform: Capacitor.getPlatform() });
    if (ENABLE_STORE_PAYWALL) {
      billingService.getEntitlement().then(setEntitlement);
    }

    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#080A0D' }).catch(() => {});
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const completeOnboarding = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {
      // ignore
    }
    setShowOnboarding(false);
  };

  const openTool = (next: ToolRoute) => {
    setRoute(next);
    if (next !== 'home') {
      trackEvent('feature_usage', { tool: next });
    }
  };

  const handleInstallPwa = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  };

  if (showOnboarding) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  const isSubScreen = route !== 'home';

  const getHeaderTitle = (): string => {
    switch (route) {
      case 'image-shield':
        return t('image.title');
      case 'smart-ocr':
        return t('ocr.title');
      case 'text-sanitizer':
        return t('text.title');
      case 'pdf-shield':
        return t('pdf.title');
      case 'metadata-cleaner':
        return t('meta.title');
      case 'batch-shield':
        return t('batch.title');
      case 'privacy-check':
        return t('check.title');
      case 'privacy-score':
        return t('score.title');
      case 'watermark':
        return t('watermark.title');
      case 'paywall':
        return t('paywall.title');
      case 'legal-privacy':
        return t('settings.privacyPolicy');
      case 'legal-terms':
        return t('settings.terms');
      default:
        return t('app.name');
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-obsidian text-slate-100 flex flex-col max-w-lg mx-auto relative overflow-hidden">
      {/* Top App Bar */}
      <header className="shrink-0 z-30 bg-obsidian/95 backdrop-blur-md border-b border-borderdark/70 px-4 py-2.5 safe-top flex items-center justify-between">
        {isSubScreen ? (
          <button
            type="button"
            onClick={() => setRoute('home')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 text-emeraldbrand-bright" />
            <span className="truncate max-w-[220px]">{getHeaderTitle()}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <SafeMaskLogo size={32} />
            <span className="font-extrabold tracking-tight text-lg text-white">
              {t('app.name')}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {installPrompt && !isSubScreen && (
            <button
              type="button"
              onClick={handleInstallPwa}
              className="px-2.5 py-1 rounded-full bg-surface border border-emeraldbrand/50 text-[11px] font-bold text-emeraldbrand-bright inline-flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              PWA
            </button>
          )}
          {ENABLE_STORE_PAYWALL && (
            <button
              type="button"
              onClick={() => openTool('paywall')}
              className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 transition ${
                entitlement.isPro
                  ? 'bg-emeraldbrand/20 text-emeraldbrand-bright border border-emeraldbrand/50'
                  : 'bg-surface text-emeraldbrand-bright border border-borderdark hover:border-emeraldbrand/60'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>{t('nav.pro')}</span>
            </button>
          )}
          {!isSubScreen && (
            <button
              type="button"
              aria-label={t('nav.settings')}
              onClick={() => {
                setRoute('home');
                setTab('settings');
              }}
              className="p-2 rounded-xl bg-surface border border-borderdark text-slate-300 hover:text-white"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main
        className={`flex-1 min-h-0 px-4 pt-2.5 ${
          route === 'home' && tab === 'home'
            ? 'pb-2 overflow-hidden flex flex-col'
            : isSubScreen
            ? 'pb-24 overflow-y-auto'
            : 'pb-4 overflow-y-auto'
        }`}
      >
        {route === 'home' && tab === 'home' && (
          <HomeScreen
            onOpenTool={openTool}
            favorites={favorites}
            onToggleFavorite={(tool) => setFavorites(toggleFavoriteTool(tool))}
          />
        )}
        {route === 'home' && tab === 'history' && <HistoryScreen onOpenTool={openTool} />}
        {route === 'home' && tab === 'settings' && (
          <SettingsScreen entitlement={entitlement} onNavigate={openTool} />
        )}

        {route === 'image-shield' && (
          <ImageShieldScreen isPro={entitlement.isPro} onOpenPaywall={() => openTool('paywall')} />
        )}
        {route === 'watermark' && (
          <ImageShieldScreen
            initialWatermarkOpen
            isPro={entitlement.isPro}
            onOpenPaywall={() => openTool('paywall')}
          />
        )}
        {route === 'smart-ocr' && <SmartOcrScreen isPro={entitlement.isPro} />}
        {route === 'text-sanitizer' && <TextSanitizerScreen />}
        {route === 'pdf-shield' && (
          <PdfShieldScreen isPro={entitlement.isPro} onOpenPaywall={() => openTool('paywall')} />
        )}
        {route === 'metadata-cleaner' && <MetadataCleanerScreen />}
        {route === 'batch-shield' && (
          <BatchShieldScreen isPro={entitlement.isPro} onOpenPaywall={() => openTool('paywall')} />
        )}
        {route === 'privacy-check' && <PrivacyCheckScreen onNavigate={openTool} />}
        {route === 'privacy-score' && (
          <PrivacyScoreScreen
            isPro={entitlement.isPro}
            onOpenPaywall={() => openTool('paywall')}
          />
        )}
        {route === 'paywall' && (
          <PaywallScreen
            entitlement={entitlement}
            onEntitlementChange={setEntitlement}
            onClose={() => setRoute('home')}
            onNavigate={openTool}
          />
        )}
        {route === 'legal-privacy' && <LegalScreen kind="privacy" />}
        {route === 'legal-terms' && <LegalScreen kind="terms" />}
      </main>

      {/* Bottom Tab Bar (Mobile-First One-Hand Ergonomics) */}
      {!isSubScreen && (
        <nav className="shrink-0 z-30 bg-graphite/95 backdrop-blur-lg border-t border-borderdark safe-bottom">
          <div className="max-w-lg mx-auto grid grid-cols-3 px-4 py-1.5">
            {(
              [
                { id: 'home', label: t('nav.home'), icon: Home },
                { id: 'history', label: t('nav.history'), icon: Clock },
                { id: 'settings', label: t('nav.settings'), icon: Settings },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-2xl transition ${
                    active ? 'text-emeraldbrand-bright' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 1.8} />
                  <span className="text-[11px] font-semibold">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};
