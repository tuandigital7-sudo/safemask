import { Capacitor } from '@capacitor/core';
import type { BillingPlanId, EntitlementState } from '../../types';
import { PRICING_CONFIG } from '../../config/pricing';
import { trackEvent } from '../analytics';

export interface PurchaseResult {
  status: 'purchased' | 'cancelled' | 'not_configured' | 'error';
  entitlement?: EntitlementState;
  message?: string;
}

export interface BillingAdapter {
  readonly name: string;
  readonly isProductionReady: boolean;
  getEntitlement(): Promise<EntitlementState>;
  purchase(planId: BillingPlanId): Promise<PurchaseResult>;
  restore(): Promise<PurchaseResult>;
  resetDevMock?(): Promise<EntitlementState>;
}

const DEV_STORAGE_KEY = 'safemask_dev_entitlement_v1';

/**
 * Development-only mock billing adapter.
 * Strictly disabled in production builds unless explicitly running in Vite DEV mode.
 * Clearly marks `isProductionVerified: false`.
 */
class DevMockBillingAdapter implements BillingAdapter {
  readonly name = 'DevMockBillingAdapter';
  readonly isProductionReady = false;

  async getEntitlement(): Promise<EntitlementState> {
    try {
      const raw = localStorage.getItem(DEV_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as EntitlementState;
        return { ...parsed, isProductionVerified: false };
      }
    } catch {
      // ignore
    }
    return {
      isPro: false,
      activePlan: null,
      source: 'none',
      isProductionVerified: false,
    };
  }

  async purchase(planId: BillingPlanId): Promise<PurchaseResult> {
    const plan = PRICING_CONFIG.plans.find((p) => p.id === planId);
    if (!plan) {
      return { status: 'error', message: 'Invalid plan ID' };
    }
    const entitlement: EntitlementState = {
      isPro: true,
      activePlan: planId,
      source: 'dev_mock',
      isProductionVerified: false,
    };
    try {
      localStorage.setItem(DEV_STORAGE_KEY, JSON.stringify(entitlement));
    } catch {
      // ignore
    }
    trackEvent('pro_conversion', { plan: planId, platform: 'dev_mock', success: true });
    return {
      status: 'purchased',
      entitlement,
      message: 'DEV_MOCK_ACTIVE',
    };
  }

  async restore(): Promise<PurchaseResult> {
    const entitlement = await this.getEntitlement();
    trackEvent('restore_purchases', { success: entitlement.isPro, platform: 'dev_mock' });
    return {
      status: entitlement.isPro ? 'purchased' : 'cancelled',
      entitlement,
      message: entitlement.isPro ? 'DEV_MOCK_RESTORED' : 'NO_PURCHASE_FOUND',
    };
  }

  async resetDevMock(): Promise<EntitlementState> {
    try {
      localStorage.removeItem(DEV_STORAGE_KEY);
    } catch {
      // ignore
    }
    return {
      isPro: false,
      activePlan: null,
      source: 'none',
      isProductionVerified: false,
    };
  }
}

/**
 * Production Store Adapter Skeleton (Apple StoreKit / Google Play Billing / Web Billing).
 * Requires store credentials & RevenueCat/StoreKit plugin keys before real transactions can execute.
 * Does NOT fake production purchases.
 */
class UnconfiguredProductionBillingAdapter implements BillingAdapter {
  readonly name: string;
  readonly isProductionReady = false;

  constructor(platform: 'ios' | 'android' | 'web') {
    this.name =
      platform === 'ios'
        ? 'StoreKitAdapter (Awaiting Credentials)'
        : platform === 'android'
        ? 'PlayBillingAdapter (Awaiting Credentials)'
        : 'WebBillingAdapter (Awaiting Credentials)';
  }

  async getEntitlement(): Promise<EntitlementState> {
    return {
      isPro: false,
      activePlan: null,
      source: 'none',
      isProductionVerified: false,
    };
  }

  async purchase(_planId: BillingPlanId): Promise<PurchaseResult> {
    return {
      status: 'not_configured',
      message: 'BILLING_CREDENTIALS_REQUIRED',
    };
  }

  async restore(): Promise<PurchaseResult> {
    trackEvent('restore_purchases', { success: false });
    return {
      status: 'not_configured',
      message: 'BILLING_CREDENTIALS_REQUIRED',
    };
  }
}

export function createBillingAdapter(): BillingAdapter {
  const isDev = import.meta.env.DEV || import.meta.env.MODE === 'test';
  if (isDev) {
    return new DevMockBillingAdapter();
  }
  const platform = Capacitor.getPlatform();
  if (platform === 'ios') return new UnconfiguredProductionBillingAdapter('ios');
  if (platform === 'android') return new UnconfiguredProductionBillingAdapter('android');
  return new UnconfiguredProductionBillingAdapter('web');
}

export const billingService: BillingAdapter = createBillingAdapter();
