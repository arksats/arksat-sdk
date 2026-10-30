import assert from 'node:assert/strict'
import { readFile, readdir, access } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
assert.equal(pkg.version, '0.1.0')
assert.equal(pkg.license, 'MIT')
assert.equal(pkg.repository.url, 'git+https://github.com/arksats/arksat-sdk.git')

async function check(path) {
  const text = await readFile(path, 'utf8')
  assert.ok(!/\p{Script=Han}/u.test(text), `Chinese text in ${path}`)
  if (!path.endsWith('.md')) return
  assert.ok(!/0\.2\.0|0\.3\.0|npm run build:sdk|npm run package:sdk/.test(text), `Outdated SDK documentation in ${path}`)
  for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0]
    if (!target || /^(?:https?:|mailto:|\/)/.test(target)) continue
    await access(resolve(dirname(path), target))
  }
}
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name)
    if (entry.isDirectory()) await walk(path)
    else await check(path)
  }
}
for (const dir of ['src', 'docs', 'examples', 'scripts']) await walk(resolve(root, dir))
for (const name of ['README.md', 'LICENSE', 'package.json', 'build.mjs']) await check(resolve(root, name))
console.log('PASS SDK version, MIT license, repository metadata, English content and documentation links')
