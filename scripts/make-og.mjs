// Builds the 1200x630 picture shown when the site link is shared (WhatsApp, Facebook...).
// Uses only the logo on the brand gradient, so it needs no fonts.
import sharp from 'sharp'

const W = 1200
const H = 630
const bg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
     <defs><linearGradient id="g" x1="1" y1="0" x2="0" y2="1">
       <stop offset="0" stop-color="#e67e22"/><stop offset="1" stop-color="#f39c12"/>
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
