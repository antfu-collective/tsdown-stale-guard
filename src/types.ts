export interface TsdownStaleGuardEntry {
  file: string
  hash: string
}

export interface TsdownStaleGuardData {
  version: 1
  hash: string
  configs?: TsdownStaleGuardEntry[]
  lockfile?: TsdownStaleGuardEntry
  sources: TsdownStaleGuardEntry[]
  outputs: TsdownStaleGuardEntry[]
}

export interface CheckResult {
  fresh: boolean
  changes: CheckChange[]
}

export interface CheckChange {
  type: 'changed' | 'added' | 'removed'
  category: 'config' | 'lockfile' | 'source' | 'output'
  file: string
}

export interface TsdownStaleGuardPluginOptions {
  /**
   * Path to the hash file.
   * @default 'node_modules/.cache/tsdown-stale-guard/hash.yaml'
   */
  hashFile?: string
  /**
   * Root directory for resolving relative paths.
   * @default process.cwd()
   */
  root?: string
  /**
   * Whether to hash output files.
   * @default true
   */
  hashOutputs?: boolean
}

export interface CheckOptions {
  /**
   * Path to the hash file.
   * @default 'node_modules/.cache/tsdown-stale-guard/hash.yaml'
   */
  hashFile?: string
  /**
   * Root directory for resolving relative paths.
   * @default process.cwd()
   */
  root?: string
}
