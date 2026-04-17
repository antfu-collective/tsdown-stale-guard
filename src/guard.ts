import type { CheckOptions } from './types'
import process from 'node:process'
import { checkBuildState } from './check'
import { log } from './diagnostics'

export async function guardStaleBuild(options: CheckOptions = {}): Promise<void> {
  const root = options.root || process.cwd()
  const result = await checkBuildState(options)

  if (result.stale) {
    return log.TSDSG_0002({ root, changeCount: result.changes.length }).throw()
  }
}
