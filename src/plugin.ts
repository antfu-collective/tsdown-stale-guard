import type { TsdownPlugin } from 'tsdown'
import type { TsdownStaleGuardEntry, TsdownStaleGuardPluginOptions } from './types'
import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'

import { relative, resolve } from 'node:path'
import { detectPackageLock } from './detect'
import { computeCompositeHash, hashFile, hashFiles } from './hash'
import { writeHashFile } from './lockfile'

const RE_QUERY = /\?.*$/
const RE_WINDOWS_DRIVE = /^[a-z]:\\/i
const RE_NODE_MODULES = /node_modules/

const DEFAULT_HASH_FILE = 'node_modules/.cache/tsdown-stale-guard/hash.yaml'

export function TsdownStaleGuard(options: TsdownStaleGuardPluginOptions = {}): TsdownPlugin {
  const {
    hashFile: hashFilePath = DEFAULT_HASH_FILE,
    hashOutputs = true,
  } = options

  const sourceIds = new Set<string>()
  let root: string
  let configDeps: Set<string> | undefined
  let outDir: string

  return {
    name: 'tsdown-stale-guard',

    tsdownConfigResolved(config) {
      root = options.root || config.cwd
      configDeps = config.configDeps
      outDir = config.outDir
    },

    transform: {
      filter: {
        id: {
          exclude: [RE_NODE_MODULES],
        },
      },
      handler(_code, id) {
        const cleanId = id.replace(RE_QUERY, '')
        if (cleanId.startsWith('/') || RE_WINDOWS_DRIVE.test(cleanId))
          sourceIds.add(cleanId)
      },
    },

    async writeBundle() {
      const resolvedHashFile = resolve(root, hashFilePath)

      // Hash source files (filter to files that exist — DTS pass may add virtual IDs)
      const existingSources = [...sourceIds].filter(f => existsSync(f))
      const sources = await hashFiles(existingSources, root)

      // Hash output files by scanning the output directory
      let outputs: TsdownStaleGuardEntry[] = []
      if (hashOutputs && existsSync(outDir)) {
        const files = await readdir(outDir, { recursive: true, withFileTypes: true })
        const outputPaths: string[] = []
        for (const file of files) {
          if (file.isFile())
            outputPaths.push(resolve(file.parentPath, file.name))
        }
        outputs = await hashFiles(outputPaths, root)
      }

      // Detect and hash config & lockfile
      const configs: TsdownStaleGuardEntry[] = []
      if (configDeps) {
        for (const dep of configDeps) {
          const hash = await hashFile(dep)
          const file = toForwardSlash(relative(root, dep))
          configs.push({ file, hash })
        }
      }

      let lockfileEntry: TsdownStaleGuardEntry | undefined
      const lockfilePath = detectPackageLock(root)
      if (lockfilePath) {
        const hash = await hashFile(lockfilePath)
        const file = toForwardSlash(relative(root, lockfilePath))
        lockfileEntry = { file, hash }
      }

      // Compute composite hash
      const allEntries = [
        ...sources,
        ...outputs,
        ...configs,
        ...(lockfileEntry ? [lockfileEntry] : []),
      ]
      const compositeHash = computeCompositeHash(allEntries)

      await writeHashFile(resolvedHashFile, {
        version: 1,
        hash: compositeHash,
        configs,
        lockfile: lockfileEntry,
        sources,
        outputs,
      })
    },
  }
}

function toForwardSlash(p: string): string {
  return p.replace(/\\/g, '/')
}
