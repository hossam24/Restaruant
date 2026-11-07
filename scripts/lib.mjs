// Shared by the image optimizer and the menu generator so both agree on file names.
export function webpPath(p) {
  // "imgs/offers/بوكس البطولة .jpeg" -> "imgs/offers/بوكس-البطولة.webp"
  const clean = p.replace(/^\.\//, '')
  const dot = clean.lastIndexOf('.')
  const base = (dot === -1 ? clean : clean.slice(0, dot)).trim().replace(/\s+/g, '-')
  return `${base}.webp`
}
