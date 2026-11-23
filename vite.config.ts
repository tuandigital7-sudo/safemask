import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/maskable-icon-512.png',
        'logo.svg',
      ],
      manifest: {
        name: 'SafeMask – Privacy Toolkit',
        short_name: 'SafeMask',
        description: 'Hide sensitive data in photos, PDFs & text before sharing. Local on-device processing.',
        theme_color: '#080A0D',
        background_color: '#080A0D',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/web/',
        scope: '/',
        categories: ['utilities', 'productivity', 'security'],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/maskable-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,webp,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: '/web/index.html',
        navigateFallbackAllowlist: [/^\/web/],
      },
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        web: resolve(__dirname, 'web/index.html'),
        landing: resolve(__dirname, 'landing.html'),
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'lucide-react'],
          pdf: ['pdfjs-dist', 'jspdf'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
