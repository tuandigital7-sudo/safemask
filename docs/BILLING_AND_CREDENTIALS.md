# SafeMask – Billing Architecture, Native Builds & Required Credentials

## 1. Current Billing Status (Honest Audit)
- **Architecture Completed:** `src/services/billing/BillingService.ts` implements a clean `BillingAdapter` interface with:
  - `DevMockBillingAdapter` (active **ONLY** in `import.meta.env.DEV` / Vitest tests, clearly labeled with a DEV banner and `isProductionVerified: false`).
  - `UnconfiguredProductionBillingAdapter` for `ios`, `android`, and `web` production builds — returns `not_configured` instead of faking purchases.
- **Pricing Configuration:** Externalized in `src/config/pricing.ts` (`$2.99/mo`, `$14.99/yr`, `$29.99 lifetime`), ready for remote A/B testing without UI code changes.
- **Production Billing Verification:** **NOT YET VERIFIED** (requires Apple App Store Connect & Google Play Console accounts + sandbox test purchases).

---

## 2. Credentials & Accounts Still Required from CEO

| Platform / Service | What is Needed | Purpose |
| :--- | :--- | :--- |
| **Apple Developer Program** | Team ID, Bundle ID (`com.safemask.privacy`), Distribution Certificate & Provisioning Profile | iOS App Store build, TestFlight, and StoreKit 2 |
| **App Store Connect IAP** | Product IDs: `com.safemask.privacy.pro.monthly`, `.yearly`, `.lifetime` | Real iOS subscriptions & lifetime unlock |
| **Google Play Console** | Keystore (`.jks`), Package ID (`com.safemask.privacy`), Play Billing Product IDs | Signed Android APK / AAB & Play Billing |
| **RevenueCat (Recommended)** | Public iOS API Key & Android API Key (optional if using direct StoreKit/Play plugin) | Unified receipt validation & entitlement sync |
| **Custom Domain & Hosting** | Domain (e.g., `safemask.app`) + Cloudflare Pages / Vercel / Netlify | Hosting PWA, Landing Page, Privacy Policy & Terms URLs |

---

## 3. How to Connect Production Billing
1. Install the store SDK when ready:
   ```bash
   npm install @revenuecat/purchases-capacitor
   npx cap sync
   ```
2. Replace `UnconfiguredProductionBillingAdapter` in `src/services/billing/BillingService.ts` with calls to `Purchases.configure({ apiKey })`, `Purchases.purchasePackage(...)`, and `Purchases.restorePurchases()`.
3. Test with **Apple StoreKit Configuration / Sandbox Tester** and **Google Play License Testing** before submitting for review.

---

## 4. Native Build Prerequisites on This Mac
- **PWA / Web:** Ready right now (`npm run build` → `dist/`).
- **Android APK:** `android/` project is already generated and synced with Capacitor 7. To compile a signed `.apk` / `.aab`, install Android Studio / Android SDK + Java 17+, then run:
  ```bash
  cd android && ./gradlew assembleRelease
  ```
- **iOS (Xcode 27.2 installed):** Install CocoaPods first (`brew install cocoapods` or `sudo gem install cocoapods`), then run:
  ```bash
  npx cap add ios
  npx cap sync ios
  npx cap open ios
  ```
  Add `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription`, and `NSCameraUsageDescription` to `ios/App/App/Info.plist`.
