# TSDSG0003: No build found

Code: `TSDSG0003`
Level: error

## What this error means

`tsdown-stale-guard` could not find its hash file. This means `tsdown` (with the `StaleGuardRecorder` plugin) has never produced a build for this package, or the cache directory was cleared.

## Why this happens

- The package has never been built
- `node_modules/.cache` (or a custom cache directory) was deleted or cleaned
- `checkBuildState()` / `guardStaleBuild()` is pointed at the wrong `root` or `hashFile`

## How to fix it

Run your project's build script to produce a build:

```bash
npm run build
# or pnpm run build

# Or run tsdown directly
npx tsdown
```

Make sure the `tsdown` build includes the `StaleGuardRecorder` plugin, otherwise no hash file will ever be written.

## Example output

```
[TSDSG0003] No build found in `/path/to/project`. tsdown has not been run yet.
├▶ why: The stale-guard hash file does not exist, which means `tsdown` (with the `StaleGuardRecorder` plugin) has never built this package, or its cache was cleared.
├▶ fix: Run your build script (e.g. `npm run build`) or `tsdown` directly to produce a build.
╰▶ see: https://github.com/antfu-collective/tsdown-stale-guard/blob/main/docs/errors/tsdsg0003.md
```
