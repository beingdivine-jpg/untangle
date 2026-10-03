import { describe, expect, it } from 'vitest'
import { addTask, buildPlan, emptyPlan, examplePlan, nextTask, prerequisites, record, validatePlan } from '../src/features/plan/model'
import { decryptPlan, encryptPlan, MAX_PLAN_FILE_BYTES } from '../src/features/plan/crypto'

describe('personal plan and uncertainty', () => {
  it('adds preparation once and chooses it before dependent changes', () => {
    const plan = addTask(addTask(emptyPlan(), 'password'), 'devices')
    expect(Object.keys(plan.entries)).toEqual(['recovery', 'password', 'devices'])
    expect(nextTask(plan)).toBe('recovery')
    expect(prerequisites(plan, 'password')).toEqual(['recovery'])
    expect(prerequisites(record(plan, 'recovery', 'uncertain', ''), 'password')).toEqual(['recovery'])
    expect(prerequisites(record(plan, 'recovery', 'reviewed', ''), 'password')).toEqual([])
  })
  it('limits guides to chosen services without losing preparation', () => {
    const apple = buildPlan(['accounts', 'location', 'shared'], ['apple'])
    expect(apple.entries.devices).toBeUndefined()
    expect(apple.entries.whatsapp).toBeUndefined()
    expect(apple.entries.apple).toBeDefined()
    expect(apple.entries.keep).toBeDefined()
    expect(apple.entries.family).toBeDefined()
    const google = buildPlan(['accounts', 'location'], ['google'])
    expect(google.entries.apple).toBeUndefined()
    expect(google.entries.maps).toBeDefined()
  })
  it('keeps history when a reviewed check becomes uncertain again', () => {
    const original = addTask(emptyPlan(), 'maps')
    let plan = record(original, 'maps', 'reviewed', 'I checked this list')
    plan = record(plan, 'maps', 'uncertain', 'Something changed')
    expect(plan.entries.maps?.history.map(h => h.status)).toEqual(['reviewed', 'uncertain'])
    expect(original.entries.maps?.status).toBe('todo')
    expect(plan.entries.maps?.status).toBe('uncertain')
  })
  it('never turns waiting or support into a reviewed result', () => {
    let p = buildPlan(['accounts'])
    for (const id of Object.keys(p.entries) as (keyof typeof p.entries)[]) p = record(p, id, 'support', '')
    expect(nextTask(p)).toBeUndefined()
    expect(Object.values(p.entries).some(e => e?.status === 'reviewed')).toBe(false)
  })
  it('bounds notes/history and rejects unexpected imported shapes', () => {
    let p = addTask(emptyPlan(), 'maps')
    for (let i=0;i<35;i++) p = record(p, 'maps', 'later', 'a'.repeat(600))
    expect(p.entries.maps?.history).toHaveLength(30)
    expect(p.entries.maps?.note).toHaveLength(500)
    expect(() => validatePlan({ ...p, entries: { '__invalid': p.entries.maps } })).toThrow()
    expect(() => validatePlan({ ...p, entries: { maps: { ...p.entries.maps, status: 'safe' } } })).toThrow()
    expect(() => validatePlan({ ...p, entries: { maps: { ...p.entries.maps, history: [{ status: 'later', at: 'not a date', note: '' }] } } })).toThrow()
    expect(validatePlan({ ...p, unexpected: '<script>' })).not.toHaveProperty('unexpected')
  })
})

describe('opt-in encrypted plan files', () => {
  it('roundtrips a plan with history while hiding its contents and preserving example mode', async () => {
    const plan = examplePlan(), pass = 'fictional testing passphrase'
    const file = await encryptPlan(plan, pass)
    expect(file).not.toContain('laptop entries')
    expect(file).not.toContain(pass)
    expect(await decryptPlan(file, pass)).toEqual(plan)
    expect(file).not.toEqual(await encryptPlan(plan, pass))
  })
  it('rejects wrong passphrases, corrupted content, oversized files and altered KDF parameters', async () => {
    const file = await encryptPlan(examplePlan(), 'test phrase with several words')
    await expect(decryptPlan(file, 'wrong phrase')).rejects.toThrow('Could not open')
    const e = JSON.parse(file); e.data = (e.data[0] === 'A' ? 'B' : 'A') + e.data.slice(1)
    await expect(decryptPlan(JSON.stringify(e), 'test phrase with several words')).rejects.toThrow()
    e.iterations = 999999999
    await expect(decryptPlan(JSON.stringify(e), 'test phrase with several words')).rejects.toThrow()
    await expect(decryptPlan('a'.repeat(MAX_PLAN_FILE_BYTES + 1), 'pass')).rejects.toThrow('too large')
    await expect(encryptPlan(emptyPlan(), 'short')).rejects.toThrow('12')
  })
})
