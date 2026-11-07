import { readFileSync } from 'node:fs'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

interface Brand {
  name: string
  tagline: string
  description: string
  whatsapp: string
  phones: string[]
  address: string
  socials: { facebook: string; instagram: string; tiktok: string }
  themeColor: string
}

const brand: Brand = JSON.parse(readFileSync(new URL('./src/brand.json', import.meta.url), 'utf8'))
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

function brandMeta(siteUrl: string | undefined): Plugin {
  const manifest = JSON.stringify(
    {
      name: brand.name,
      short_name: brand.name.slice(0, 12),
      description: brand.description,
      lang: 'ar',
      dir: 'rtl',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#faf7f3',
      theme_color: brand.themeColor,
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      ],
    },
    null,
    2,
  )

  const sameAs = Object.values(brand.socials).filter(Boolean)
  const phones = brand.phones.map((p) => p.replace(/[^\d+]/g, ''))
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: brand.name,
    ...(phones.length ? { telephone: phones } : {}),
    ...(brand.address ? { address: { '@type': 'PostalAddress', streetAddress: brand.address } } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  }

  return {
    name: 'brand-meta',
    configureServer(server) {
      server.middlewares.use('/manifest.webmanifest', (_req, res) => {
        res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8')
        res.end(manifest)
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: manifest })
    },
    transformIndexHtml(html) {
      let out = html
        .replaceAll('__BRAND_NAME__', esc(brand.name))
        .replaceAll('__BRAND_DESCRIPTION__', esc(brand.description))
        .replaceAll('__BRAND_THEME__', esc(brand.themeColor))
      const tags = [`<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\u003c')}</script>`]
      if (siteUrl) {
        const base = siteUrl.replace(/\/$/, '')
        tags.push(
          `<link rel="canonical" href="${base}/" />`,
          `<meta property="og:url" content="${base}/" />`,
          `<meta property="og:image" content="${base}/og.png" />`,
          `<meta property="og:image:width" content="1200" />`,
          `<meta property="og:image:height" content="630" />`,
          `<meta name="twitter:card" content="summary_large_image" />`,
          `<meta name="twitter:image" content="${base}/og.png" />`,
        )
      }
      out = out.replace('</head>', `    ${tags.join('\n    ')}\n  </head>`)
      return out
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [react(), tailwindcss(), brandMeta(env.VITE_SITE_URL)],
  }
})
