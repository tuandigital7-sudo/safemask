export type Language = 'en' | 'vi';

export type MainTab = 'home' | 'history' | 'settings';

export type ToolRoute =
  | 'home'
  | 'image-shield'
  | 'smart-ocr'
  | 'text-sanitizer'
  | 'pdf-shield'
  | 'metadata-cleaner'
  | 'batch-shield'
  | 'privacy-check'
  | 'privacy-score'
  | 'watermark'
  | 'paywall'
  | 'legal-privacy'
  | 'legal-terms';

export type RedactionMode = 'blackout' | 'blur' | 'pixelate' | 'color';

export interface RedactionBox {
  id: string;
  /** Normalized coordinates (0..1) relative to image/page dimensions */
  x: number;
  y: number;
  width: number;
  height: number;
  mode: RedactionMode;
  color?: string;
  label?: string;
  source?: 'manual' | 'ocr';
  selected?: boolean;
}

export type WatermarkPosition = 'center' | 'diagonal' | 'tiled' | 'bottom-right' | 'top-left';

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  position: WatermarkPosition;
  fontSize: number; // relative 12..72
  opacity: number; // 0.08..0.85
  color: string;
  rotation: number; // degrees -60..60
  fontFamily: 'sans-serif' | 'monospace' | 'serif';
  includeTimestamp: boolean;
}

export interface SavedWatermarkPreset {
  id: string;
  name: string;
  config: WatermarkConfig;
}

export interface HistoryEntry {
  id: string;
  tool: ToolRoute;
  timestamp: number;
  itemCount: number;
  regionsRedacted?: number;
  noteKey?: string;
}

export type SensitiveEntityType =
  | 'PHONE'
  | 'EMAIL'
  | 'ID'
  | 'ACCOUNT'
  | 'ADDRESS'
  | 'DOB'
  | 'PASSPORT'
  | 'CARD'
  | 'CUSTOM';

export interface DetectedEntity {
  id: string;
  type: SensitiveEntityType;
  token: string;
  original: string;
  start: number;
  end: number;
  enabled: boolean;
}

export type BillingPlanId = 'weekly' | 'yearly' | 'lifetime';

export interface BillingPlan {
  id: BillingPlanId;
  priceUsd: number;
  displayPrice: string;
  periodKey: string;
  badgeKey?: string;
  savingsPercent?: number;
  storeProductId: {
    ios: string;
    android: string;
    web: string;
  };
}

export interface EntitlementState {
  isPro: boolean;
  activePlan: BillingPlanId | null;
  source: 'none' | 'dev_mock' | 'storekit' | 'play_billing' | 'web_billing';
  isProductionVerified: boolean;
}
