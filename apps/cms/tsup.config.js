import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'lambda.ts'
  },
  format: 'esm',
  splitting: false,
  sourcemap: true,
  clean: false,
  platform: 'node',
  outDir: 'lambda'
})