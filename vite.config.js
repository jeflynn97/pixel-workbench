import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: '像素工作台 Pixel Workbench',
        short_name: '像素工作台',
        description: '个人一站式全能工作台：记账 · 待办 · 库存 · 生活记录 · 追剧 · 美食地图 · 随机点餐 · 食谱 · 生产任务',
        theme_color: '#F7F1E6',
        background_color: '#F7F1E6',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/unpkg\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'leaflet-cdn-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            urlPattern: /^https:\/\/\{s\}\.tile\.openstreetmap\.org\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'osm-tiles', expiration: { maxEntries: 200 } }
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 5173
  }
})
