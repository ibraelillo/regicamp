import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'lambda/index.ts'
  },
  splitting: false,
  sourcemap: true,
  clean: false,
  platform: 'node',
  outDir: 'lambda'
})