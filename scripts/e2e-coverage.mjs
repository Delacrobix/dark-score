// Cross-checks docs/comportamientos-esperados.md against the E2E tests:
// every behavior marked `auto` must have at least one test titled with its
// ID, and every ID used in a test must exist in the document.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DOC = 'docs/comportamientos-esperados.md'
const E2E = 'e2e'

const rows = readFileSync(DOC, 'utf8')
  .split('\n')
  .map((line) => /^\|\s*([A-Z]+-\d+)\s*\|(.*)$/.exec(line))
  .filter(Boolean)
  .map(([, id, rest]) => {
    const cells = rest.split('|').map((c) => c.trim())
    return { id, verification: cells[1] ?? '', status: cells[2] ?? '' }
  })

const testIds = new Map()
for (const file of readdirSync(E2E).filter((f) => f.endsWith('.spec.ts'))) {
  const src = readFileSync(join(E2E, file), 'utf8')
  for (const m of src.matchAll(/test\(\s*[`'"]([A-Z]+-\d+)\b/g)) {
    testIds.set(m[1], [...(testIds.get(m[1]) ?? []), file])
  }
}

const automated = rows.filter((r) => /\bauto\b/.test(r.verification))
const missing = automated.filter((r) => !testIds.has(r.id))
const unknown = [...testIds.keys()].filter((id) => !rows.some((r) => r.id === id))
const knownFailures = rows.filter((r) => r.status.startsWith('❌'))
const pending = rows.filter((r) => r.status.startsWith('⚠️'))

console.log(`${rows.length} behaviors in ${DOC}: ${automated.length} automated, ${rows.length - automated.length} manual/visual`)
console.log(`${testIds.size} behavior IDs covered by ${[...new Set([...testIds.values()].flat())].length} spec files`)

if (knownFailures.length) console.log(`\nKnown failures (❌): ${knownFailures.map((r) => r.id).join(', ')}`)
if (pending.length) console.log(`Decisions pending (⚠️): ${pending.map((r) => r.id).join(', ')}`)

let exit = 0
if (missing.length) {
  exit = 1
  console.log(`\nAutomated behaviors without a test:\n  ${missing.map((r) => r.id).join('\n  ')}`)
}
if (unknown.length) {
  exit = 1
  console.log(`\nTest IDs not in the document:\n  ${unknown.map((id) => `${id} (${testIds.get(id).join(', ')})`).join('\n  ')}`)
}
if (!exit) console.log('\nDocument and tests are in sync.')
process.exit(exit)
