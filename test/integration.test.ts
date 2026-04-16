import { existsSync } from 'node:fs'
import { readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { build } from 'tsdown'
import { afterEach, describe, expect, it } from 'vitest'
import { checkBuildFreshness, parseLockFile, tsdownLock } from '../src'

const fixtures = resolve(import.meta.dirname, 'fixtures')

function fixtureDir(name: string) {
  return resolve(fixtures, name)
}

async function cleanFixture(name: string) {
  const dir = fixtureDir(name)
  await rm(resolve(dir, 'dist'), { recursive: true, force: true })
  await rm(resolve(dir, 'tsdown.lock.yaml'), { force: true })
}

async function buildFixture(name: string, entry: string[] = ['src/index.ts']) {
  const dir = fixtureDir(name)
  await build({
    config: false,
    cwd: dir,
    entry: entry.map(e => resolve(dir, e)),
    outDir: resolve(dir, 'dist'),
    plugins: [tsdownLock({ root: dir })],
  })
}

async function readLock(name: string) {
  const content = await readFile(resolve(fixtureDir(name), 'tsdown.lock.yaml'), 'utf-8')
  return parseLockFile(content)
}

describe('basic fixture', () => {
  afterEach(() => cleanFixture('basic'))

  it('generates lock file after build', async () => {
    await buildFixture('basic')

    const lockPath = resolve(fixtureDir('basic'), 'tsdown.lock.yaml')
    expect(existsSync(lockPath)).toBe(true)

    const data = await readLock('basic')
    expect(data.version).toBe(1)
    expect(data.hash).toMatch(/^sha256:[a-f0-9]{64}$/)
  })

  it('records source files', async () => {
    await buildFixture('basic')

    const data = await readLock('basic')
    const sourceFiles = data.sources.map(s => s.file)
    expect(sourceFiles.some(f => f.includes('src/index.ts'))).toBe(true)
  })

  it('records output files', async () => {
    await buildFixture('basic')

    const data = await readLock('basic')
    expect(data.outputs.length).toBeGreaterThan(0)
    const outputFiles = data.outputs.map(o => o.file)
    expect(outputFiles.some(f => f.includes('dist/'))).toBe(true)
  })

  it('detects tsdown config', async () => {
    await buildFixture('basic')

    const data = await readLock('basic')
    expect(data.config).toBeDefined()
    expect(data.config!.file).toContain('tsdown.config.ts')
    expect(data.config!.hash).toMatch(/^sha256:[a-f0-9]{64}$/)
  })

  it('detects package lock file', async () => {
    await buildFixture('basic')

    const data = await readLock('basic')
    expect(data.lockfile).toBeDefined()
    expect(data.lockfile!.hash).toMatch(/^sha256:[a-f0-9]{64}$/)
  })

  it('all hashes are valid sha256', async () => {
    await buildFixture('basic')

    const data = await readLock('basic')
    const allEntries = [
      ...data.sources,
      ...data.outputs,
      ...(data.config ? [data.config] : []),
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

    const data = await readLock('multi-entry')
    const sourceFiles = data.sources.map(s => s.file)

    // Should include both entry points and the shared math module
    expect(sourceFiles.some(f => f.includes('src/index.ts'))).toBe(true)
    expect(sourceFiles.some(f => f.includes('src/cli.ts'))).toBe(true)
    expect(sourceFiles.some(f => f.includes('src/math.ts'))).toBe(true)
  })

  it('produces multiple output files', async () => {
    await buildFixture('multi-entry', ['src/index.ts', 'src/cli.ts'])

    const data = await readLock('multi-entry')
    expect(data.outputs.length).toBeGreaterThanOrEqual(2)
  })
})

describe('with-deps fixture', () => {
  afterEach(() => cleanFixture('with-deps'))

  it('tracks all transitive source dependencies', async () => {
    await buildFixture('with-deps')

    const data = await readLock('with-deps')
    const sourceFiles = data.sources.map(s => s.file)

    expect(sourceFiles.some(f => f.includes('src/index.ts'))).toBe(true)
    expect(sourceFiles.some(f => f.includes('src/format.ts'))).toBe(true)
    expect(sourceFiles.some(f => f.includes('src/validate.ts'))).toBe(true)
  })
})

describe('freshness check', () => {
  afterEach(() => cleanFixture('basic'))

  it('reports fresh immediately after build', async () => {
    await buildFixture('basic')

    const result = await checkBuildFreshness({
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
      const result = await checkBuildFreshness({ root: dir })
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

    const result = await checkBuildFreshness({ root: dir })
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
      const result = await checkBuildFreshness({ root: dir })
      expect(result.fresh).toBe(false)
      expect(result.changes.some(c => c.type === 'changed' && c.category === 'config')).toBe(true)
    }
    finally {
      await writeFile(configFile, original)
    }
  })

  it('idempotent: two consecutive builds produce same lock', async () => {
    await buildFixture('basic')
    const lock1 = await readFile(resolve(fixtureDir('basic'), 'tsdown.lock.yaml'), 'utf-8')

    await buildFixture('basic')
    const lock2 = await readFile(resolve(fixtureDir('basic'), 'tsdown.lock.yaml'), 'utf-8')

    expect(lock1).toBe(lock2)
  })
})
