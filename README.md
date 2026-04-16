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
- **CLI** — `tsdown-stale-guard check` for CI pipelines
- **Programmatic API** — `checkBuildFreshness()` for tool integrations

## Install

```bash
npm i tsdown-stale-guard
```

## Usage

### As a tsdown Plugin

```ts
// tsdown.config.ts
import { defineConfig } from 'tsdown'
import { TsdownStaleGuard } from 'tsdown-stale-guard'

export default defineConfig({
  entry: ['src/index.ts'],
  plugins: [
    TsdownStaleGuard(),
  ],
})
```

After building, a hash file will be generated at `node_modules/.cache/tsdown-stale-guard/hash.yaml`. Since it lives inside `node_modules`, it does not need to be gitignored.

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
TsdownStaleGuard({
  hashFile: 'node_modules/.cache/tsdown-stale-guard/hash.yaml', // hash file path (default)
  root: process.cwd(), // root directory (default)
  hashOutputs: true, // hash output files (default)
})
```

### CLI

```bash
# Check if the build is up to date
tsdown-stale-guard check

# Use a custom hash file path
tsdown-stale-guard check --hash-file custom.hash.yaml
```

Exit code `0` if fresh, `1` if stale.

### Programmatic API

```ts
import { checkBuildFreshness } from 'tsdown-stale-guard'

const result = await checkBuildFreshness()

if (result.fresh) {
  console.log('Build is up to date')
}
else {
  for (const change of result.changes) {
    console.log(`${change.type}: [${change.category}] ${change.file}`)
  }
}
```

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
