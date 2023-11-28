import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    cms: 'src/cms.ts',
    warmer: 'src/warmer.ts',
    indexer: 'src/indexer.ts'
  },
  format: 'cjs',
  splitting: false,
  bundle: true,
  sourcemap: true,
  external: ['pg'],
  noExternal: ['algoliasearch', /strapi/, /serverless/],
  esbuildOptions: (opts) => ({
    opts
  }),
  treeshake: false,
  clean: true,
  target: "node18",
  platform: 'node',
  outDir: 'lambda',
  skipNodeModulesBundle: true
})