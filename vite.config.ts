import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/baby-log-icon.svg'],
      manifest: {
        name: 'Baby Log PWA',
        short_name: 'BabyLog',
        description:
          'Quick one-hand baby tracker for feeding, poop, and probiotics.',
        theme_color: '#0c111b',
        background_color: '#080b12',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        categories: ['lifestyle', 'health'],
        icons: [
          {
            src: '/icons/baby-log-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              networkTimeoutSeconds: 3,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
})
