#!/usr/bin/env node
import process from 'node:process'
import cac from 'cac'
import { checkBuildState } from './check'

const cli = cac('tsdown-stale-guard')

cli
  .command('[...args]', 'Check if the build is up to date')
  .option('--hash-file <path>', 'Path to the hash file')
  .action(async (_args: string[], options: { hashFile?: string }) => {
    const result = await checkBuildState({ hashFile: options.hashFile })

    if (result.fresh) {
      console.log('Build is up to date.')
      process.exit(0)
    }
    else {
      console.log('Build is stale. Changes detected:')
      for (const change of result.changes)
        console.log(`  ${change.type}: [${change.category}] ${change.file}`)
      process.exit(1)
    }
  })

cli.help()
cli.parse()
