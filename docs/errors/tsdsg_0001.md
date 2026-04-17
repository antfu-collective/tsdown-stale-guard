# TSDSG_0001: tsdownConfigResolved hook not called

Code: `TSDSG_0001`
Level: error

## What this error means

The `tsdownConfigResolved` plugin hook was not called during the build. This hook is how `tsdown-stale-guard` reads the build configuration (root directory, output directory, config dependencies) needed to record file hashes.

## Why this happens

The `tsdownConfigResolved` hook is only available since `tsdown@0.21.9`. If you are using an older version, tsdown will not call this hook and the plugin cannot function.

## How to fix it

Upgrade tsdown to version `0.21.9` or later:

```bash
npm install tsdown@latest
# or
pnpm add tsdown@latest
```

Then verify the version:

```bash
npx tsdown --version
```

## Example output

```
[TSDSG_0001] The `tsdownConfigResolved` hook was not called.
├▶ why: The `tsdownConfigResolved` hook is only available since `tsdown@0.21.9`. Your version of tsdown may not support it.
├▶ fix: Upgrade tsdown to `0.21.9` or later.
╰▶ see: https://github.com/antfu-collective/tsdown-stale-guard/blob/main/docs/errors/tsdsg_0001.md
```
