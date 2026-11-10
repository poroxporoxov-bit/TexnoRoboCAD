import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [],
      manifest: {
        name: 'TexnoRoboCAD',
        short_name: 'TexnoRoboCAD',
        description: 'Robototexnika, elektronika va 3D dizayn platformasi',
        theme_color: '#08142d',
        background_color: '#08142d',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      }
    })
  ],
  server: {
      proxy: { '/api': 'http://localhost:8787' }, port: 5173 }
})