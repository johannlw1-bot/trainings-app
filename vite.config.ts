import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Veröffentlicht unter https://<login>.github.io/trainings-app/. Die Adresse darf sich nicht
// mehr ändern: Die Daten im iPhone (IndexedDB) hängen an ihr.
const PAGES_BASE = '/trainings-app/';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? PAGES_BASE : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Training',
        short_name: 'Training',
        description: 'Persönliche Trainings-App',
        lang: 'de',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0a0a0b',
        theme_color: '#0a0a0b',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Alles für den Offline-Betrieb vorab speichern, auch die Schrift.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  server: {
    // Im WLAN erreichbar, damit die App auf dem iPhone getestet werden kann.
    host: true,
    port: 5173,
  },
}));
