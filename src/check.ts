import type { CheckChange, CheckOptions, CheckResult, StaleGuardEntry } from './types'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { computeCompositeHash, hashFile } from './hash'
import { readHashFile } from './lockfile'

const DEFAULT_HASH_FILE = 'node_modules/.cache/tsdown-stale-guard/hash.yaml'

export async function checkBuildState(options: CheckOptions = {}): Promise<CheckResult> {
  const root = options.root || process.cwd()
  const hashFilePath = resolve(root, options.hashFile || DEFAULT_HASH_FILE)

  const data = await readHashFile(hashFilePath)
  const changes: CheckChange[] = []

  // Check configs
  if (data.configs) {
    for (const entry of data.configs) {
      await checkEntry(entry, 'config', root, changes)
    }
  }

  // Check lockfile
  if (data.lockfile)
    await checkEntry(data.lockfile, 'lockfile', root, changes)

  // Check sources
  for (const entry of data.sources)
    await checkEntry(entry, 'source', root, changes)

  // Check outputs
  for (const entry of data.outputs)
    await checkEntry(entry, 'output', root, changes)

  // Quick composite hash check
  const allEntries = [
    ...data.sources,
    ...data.outputs,
    ...data.configs || [],
    ...(data.lockfile ? [data.lockfile] : []),
  ]
  const currentHash = computeCompositeHash(allEntries)
  const fresh = changes.length === 0 && currentHash === data.hash

  return { fresh, stale: !fresh, changes }
}

async function checkEntry(
  entry: StaleGuardEntry,
  category: CheckChange['category'],
  root: string,
  changes: CheckChange[],
): Promise<void> {
  const filePath = resolve(root, entry.file)

  if (!existsSync(filePath)) {
    changes.push({ type: 'removed', category, file: entry.file })
    return
  }

  const currentHash = await hashFile(filePath)
  if (currentHash !== entry.hash)
    changes.push({ type: 'changed', category, file: entry.file })
}
