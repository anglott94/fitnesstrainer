import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// base: './' -> relative Asset-Pfade. Damit laeuft der Build ohne Anpassung
// unter jedem Unterpfad (GitHub Pages Projektseite, Netlify, lokal, ...).
// Passend dazu nutzt die App einen HashRouter, damit auch Deep-Links und
// Reloads ohne Server-Rewrites funktionieren.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Schiri-Trainer',
        short_name: 'Schiri-Trainer',
        description: 'Lauf- und Krafttraining für Schiedsrichter — offline, lokal, kostenlos',
        lang: 'de',
        theme_color: '#0b1220',
        background_color: '#0b1220',
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
