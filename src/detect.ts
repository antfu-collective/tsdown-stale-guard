import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const PACKAGE_LOCK_FILES = [
  'pnpm-lock.yaml',
  'yarn.lock',
  'package-lock.json',
  'bun.lockb',
  'bun.lock',
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
