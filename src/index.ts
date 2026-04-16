export { checkBuildFreshness } from './check'
export { parseHashFile, readHashFile, serializeHashFile } from './lockfile'
export { TsdownStaleGuard } from './plugin'
export type {
  CheckChange,
  CheckOptions,
  CheckResult,
  TsdownStaleGuardData,
  TsdownStaleGuardEntry,
  TsdownStaleGuardPluginOptions,
} from './types'
