import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

function githubPagesBase() {
  const repository = process.env.GITHUB_REPOSITORY

  if (!repository) return '/'

  const repoName = repository.split('/')[1]

  return repoName ? `/${repoName}/` : '/'
}

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png'
      ],

      manifest: {
        name: 'FMV Landscaping',
        short_name: 'FMV',
        description: 'FMV Landscaping Field Service App',

        theme_color: '#166534',
        background_color: '#f8fafc',

        display: 'standalone',

        orientation: 'portrait',

        start_url: './',

        scope: './',

        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],

  base: githubPagesBase()
})