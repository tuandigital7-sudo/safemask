import type { BillingPlan } from '../types';

export interface PricingConfig {
  currency: string;
  freeLimits: {
    batchMaxImages: number;
    pdfMaxPagesFree: number;
    maxSavedWatermarksFree: number;
  };
  proLimits: {
    batchMaxImages: number;
    pdfMaxPages: number;
    maxSavedWatermarks: number;
  };
  plans: BillingPlan[];
}

/**
 * Balanced Free + Pro configuration (US / Global Primary Market).
 * Free stays genuinely useful; Pro unlocks clean unbranded exports, unlimited scale & speed.
 */
export const PRICING_CONFIG: PricingConfig = {
  currency: 'USD',
  freeLimits: {
    batchMaxImages: 3,
    pdfMaxPagesFree: 3,
    maxSavedWatermarksFree: 2,
  },
  proLimits: {
    batchMaxImages: 30,
    pdfMaxPages: 100,
    maxSavedWatermarks: 25,
  },
  plans: [
    {
      id: 'weekly',
      priceUsd: 4.99,
      displayPrice: '$4.99',
      periodKey: 'paywall.perWeekTrial',
      storeProductId: {
        ios: 'com.safemask.privacy.pro.weekly',
        android: 'safemask_pro_weekly',
        web: 'price_safemask_weekly',
      },
    },
    {
      id: 'yearly',
      priceUsd: 29.99,
      displayPrice: '$29.99',
      periodKey: 'paywall.perYear',
      badgeKey: 'paywall.bestValue',
      savingsPercent: 88,
      storeProductId: {
        ios: 'com.safemask.privacy.pro.yearly',
        android: 'safemask_pro_yearly',
        web: 'price_safemask_yearly',
      },
    },
    {
      id: 'lifetime',
      priceUsd: 49.99,
      displayPrice: '$49.99',
      periodKey: 'paywall.oneTime',
      badgeKey: 'paywall.forever',
      storeProductId: {
        ios: 'com.safemask.privacy.pro.lifetime',
        android: 'safemask_pro_lifetime',
        web: 'price_safemask_lifetime',
      },
    },
  ],
};
