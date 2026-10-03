/* global process, fetch, AbortSignal, console */
import fs from 'node:fs'
import { tasks } from '../src/features/plan/content.ts'
const registry = JSON.parse(fs.readFileSync('docs/quality/guide-register.json', 'utf8'))
const results = []
for (const task of tasks) {
  const record = registry.find(row => row.id === task.id)
  if (!record || record.url !== task.url || !record.reviewOwnerRole || !record.reviewStatus) throw new Error(`Missing or outdated guide record: ${task.id}`)
}
if (process.argv.includes('--network')) {
  const urls = [...new Set(tasks.flatMap(task => [task.url, ...(task.action ? [task.action.url] : [])]).concat(['https://116111.pl/','https://www.niebieskalinia.pl/','https://lila.help/']))]
  // Small batches, fixed sources only. An HTTP success is not a content review.
  for (let i = 0; i < urls.length; i += 3) {
    results.push(...await Promise.all(urls.slice(i, i + 3).map(async url => {
      try {
        const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'Untangle-guide-link-check/1.0' } })
        await response.body?.cancel()
        return { url, status: response.status, finalUrl: response.url, result: response.ok ? 'reachable; content review still required' : [404,410].includes(response.status) ? 'broken link' : 'manual check required (access blocked or service unavailable)' }
      } catch { return { url, status: null, result: 'manual check required (network or timeout)' } }
    })))
  }
  fs.mkdirSync('test-results', { recursive: true })
  fs.writeFileSync('test-results/guide-links.json', JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2))
  console.log(JSON.stringify(results, null, 2))
  if (results.some(row => row.result === 'broken link')) process.exitCode = 1
} else console.log(`${tasks.length} guide records have matching sources and review responsibilities.`)
