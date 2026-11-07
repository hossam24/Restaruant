import { readFileSync } from 'node:fs'
import sharp from 'sharp'

const { themeColor } = JSON.parse(readFileSync('src/brand.json', 'utf8'))

const svg = (size) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="${themeColor}"/>
  <circle cx="256" cy="256" r="132" fill="none" stroke="#fff" stroke-width="22"/>
  <circle cx="256" cy="256" r="84" fill="#fff" fill-opacity=".22"/>
  <g fill="#fff">
    <rect x="96" y="150" width="14" height="70" rx="7"/><rect x="122" y="150" width="14" height="70" rx="7"/>
    <rect x="148" y="150" width="14" height="70" rx="7"/>
    <path d="M96 205h66v22a33 33 0 0 1-33 33 33 33 0 0 1-33-33z"/>
    <rect x="122" y="250" width="14" height="118" rx="7"/>
    <path d="M388 150c-34 22-46 62-40 112h40z"/>
    <rect x="374" y="250" width="14" height="118" rx="7"/>
  </g>
</svg>`)

for (const size of [192, 512]) {
  await sharp(svg(size)).png().toFile(`public/icon-${size}.png`)
}
console.log('public/icon-192.png and public/icon-512.png written')
