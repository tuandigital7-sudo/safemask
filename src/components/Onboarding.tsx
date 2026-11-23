import React, { useState } from 'react';
import { ShieldCheck, EyeOff, Smartphone, ArrowRight } from 'lucide-react';
import { SafeMaskLogo } from './Logo';
import { useI18n } from '../i18n/I18nContext';
import { trackEvent } from '../services/analytics';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { t, lang, setLang } = useI18n();
  const [step, setStep] = useState(0);

  const slides = [
    {
      icon: ShieldCheck,
      title: t('onboarding.step1.title'),
      desc: t('onboarding.step1.desc'),
    },
    {
      icon: EyeOff,
      title: t('onboarding.step2.title'),
      desc: t('onboarding.step2.desc'),
    },
    {
      icon: Smartphone,
      title: t('onboarding.step3.title'),
      desc: t('onboarding.step3.desc'),
    },
  ];

  const finish = () => {
    trackEvent('onboarding_complete', { lang });
    onComplete();
  };

  const Icon = slides[step].icon;

  return (
    <div className="h-[100dvh] overflow-hidden bg-obsidian text-slate-100 flex flex-col justify-between px-6 py-6 safe-top safe-bottom max-w-md mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <SafeMaskLogo size={34} />
          <span className="font-bold tracking-tight text-lg text-white">{t('app.name')}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
            className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface border border-borderdark text-slate-300 hover:border-emeraldbrand/60 transition"
          >
            {lang === 'vi' ? 'EN' : 'VI'}
          </button>
          <button
            type="button"
            onClick={finish}
            className="text-sm text-slate-400 hover:text-white transition"
          >
            {t('onboarding.skip')}
          </button>
        </div>
      </div>

      {/* Center Visual */}
      <div className="flex flex-col items-center text-center my-auto py-8">
        <div className="relative mb-8">
          <div className="w-40 h-40 rounded-[36px] bg-gradient-to-b from-emeraldbrand/20 to-surface border border-emeraldbrand/40 flex items-center justify-center emerald-glow">
            <Icon className="w-16 h-16 text-emeraldbrand-bright" strokeWidth={1.6} />
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white mb-3 leading-tight">
          {slides[step].title}
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
          {slides[step].desc}
        </p>

        {/* Progress Dots */}
        <div className="flex items-center gap-2 mt-8">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Slide ${idx + 1}`}
              onClick={() => setStep(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === step ? 'w-8 bg-emeraldbrand-bright' : 'w-2 bg-borderdark'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="space-y-3">
        {step < slides.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="w-full py-3.5 rounded-2xl bg-emeraldbrand hover:bg-emeraldbrand-soft text-obsidian font-bold text-base flex items-center justify-center gap-2 transition active:scale-[0.99]"
          >
            <span>{t('onboarding.next')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            className="w-full py-3.5 rounded-2xl bg-emeraldbrand hover:bg-emeraldbrand-soft text-obsidian font-bold text-base flex items-center justify-center gap-2 transition active:scale-[0.99] emerald-glow"
          >
            <span>{t('onboarding.start')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
