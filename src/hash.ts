import type { TsdownStaleGuardEntry } from './types'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { relative } from 'node:path'

export async function hashFile(path: string): Promise<string> {
  const content = await readFile(path)
  return `sha256:${createHash('sha256').update(content).digest('hex')}`
}

export async function hashFiles(paths: string[], root: string): Promise<TsdownStaleGuardEntry[]> {
  const entries = await Promise.all(
    paths.map(async (p) => {
      const hash = await hashFile(p)
      const file = toForwardSlash(relative(root, p))
      return { file, hash }
    }),
  )
  return entries.sort((a, b) => a.file.localeCompare(b.file))
}

export function computeCompositeHash(entries: TsdownStaleGuardEntry[]): string {
  const hash = createHash('sha256')
  for (const entry of [...entries].sort((a, b) => a.file.localeCompare(b.file))) {
    hash.update(`${entry.file}:${entry.hash}\n`)
  }
  return `sha256:${hash.digest('hex')}`
}

function toForwardSlash(p: string): string {
  return p.replace(/\\/g, '/')
}
