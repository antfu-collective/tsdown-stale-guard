# TSDSG_0002: Build is stale

Code: `TSDSG_0002`
Level: error

## What this error means

The build output is out of date. Source files, configuration, or dependencies have changed since the last time `tsdown` produced the current output. The number of changed files is included in the error message.

## Why this happens

- Source files were edited after the last build
- Configuration files (`tsdown.config.ts`, `tsconfig.json`, etc.) were modified
- The package lockfile (`pnpm-lock.yaml`, `package-lock.json`, etc.) changed after a dependency update
- Output files in `dist/` were manually modified or deleted

## How to fix it

Run your project's build script to rebuild:

```bash
# Use your project's build script if one is defined
npm run build
# or pnpm run build

# Or run tsdown directly
npx tsdown
```

If you want to check staleness without throwing, use `checkBuildState()` directly:

```ts
import { checkBuildState } from 'tsdown-stale-guard'

const result = await checkBuildState()
if (result.stale) {
  console.log(`${result.changes.length} files changed`)
}
```

## Example output

```
[TSDSG_0002] Build is stale in `/path/to/project`. 3 files changed since last build.
├▶ why: Source files, config, or dependencies have changed since the last build.
├▶ fix: Run your build script (e.g. `npm run build`) or `tsdown` directly to rebuild the project.
╰▶ see: https://github.com/antfu-collective/tsdown-stale-guard/blob/main/docs/errors/tsdsg_0002.md
```
