# tsdown-stale-guard

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

Build freshness validation for [tsdown](https://github.com/rolldown/tsdown). Records hashes of all files involved in a build, enabling fast up-to-date checks without re-building.

> This plugin requires `tsdown@0.21.9` or later.

## Features

- **tsdown/Rolldown plugin** — automatically tracks source files, output files, config, and package lock file
- **Composite hash** — single hash for quick freshness checks
- **Find-up search** — detects lock files and configs in monorepo setups
- **CLI** — `tsdown-stale-guard` for CI pipelines
- **Programmatic API** — `checkBuildState()` for tool integrations
- **Build guard** — `guardStaleBuild()` throws on stale builds, great for test setups
- **Structured diagnostics** — errors use [logs-sdk](https://github.com/vercel-labs/logs-sdk) with stable codes and actionable fixes

## Install

```bash
npm i tsdown-stale-guard
```

## Usage

### As a tsdown Plugin

```ts
// tsdown.config.ts
import { defineConfig } from 'tsdown'
import { StaleGuardRecorder } from 'tsdown-stale-guard'

export default defineConfig({
  entry: ['src/index.ts'],
  plugins: [
    StaleGuardRecorder(),
  ],
})
```

After building, a hash file will be generated at `node_modules/.cache/tsdown-stale-guard/hash.yaml`.

Example of the generated hash file:

```yaml
version: 1
hash: sha256:abc123...

config:
  tsdown.config.ts: sha256:def456...

lockfile:
  ../../pnpm-lock.yaml: sha256:789abc...

sources:
  src/index.ts: sha256:111111...
  src/utils.ts: sha256:222222...

outputs:
  dist/index.mjs: sha256:aaaaaa...
  dist/index.d.mts: sha256:bbbbbb...
```

### Plugin Options

```ts
StaleGuardRecorder({
  hashFile: 'node_modules/.cache/tsdown-stale-guard/hash.yaml', // hash file path (default)
  root: process.cwd(), // root directory (default)
  hashOutputs: true, // hash output files (default)
})
```

### CLI

```bash
# Check if the build is up to date
tsdown-stale-guard

# Use a custom hash file path
tsdown-stale-guard --hash-file custom.hash.yaml
```

Exit code `0` if fresh, `1` if stale.

### Programmatic API

```ts
import { checkBuildState } from 'tsdown-stale-guard'

const result = await checkBuildState()

if (result.fresh) {
  console.log('Build is up to date')
}
else {
  for (const change of result.changes) {
    console.log(`${change.type}: [${change.category}] ${change.file}`)
  }
}
```

### Guard Stale Build

`guardStaleBuild()` checks the build state and throws a structured [`TSDSG0002`](./docs/errors/tsdsg0002.md) error if the build is stale. This is useful for CI pipelines or test setups where you want to fail early when the build output is outdated.

```ts
import { guardStaleBuild } from 'tsdown-stale-guard'

// Throws if the build is stale
await guardStaleBuild()
```

#### With Vitest

When writing tests against the built output (`dist/`), you can use `guardStaleBuild()` to ensure the build is fresh before tests run. Use `beforeAll` for a per-test-file check:

```ts
import { guardStaleBuild } from 'tsdown-stale-guard'
import { beforeAll, describe, it } from 'vitest'

beforeAll(async () => {
  await guardStaleBuild()
})

it('should work', async () => {
  const { myFunction } = await import('../dist/index.mjs')
  // test against the built output
})
```

Or use `globalSetup` for a one-time global check:

```ts
// test/setup.ts
import { guardStaleBuild } from 'tsdown-stale-guard'

await guardStaleBuild()
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: ['test/setup.ts'],
  },
})
```

Either way, tests fail immediately with a clear error message if the build is stale, instead of producing confusing failures from outdated output.

### Diagnostic Codes

All errors thrown by `tsdown-stale-guard` are structured [`CodedError`](https://github.com/vercel-labs/logs-sdk) objects with stable codes, actionable `fix` messages, and documentation links.

| Code | Level | Description |
|------|-------|-------------|
| [`TSDSG0001`](./docs/errors/tsdsg0001.md) | error | `tsdownConfigResolved` hook was not called (tsdown version too old) |
| [`TSDSG0002`](./docs/errors/tsdsg0002.md) | error | Build is stale — source files, config, or dependencies changed |

## How It Works

The plugin hooks into Rolldown's build pipeline:

1. **`transform`** — collects all source file paths during bundling
2. **`generateBundle`** — collects output file names
3. **`writeBundle`** — hashes all collected files plus the detected tsdown config and package lock file, then writes the hash file

The hash file includes a composite `hash` computed from all individual file hashes, enabling a single-comparison freshness check.

Package lock files (`pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, `bun.lockb`, `bun.lock`) and tsdown config files are found via find-up search, supporting monorepo setups where they may live in a parent directory.

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg" alt="Sponsors"/>
  </a>
</p>

## License

[MIT](./LICENSE) License © [Anthony Fu](https://github.com/antfu)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/tsdown-stale-guard?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/tsdown-stale-guard
[npm-downloads-src]: https://img.shields.io/npm/dm/tsdown-stale-guard?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/tsdown-stale-guard
[bundle-src]: https://img.shields.io/bundlephobia/minzip/tsdown-stale-guard?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=tsdown-stale-guard
[license-src]: https://img.shields.io/github/license/antfu-collective/tsdown-stale-guard.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/antfu-collective/tsdown-stale-guard/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/tsdown-stale-guard
