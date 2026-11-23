import React, { useEffect, useState } from 'react';
import { Check, Crown, Info, RotateCcw, Shield, X } from 'lucide-react';
import type { BillingPlanId, EntitlementState, ToolRoute } from '../types';
import { PRICING_CONFIG } from '../config/pricing';
import { useI18n } from '../i18n/I18nContext';
import { billingService } from '../services/billing/BillingService';
import { trackEvent } from '../services/analytics';

interface PaywallScreenProps {
  entitlement: EntitlementState;
  onEntitlementChange: (next: EntitlementState) => void;
  onClose: () => void;
  onNavigate: (route: ToolRoute) => void;
}

export const PaywallScreen: React.FC<PaywallScreenProps> = ({
  entitlement,
  onEntitlementChange,
  onClose,
  onNavigate,
}) => {
  const { t } = useI18n();
  const [selectedPlan, setSelectedPlan] = useState<BillingPlanId>('yearly');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    trackEvent('paywall_view');
  }, []);

  const handlePurchase = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await billingService.purchase(selectedPlan);
      if (res.status === 'purchased' && res.entitlement) {
        onEntitlementChange(res.entitlement);
        setFeedback(t('paywall.activated'));
      } else if (res.status === 'not_configured') {
        setFeedback(t('paywall.notConfigured'));
      } else {
        setFeedback(res.message || 'Purchase cancelled');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await billingService.restore();
      if (res.status === 'purchased' && res.entitlement) {
        onEntitlementChange(res.entitlement);
        setFeedback(t('paywall.activated'));
      } else if (res.status === 'not_configured') {
        setFeedback(t('paywall.notConfigured'));
      } else {
        setFeedback(res.message || 'No active purchase found.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDevReset = async () => {
    if (billingService.resetDevMock) {
      const next = await billingService.resetDevMock();
      onEntitlementChange(next);
      setFeedback(null);
    }
  };

  const comparisons = [
    { key: 'paywall.feat.manual', free: true, pro: true },
    { key: 'paywall.feat.basicText', free: true, pro: true },
    { key: 'paywall.feat.ocr', free: false, pro: true },
    { key: 'paywall.feat.pdf', free: false, pro: true },
    { key: 'paywall.feat.batch', free: false, pro: true },
    { key: 'paywall.feat.watermark', free: false, pro: true },
  ];

  return (
    <div className="space-y-5 pb-6">
      {/* Hero */}
      <div className="relative glass-panel rounded-3xl p-6 text-center space-y-3 overflow-hidden">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-emeraldbrand/20 border border-emeraldbrand/50 flex items-center justify-center emerald-glow">
          <Crown className="w-7 h-7 text-emeraldbrand-bright" />
        </div>
        <h2 className="text-xl font-bold text-white">{t('paywall.title')}</h2>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">{t('paywall.subtitle')}</p>
      </div>

      {/* Honest Dev Mode Notice */}
      {!billingService.isProductionReady && (
        <div className="flex items-start gap-2.5 text-[11px] text-amber-200 bg-amber-500/10 border border-amber-500/35 rounded-2xl p-3.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>{t('paywall.devBanner')}</span>
        </div>
      )}

      {/* Plan Selector (Config-driven, no fake countdowns) */}
      <div className="space-y-2.5">
        {PRICING_CONFIG.plans.map((plan) => {
          const active = selectedPlan === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlan(plan.id)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition ${
                active
                  ? 'bg-emeraldbrand/15 border-emeraldbrand emerald-glow'
                  : 'bg-surface border-borderdark hover:border-slate-500'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white capitalize">{plan.id}</span>
                  {plan.badgeKey && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emeraldbrand text-obsidian">
                      {t(plan.badgeKey)}
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">{t(plan.periodKey)}</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-extrabold text-white">{plan.displayPrice}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Free vs Pro Comparison Table */}
      <div className="bg-surface border border-borderdark rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-2.5 bg-graphite text-[11px] font-bold text-slate-400 border-b border-borderdark">
          <div className="col-span-8">{t('paywall.feature')}</div>
          <div className="col-span-2 text-center">{t('common.freeBadge')}</div>
          <div className="col-span-2 text-center text-emeraldbrand-bright">{t('common.proBadge')}</div>
        </div>
        <div className="divide-y divide-borderdark/60 text-xs">
          {comparisons.map((row) => (
            <div key={row.key} className="grid grid-cols-12 items-center px-4 py-2.5">
              <div className="col-span-8 text-slate-200 pr-2">{t(row.key)}</div>
              <div className="col-span-2 flex justify-center">
                {row.free ? (
                  <Check className="w-4 h-4 text-slate-400" />
                ) : (
                  <X className="w-4 h-4 text-slate-600" />
                )}
              </div>
              <div className="col-span-2 flex justify-center">
                <Check className="w-4 h-4 text-emeraldbrand-bright" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {feedback && (
        <div className="text-xs text-emeraldbrand-bright bg-emeraldbrand/10 border border-emeraldbrand/35 rounded-xl p-3 text-center">
          {feedback}
        </div>
      )}

      {/* Primary Action */}
      <div className="space-y-2.5">
        <button
          type="button"
          disabled={busy}
          onClick={handlePurchase}
          className="w-full py-3.5 rounded-2xl bg-emeraldbrand hover:bg-emeraldbrand-soft text-obsidian font-bold text-base flex items-center justify-center gap-2 emerald-glow disabled:opacity-50"
        >
          <Shield className="w-4 h-4" />
          {t('paywall.cta')}
        </button>

        <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pt-1">
          <button
            type="button"
            disabled={busy}
            onClick={handleRestore}
            className="hover:text-white underline"
          >
            {t('paywall.restore')}
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => onNavigate('legal-privacy')}
            className="hover:text-white underline"
          >
            {t('settings.privacyPolicy')}
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => onNavigate('legal-terms')}
            className="hover:text-white underline"
          >
            {t('settings.terms')}
          </button>
        </div>

        {entitlement.isPro && entitlement.source === 'dev_mock' && (
          <button
            type="button"
            onClick={handleDevReset}
            className="w-full py-2 rounded-xl bg-graphite border border-borderdark text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t('paywall.resetDev')}
          </button>
        )}

        <p className="text-[11px] text-center text-slate-500">{t('paywall.termsNote')}</p>
      </div>
    </div>
  );
};
