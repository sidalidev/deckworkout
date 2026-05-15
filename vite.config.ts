import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        skipWaiting: false,
        clientsClaim: false,
        globPatterns: ['**/*.{js,css,html,svg,webp,png,woff2,mp3}'],
      },
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png', 'og-image.jpg'],
      manifest: {
        name: 'Deck Workout',
        short_name: 'Deck',
        description: 'One deck, 52 challenges. Push-ups, sit-ups, squats, burpees.',
        theme_color: '#fdf6e3',
        background_color: '#fdf6e3',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        launch_handler: {
          client_mode: 'navigate-existing',
        },
        shortcuts: [
          {
            name: 'Quick start',
            short_name: 'Start',
            description: 'Shuffle a fresh deck and start a new workout',
            url: '/?action=start',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Resume workout',
            short_name: 'Resume',
            description: 'Continue your in-progress workout',
            url: '/?action=resume',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
