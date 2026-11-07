export function webpPath(p) {
  const clean = p.replace(/^\.\//, '')
  const dot = clean.lastIndexOf('.')
  const base = (dot === -1 ? clean : clean.slice(0, dot)).trim().replace(/\s+/g, '-')
  return `${base}.webp`
}
