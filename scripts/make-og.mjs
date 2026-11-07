import { readFileSync } from 'node:fs'
import sharp from 'sharp'

const { themeColor } = JSON.parse(readFileSync('src/brand.json', 'utf8'))

const W = 1200
const H = 630
const bg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
     <defs><linearGradient id="g" x1="1" y1="0" x2="0" y2="1">
       <stop offset="0" stop-color="${themeColor}"/><stop offset="1" stop-color="${themeColor}" stop-opacity=".8"/>
     </linearGradient></defs>
     <rect width="${W}" height="${H}" fill="url(#g)"/>
   </svg>`,
)
const size = 440
const logo = await sharp('public/icon-512.png').resize(size, size).png().toBuffer()
await sharp(bg)
  .composite([{ input: logo, left: Math.round((W - size) / 2), top: Math.round((H - size) / 2) }])
  .png({ compressionLevel: 9 })
  .toFile('public/og.png')
console.log('public/og.png written')
