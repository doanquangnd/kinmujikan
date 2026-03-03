import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import csp from 'vite-plugin-csp-guard'
import path from 'path'

/** Inject link CSS vào head khi dev - đảm bảo CSS load khi vercel dev (request qua proxy) */
function injectCssLinkDev() {
  return {
    name: 'inject-css-link-dev',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        if (ctx.server) {
          return [
            { tag: 'link', attrs: { rel: 'stylesheet', href: '/src/index.css' }, injectTo: 'head' },
          ]
        }
        return []
      },
    },
  }
}

export default defineConfig({
  plugins: [
    injectCssLinkDev(),
    react(),
    tailwind(),
    csp({
      algorithm: 'sha256',
      dev: { run: false },
      build: { sri: true },
      policy: {
        'default-src': ["'self'"],
        'script-src': ["'self'", 'https://challenges.cloudflare.com'],
        'style-src': ["'self'", 'https://fonts.googleapis.com'],
        'connect-src': ["'self'", 'https://challenges.cloudflare.com', 'https://kinmujikan.vercel.app'],
        'img-src': ["'self'", 'data:'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'frame-src': ['https://challenges.cloudflare.com'],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5174,
  },
})
