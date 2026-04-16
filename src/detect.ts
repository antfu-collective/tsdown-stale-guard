import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const PACKAGE_LOCK_FILES = [
  'pnpm-lock.yaml',
  'yarn.lock',
  'package-lock.json',
  'bun.lockb',
  'bun.lock',
]

const TSDOWN_CONFIG_FILES = [
  'tsdown.config.ts',
  'tsdown.config.mts',
  'tsdown.config.cts',
  'tsdown.config.js',
  'tsdown.config.mjs',
  'tsdown.config.cjs',
  'tsdown.config.json',
]

export function findUp(names: string[], cwd: string): string | undefined {
  let dir = resolve(cwd)

  while (true) {
    for (const name of names) {
      const candidate = join(dir, name)
      if (existsSync(candidate))
        return candidate
    }
    const parent = dirname(dir)
    if (parent === dir)
      break
    dir = parent
  }
  return undefined
}

export function detectPackageLock(cwd: string): string | undefined {
  return findUp(PACKAGE_LOCK_FILES, cwd)
}

export function detectTsdownConfig(cwd: string): string | undefined {
  return findUp(TSDOWN_CONFIG_FILES, cwd)
}
