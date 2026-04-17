#!/usr/bin/env node
import cac from 'cac'
import { guardStaleBuild } from './guard'

const cli = cac('tsdown-stale-guard')

cli
  .command('[...args]', 'Check if the build is up to date')
  .option('--hash-file <path>', 'Path to the hash file')
  .action(async (_args: string[], options: { hashFile?: string }) => {
    await guardStaleBuild({ hashFile: options.hashFile })
    console.log('Build is up to date.')
  })

cli.help()
cli.parse()
