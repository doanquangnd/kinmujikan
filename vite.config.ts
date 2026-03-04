import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import csp from 'vite-plugin-csp-guard'
import path from 'path'
import { readdirSync, readFileSync, writeFileSync } from 'fs'

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
      build: { sri: false },
      policy: {
        'default-src': ["'self'"],
        'script-src': ["'self'", 'https://challenges.cloudflare.com'],
        'script-src-elem': ["'self'", 'https://challenges.cloudflare.com'],
        'style-src': ["'self'", 'https://fonts.googleapis.com', 'https://challenges.cloudflare.com'],
        'style-src-elem': ["'self'", 'https://fonts.googleapis.com', 'https://challenges.cloudflare.com'],
        'connect-src': ["'self'", 'https://challenges.cloudflare.com', 'https://kinmujikan.vercel.app'],
        'img-src': ["'self'", 'data:', 'https://challenges.cloudflare.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'frame-src': ['https://challenges.cloudflare.com'],
        'child-src': ['https://challenges.cloudflare.com'],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
      },
    }),
    {
      name: 'inject-css-link-build',
      closeBundle() {
        const outDir = path.resolve(__dirname, 'dist')
        const assetsDir = path.join(outDir, 'assets')
        const cssFiles = readdirSync(assetsDir).filter((f) => f.endsWith('.css'))
        if (cssFiles.length === 0) return
        const htmlPath = path.join(outDir, 'index.html')
        let html = readFileSync(htmlPath, 'utf-8')
        const linkTags = cssFiles
          .map((f) => `<link rel="stylesheet" href="/assets/${f}">`)
          .join('')
        if (!html.includes('href="/assets/' + cssFiles[0])) {
          html = html.replace('</head>', `${linkTags}</head>`)
          writeFileSync(htmlPath, html)
        }
      },
    },
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5174,
  },
  build: {
    modulePreload: {
      resolveDependencies: () => [],
    },
  },
})
