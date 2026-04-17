import { consoleReporter, createLogger, defineDiagnostics } from 'logs-sdk'

export const diagnostics = defineDiagnostics({
  docsBase: code => `https://github.com/antfu-collective/tsdown-stale-guard/blob/main/docs/errors/${code.toLowerCase()}.md`,
  codes: {
    TSDSG_0001: {
      message: 'The `tsdownConfigResolved` hook was not called.',
      why: 'The `tsdownConfigResolved` hook is only available since `tsdown@0.21.9`. Your version of tsdown may not support it.',
      fix: 'Upgrade tsdown to `0.21.9` or later.',
    },
    TSDSG_0002: {
      message: (p: { root: string, changeCount: number }) =>
        `Build is stale in \`${p.root}\`. ${p.changeCount} file${p.changeCount === 1 ? '' : 's'} changed since last build.`,
      why: 'Source files, config, or dependencies have changed since the last build.',
      fix: 'Run your build script (e.g. `npm run build`) or `tsdown` directly to rebuild the project.',
    },
  },
})

export const log = createLogger({
  diagnostics: [diagnostics],
  reporters: consoleReporter,
})
