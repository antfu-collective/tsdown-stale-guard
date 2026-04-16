import process from 'node:process'
import { defineConfig } from 'tsdown'
import ApiSnapshot from 'tsnapi/rolldown'
import { tsdownLock } from './src/index.ts'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/cli.ts',
  ],
  dts: true,
  exports: true,
  publint: true,
  plugins: [
    ApiSnapshot({
      update: !process.env.CI,
    }),
    tsdownLock(),
  ],
})
