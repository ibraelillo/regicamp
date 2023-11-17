import { defineConfig } from 'tsup'
import { dependencies } from './package.json'

export default defineConfig((options) => {
  return {
    entry: {
        cms: 'src/cms.ts'
    },
    sourcemap: true,
    splitting: false,
    clean: true,
    minify: false,
    bundle: true,
    format:'esm',
    dts: false,
    platform: 'node',
    
    noExternal: [/.*/], //Object.keys(dependencies),
    external: [/oracledb/, /mysql/, /sqlite3/],
    
    shims: true,
    treeshake: true,
    skipNodeModulesBundle: true,
  }
})