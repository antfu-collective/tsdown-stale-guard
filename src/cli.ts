#!/usr/bin/env node
import process from 'node:process'
import { checkBuildFreshness } from './check'

const args = process.argv.slice(2)
const command = args[0]

if (command === 'check') {
  const lockFileIdx = args.indexOf('--lock-file')
  const lockFile = lockFileIdx !== -1 ? args[lockFileIdx + 1] : undefined

  const result = await checkBuildFreshness({ lockFile })

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
}
else {
  console.log(`tsdown-lock - Build freshness validation for tsdown

Usage:
  tsdown-lock check              Check if the build is up to date
  tsdown-lock check --lock-file <path>  Use a custom lock file path

Options:
  --lock-file <path>  Path to the lock file (default: tsdown.lock.yaml)
  --help              Show this help message`)
  process.exit(command === '--help' || command === '-h' ? 0 : 1)
}
