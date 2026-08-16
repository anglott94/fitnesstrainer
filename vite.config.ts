import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// base: './' -> relative Asset-Pfade. Damit laeuft der Build ohne Anpassung
// unter jedem Unterpfad (GitHub Pages Projektseite, Netlify, lokal, ...).
// Passend dazu nutzt die App einen HashRouter, damit auch Deep-Links und
// Reloads ohne Server-Rewrites funktionieren.
export default defineConfig({
  base: './',
  // Zeitstempel des Builds, damit in den Einstellungen ablesbar ist, welcher
  // Stand tatsächlich läuft. Ohne das lässt sich „alte Version im Cache" nicht
  // von „Fehler nicht behoben" unterscheiden.
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registrierung übernimmt UpdatePrompt über den React-Hook — sonst liefe
      // die eingebettete registerSW.js parallel und meldete nie einen Neustand.
      injectRegister: null,
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Schiri-Trainer',
        short_name: 'Schiri-Trainer',
        description: 'Lauf- und Krafttraining für Schiedsrichter — offline, lokal, kostenlos',
        lang: 'de',
        // Muss zu --bg in styles.css passen, sonst zieht sich in der installierten
        // App eine sichtbare Kante zwischen Statusleiste und Seite.
        theme_color: '#0a1018',
        background_color: '#0a1018',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
})
