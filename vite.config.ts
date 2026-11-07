import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Link previews (WhatsApp, Facebook) need absolute URLs. They can only be written once the real
 * address is known, so set VITE_SITE_URL (for example https://rasheedy.pages.dev) when building.
 * Without it the tags are simply left out.
 */
function siteMeta(siteUrl: string | undefined): Plugin {
  return {
    name: 'site-meta',
    transformIndexHtml(html) {
      if (!siteUrl) return html
      const base = siteUrl.replace(/\/$/, '')
      const tags = [
        `<link rel="canonical" href="${base}/" />`,
        `<meta property="og:url" content="${base}/" />`,
        `<meta property="og:image" content="${base}/og.png" />`,
        `<meta property="og:image:width" content="1200" />`,
        `<meta property="og:image:height" content="630" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:image" content="${base}/og.png" />`,
      ].join('\n    ')
      return html.replace('</head>', `    ${tags}\n  </head>`)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [react(), tailwindcss(), siteMeta(env.VITE_SITE_URL)],
  }
})
