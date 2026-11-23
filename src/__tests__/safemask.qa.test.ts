import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildSanitizedOutput,
  restoreSanitizedText,
  scanSensitiveText,
} from '../engines/textSanitizerEngine';
import {
  getLocalAnalyticsEvents,
  sanitizeAnalyticsProps,
  setAnalyticsConsent,
  trackEvent,
} from '../services/analytics';
import { billingService } from '../services/billing/BillingService';
import { PRICING_CONFIG } from '../config/pricing';
import {
  addHistoryEntry,
  clearAllHistory,
  getHistory,
  saveWatermarkPreset,
  deleteWatermarkPreset,
  getSavedWatermarkPresets,
} from '../services/history';
import { translations } from '../i18n/translations';
import { inspectImageMetadata } from '../engines/metadataEngine';
import { computeScoreFromFindings } from '../engines/privacyScoreEngine';

describe('SafeMask QA Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. AI Privacy Copy – Text Sanitizer', () => {
    it('detects and masks Vietnamese phone, email, CCCD, bank account, and address', () => {
      const sample =
        'Liên hệ tôi qua 0987654321, email abc@gmail.com. CCCD: 034092001234, STK: 19034567890123. Địa chỉ: 45 Lê Lợi, Thái Bình.';
      const entities = scanSensitiveText(sample);
      const { sanitizedText, tokenToOriginal } = buildSanitizedOutput(sample, entities);

      expect(sanitizedText).toContain('[PHONE_1]');
      expect(sanitizedText).toContain('[EMAIL_1]');
      expect(sanitizedText).toContain('[ID_1]');
      expect(sanitizedText).toContain('[ACCOUNT_1]');
      expect(sanitizedText).toContain('[ADDRESS_1]');
      expect(sanitizedText).not.toContain('0987654321');
      expect(sanitizedText).not.toContain('abc@gmail.com');
      expect(sanitizedText).not.toContain('034092001234');

      // Restores exact original text from in-memory mapping
      const restored = restoreSanitizedText(sanitizedText, tokenToOriginal);
      expect(restored).toBe(sample);

      // Must NEVER persist sensitive text or mapping to localStorage
      expect(localStorage.length).toBe(0);
    });

    it('detects US SSN, US phone numbers, and global emails for English primary market', () => {
      const sample = 'Call (415) 555-0198 or email jane.doe@acme.com. SSN: 123-45-6789.';
      const entities = scanSensitiveText(sample);
      const { sanitizedText, tokenToOriginal } = buildSanitizedOutput(sample, entities);

      expect(sanitizedText).toContain('[PHONE_1]');
      expect(sanitizedText).toContain('[EMAIL_1]');
      expect(sanitizedText).toContain('[ID_1]');
      expect(sanitizedText).not.toContain('123-45-6789');
      expect(sanitizedText).not.toContain('(415) 555-0198');
      expect(restoreSanitizedText(sanitizedText, tokenToOriginal)).toBe(sample);
    });

    it('supports selective entity toggle and custom terms', () => {
      const text = 'Contact 0987654321 about ProjectApollo and test@demo.io';
      const entities = scanSensitiveText(text, ['ProjectApollo']);
      expect(entities.some((e) => e.type === 'CUSTOM' && e.original === 'ProjectApollo')).toBe(true);

      // Disable email masking
      const toggled = entities.map((e) =>
        e.type === 'EMAIL' ? { ...e, enabled: false } : e
      );
      const { sanitizedText } = buildSanitizedOutput(text, toggled);
      expect(sanitizedText).toContain('[PHONE_1]');
      expect(sanitizedText).toContain('[CUSTOM_1]');
      expect(sanitizedText).toContain('test@demo.io');
    });
  });

  describe('2. Privacy-First Analytics Guard', () => {
    it('strips all sensitive properties and allows only safe metadata keys', () => {
      const clean = sanitizeAnalyticsProps({
        tool: 'image-shield',
        count: 3,
        phone: '0987654321',
        email: 'secret@example.com',
        cccd: '034092001234',
        gps: '20.44, 106.33',
        text: 'confidential contract',
        image: 'data:image/png;base64,...',
      });

      expect(clean).toEqual({ tool: 'image-shield', count: 3 });
    });

    it('respects user opt-out consent and wipes local logs', () => {
      setAnalyticsConsent(true);
      trackEvent('app_open', { lang: 'vi' });
      expect(getLocalAnalyticsEvents().length).toBe(1);

      setAnalyticsConsent(false);
      expect(getLocalAnalyticsEvents().length).toBe(0);
      const blocked = trackEvent('image_import', { tool: 'image-shield' });
      expect(blocked).toBeNull();
    });
  });

  describe('3. Monetization & Dev Billing Adapter', () => {
    it('loads configurable pricing plans without hard-coding', () => {
      expect(PRICING_CONFIG.plans.map((p) => p.id)).toEqual(['weekly', 'yearly', 'lifetime']);
      expect(PRICING_CONFIG.plans[0].priceUsd).toBe(4.99);
      expect(PRICING_CONFIG.plans[1].priceUsd).toBe(29.99);
      expect(PRICING_CONFIG.plans[2].priceUsd).toBe(49.99);
    });

    it('supports purchase, restore, and reset in DevMockBillingAdapter with honest flags', async () => {
      const initial = await billingService.getEntitlement();
      expect(initial.isPro).toBe(false);
      expect(initial.isProductionVerified).toBe(false);

      const res = await billingService.purchase('yearly');
      expect(res.status).toBe('purchased');
      expect(res.entitlement?.isPro).toBe(true);
      expect(res.entitlement?.activePlan).toBe('yearly');
      expect(res.entitlement?.isProductionVerified).toBe(false);

      const restored = await billingService.restore();
      expect(restored.status).toBe('purchased');

      if (billingService.resetDevMock) {
        const reset = await billingService.resetDevMock();
        expect(reset.isPro).toBe(false);
      }
    });
  });

  describe('4. Metadata-Only History & Saved Watermark Presets', () => {
    it('stores minimal history metadata and clears cleanly', () => {
      addHistoryEntry({ tool: 'image-shield', itemCount: 1, regionsRedacted: 4 });
      addHistoryEntry({ tool: 'pdf-shield', itemCount: 2, regionsRedacted: 3 });
      expect(getHistory().length).toBe(2);

      clearAllHistory();
      expect(getHistory().length).toBe(0);
    });

    it('saves and deletes custom watermark presets', () => {
      const before = getSavedWatermarkPresets().length;
      saveWatermarkPreset({
        id: 'test-preset-1',
        name: 'Bank KYC',
        config: {
          enabled: true,
          text: 'FOR BANK KYC ONLY',
          position: 'tiled',
          fontSize: 24,
          opacity: 0.3,
          color: '#10B981',
          rotation: -30,
          fontFamily: 'sans-serif',
          includeTimestamp: true,
        },
      });
      expect(getSavedWatermarkPresets().length).toBe(before + 1);

      deleteWatermarkPreset('test-preset-1');
      expect(getSavedWatermarkPresets().length).toBe(before);
    });
  });

  describe('5. Bilingual i18n Key Parity (EN & VI)', () => {
    it('has 100% matching translation keys between English and Vietnamese', () => {
      const enKeys = Object.keys(translations.en).sort();
      const viKeys = Object.keys(translations.vi).sort();
      expect(viKeys).toEqual(enKeys);
    });
  });

  describe('6. Metadata Cleaner Safety Check', () => {
    it('reports 0 metadata fields on a clean synthetic blob', async () => {
      const emptyBlob = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], {
        type: 'image/png',
      });
      const result = await inspectImageMetadata(emptyBlob);
      expect(result.rawCount).toBe(0);
      expect(result.hasGps).toBe(false);
    });
  });

  describe('7. Photo Privacy Score Engine (0-100)', () => {
    it('returns 100 A+ when no metadata or sensitive OCR regions exist', () => {
      const res = computeScoreFromFindings({ fields: [], hasGps: false, rawCount: 0 }, []);
      expect(res.score).toBe(100);
      expect(res.grade).toBe('A+');
      expect(res.riskLevel).toBe('safe');
    });

    it('deducts points accurately for exposed GPS, device EXIF, and OCR ID/Phone', () => {
      const res = computeScoreFromFindings(
        {
          fields: [{ key: 'Make', value: 'Apple', sensitive: true }],
          hasGps: true,
          gpsSummary: '20.4463, 106.3366',
          deviceSummary: 'Apple iPhone 17 Pro Max',
          rawCount: 5,
        },
        [
          { id: '1', x: 0.1, y: 0.1, width: 0.2, height: 0.1, mode: 'blackout', label: 'ID / CCCD' },
          { id: '2', x: 0.1, y: 0.3, width: 0.2, height: 0.1, mode: 'blackout', label: 'PHONE' },
        ]
      );
      // 100 - 35 (GPS) - 10 (Device) - 28 (ID) - 18 (Phone) = 9
      expect(res.score).toBe(9);
      expect(res.grade).toBe('F');
      expect(res.riskLevel).toBe('danger');
      expect(res.issues.length).toBe(4);
    });
  });
});
