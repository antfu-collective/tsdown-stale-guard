import { defineConfig } from 'tsdown'
import ApiSnapshot from 'tsnapi/rolldown'
import { TsdownLock } from './src/index.ts'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/cli.ts',
  ],
  dts: true,
  exports: true,
  publint: true,
  plugins: [
    ApiSnapshot(),
    TsdownLock(),
  ],
})
