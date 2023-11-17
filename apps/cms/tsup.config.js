import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'lambda.ts'
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  platform: 'node'
})