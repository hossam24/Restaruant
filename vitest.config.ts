import { defineConfig } from 'vitest/config'

// `archive/` and `legacy/` are kept for reference only and are not tested.
export default defineConfig({
  test: { exclude: ['archive/**', 'legacy/**', 'node_modules/**', 'dist/**'] },
})
