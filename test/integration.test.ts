import { existsSync } from 'node:fs'
import { readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { build } from 'tsdown'
import { afterEach, describe, expect, it } from 'vitest'
import { checkBuildState, parseHashFile, StaleGuardRecorder } from '../src'

const fixtures = resolve(import.meta.dirname, 'fixtures')
const HASH_FILE = 'node_modules/.cache/tsdown-stale-guard/hash.yaml'

function fixtureDir(name: string) {
  return resolve(fixtures, name)
}

async function cleanFixture(name: string) {
  const dir = fixtureDir(name)
  await rm(resolve(dir, 'dist'), { recursive: true, force: true })
  await rm(resolve(dir, HASH_FILE), { force: true })
}

async function buildFixture(name: string, entry: string[] = ['src/index.ts']) {
  const dir = fixtureDir(name)
  await build({
    cwd: dir,
    entry: entry.map(e => resolve(dir, e)),
    outDir: resolve(dir, 'dist'),
    plugins: [StaleGuardRecorder({ root: dir })],
  })
}

async function readHash(name: string) {
  const content = await readFile(resolve(fixtureDir(name), HASH_FILE), 'utf-8')
  return parseHashFile(content)
}

describe('basic fixture', () => {
  afterEach(() => cleanFixture('basic'))

  it('generates hash file after build', async () => {
    await buildFixture('basic')

    const hashPath = resolve(fixtureDir('basic'), HASH_FILE)
    expect(existsSync(hashPath)).toBe(true)

    const data = await readHash('basic')
    expect(data.version).toBe(1)
    expect(data.hash).toMatch(/^sha256:[a-f0-9]{64}$/)
  })

  it('records source files', async () => {
    await buildFixture('basic')

    const data = await readHash('basic')
    const sourceFiles = data.sources.map(s => s.file)
    expect(sourceFiles.some(f => f.includes('src/index.ts'))).toBe(true)
  })

  it('records output files', async () => {
    await buildFixture('basic')

    const data = await readHash('basic')
    expect(data.outputs.length).toBeGreaterThan(0)
    const outputFiles = data.outputs.map(o => o.file)
    expect(outputFiles.some(f => f.includes('dist/'))).toBe(true)
  })

  it('detects tsdown config', async () => {
    await buildFixture('basic')

    const data = await readHash('basic')
    expect(data.configs).toBeDefined()
    expect(data.configs![0].file).toContain('tsdown.config.ts')
    expect(data.configs![0].hash).toMatch(/^sha256:[a-f0-9]{64}$/)
  })

  it('detects package lock file', async () => {
    await buildFixture('basic')

    const data = await readHash('basic')
    expect(data.lockfile).toBeDefined()
    expect(data.lockfile!.hash).toMatch(/^sha256:[a-f0-9]{64}$/)
  })

  it('all hashes are valid sha256', async () => {
    await buildFixture('basic')

    const data = await readHash('basic')
    const allEntries = [
      ...data.sources,
      ...data.outputs,
      ...data.configs || [],
      ...(data.lockfile ? [data.lockfile] : []),
    ]
    for (const entry of allEntries)
      expect(entry.hash).toMatch(/^sha256:[a-f0-9]{64}$/)
  })
})

describe('multi-entry fixture', () => {
  afterEach(() => cleanFixture('multi-entry'))

  it('tracks sources from all entry points', async () => {
    await buildFixture('multi-entry', ['src/index.ts', 'src/cli.ts'])

    const data = await readHash('multi-entry')
    const sourceFiles = data.sources.map(s => s.file)

    // Should include both entry points and the shared math module
    expect(sourceFiles.some(f => f.includes('src/index.ts'))).toBe(true)
    expect(sourceFiles.some(f => f.includes('src/cli.ts'))).toBe(true)
    expect(sourceFiles.some(f => f.includes('src/math.ts'))).toBe(true)
  })

  it('produces multiple output files', async () => {
    await buildFixture('multi-entry', ['src/index.ts', 'src/cli.ts'])

    const data = await readHash('multi-entry')
    expect(data.outputs.length).toBeGreaterThanOrEqual(2)
  })
})

describe('with-deps fixture', () => {
  afterEach(() => cleanFixture('with-deps'))

  it('tracks all transitive source dependencies', async () => {
    await buildFixture('with-deps')

    const data = await readHash('with-deps')
    const sourceFiles = data.sources.map(s => s.file)

    expect(sourceFiles.some(f => f.includes('src/index.ts'))).toBe(true)
    expect(sourceFiles.some(f => f.includes('src/format.ts'))).toBe(true)
    expect(sourceFiles.some(f => f.includes('src/validate.ts'))).toBe(true)
  })
})

describe('missing build', () => {
  afterEach(() => cleanFixture('basic'))

  it('throws a TSDSG0003 diagnostic instead of a raw ENOENT', async () => {
    const dir = fixtureDir('basic')

    await expect(checkBuildState({ root: dir })).rejects.toMatchObject({
      diagnostic: expect.objectContaining({ code: 'TSDSG0003' }),
      cause: expect.objectContaining({ code: 'ENOENT' }),
    })
  })
})

describe('freshness check', () => {
  afterEach(() => cleanFixture('basic'))

  it('reports fresh immediately after build', async () => {
    await buildFixture('basic')

    const result = await checkBuildState({
      root: fixtureDir('basic'),
    })
    expect(result.fresh).toBe(true)
    expect(result.changes).toHaveLength(0)
  })

  it('reports stale after source modification', async () => {
    const dir = fixtureDir('basic')
    const srcFile = resolve(dir, 'src/index.ts')
    await buildFixture('basic')

    // Modify source
    const original = await readFile(srcFile, 'utf-8')
    await writeFile(srcFile, `${original}\nexport const added = true\n`)

    try {
      const result = await checkBuildState({ root: dir })
      expect(result.fresh).toBe(false)
      expect(result.changes.length).toBeGreaterThan(0)
      expect(result.changes.some(c => c.type === 'changed' && c.category === 'source')).toBe(true)
    }
    finally {
      // Restore original
      await writeFile(srcFile, original)
    }
  })

  it('reports stale after output deletion', async () => {
    const dir = fixtureDir('basic')
    await buildFixture('basic')

    // Delete dist
    await rm(resolve(dir, 'dist'), { recursive: true })

    const result = await checkBuildState({ root: dir })
    expect(result.fresh).toBe(false)
    expect(result.changes.some(c => c.type === 'removed' && c.category === 'output')).toBe(true)
  })

  it('detects config changes', async () => {
    const dir = fixtureDir('basic')
    const configFile = resolve(dir, 'tsdown.config.ts')
    await buildFixture('basic')

    const original = await readFile(configFile, 'utf-8')
    await writeFile(configFile, `${original}\n// modified\n`)

    try {
      const result = await checkBuildState({ root: dir })
      expect(result.fresh).toBe(false)
      expect(result.changes.some(c => c.type === 'changed' && c.category === 'config')).toBe(true)
    }
    finally {
      await writeFile(configFile, original)
    }
  })

  it('idempotent: two consecutive builds produce same hash file', async () => {
    await buildFixture('basic')
    const hash1 = await readFile(resolve(fixtureDir('basic'), HASH_FILE), 'utf-8')

    await buildFixture('basic')
    const hash2 = await readFile(resolve(fixtureDir('basic'), HASH_FILE), 'utf-8')

    expect(hash1).toBe(hash2)
  })
})
