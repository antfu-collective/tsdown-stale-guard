#!/usr/bin/env node
import process from 'node:process'
import { checkBuildFreshness } from './check'

const args = process.argv.slice(2)
const command = args[0]

if (command === 'check') {
  const hashFileIdx = args.indexOf('--hash-file')
  const hashFile = hashFileIdx !== -1 ? args[hashFileIdx + 1] : undefined

  const result = await checkBuildFreshness({ hashFile })

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
  console.log(`tsdown-stale-guard - Build freshness validation for tsdown

Usage:
  tsdown-stale-guard check              Check if the build is up to date
  tsdown-stale-guard check --hash-file <path>  Use a custom hash file path

Options:
  --hash-file <path>  Path to the hash file (default: node_modules/.cache/tsdown-stale-guard/hash.yaml)
  --help              Show this help message`)
  process.exit(command === '--help' || command === '-h' ? 0 : 1)
}
