import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { App } from './App';
import { LandingApp } from './landing/LandingApp';
import { I18nProvider } from './i18n/I18nContext';
import './index.css';

function shouldLaunchMobileApp(): boolean {
  if (Capacitor.isNativePlatform()) return true;
  if (typeof window === 'undefined') return true;

  const path = window.location.pathname.toLowerCase();
  if (path.endsWith('/app.html') || path.startsWith('/app')) return true;

  // Installed Standalone PWA opens directly into the Mobile App (never bounces to homepage)
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (isStandalone) return true;

  return false;
}

const isAppMode = shouldLaunchMobileApp();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isAppMode ? (
      <I18nProvider>
        <App />
      </I18nProvider>
    ) : (
      <LandingApp />
    )}
  </React.StrictMode>
);
