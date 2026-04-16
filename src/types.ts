export interface TsdownLockEntry {
  file: string
  hash: string
}

export interface TsdownLockData {
  version: 1
  hash: string
  config?: TsdownLockEntry
  lockfile?: TsdownLockEntry
  sources: TsdownLockEntry[]
  outputs: TsdownLockEntry[]
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

export interface TsdownLockPluginOptions {
  /**
   * Path to the lock file.
   * @default 'tsdown.lock.yaml'
   */
  lockFile?: string
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
   * Path to the lock file.
   * @default 'tsdown.lock.yaml'
   */
  lockFile?: string
  /**
   * Root directory for resolving relative paths.
   * @default process.cwd()
   */
  root?: string
}
