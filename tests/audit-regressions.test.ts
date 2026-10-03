import { describe, expect, it } from 'vitest'
import { tasks, concerns } from '../src/features/plan/content'
import { services } from '../src/features/plan/services'
import { buildPlan, emptyPlan, mergePlan, addTask, record, removeTask, revisePlan, validatePlan } from '../src/features/plan/model'
import { encryptPlan, decryptPlan, MAX_PLAN_FILE_BYTES } from '../src/features/plan/crypto'
import { allowedFor, validateRequest, validateDraft } from '../src/features/companion/agentCore'
import polish from '../src/i18n/pl.json'

describe('audit regressions: plan scope and no lost work', () => {
  it('every concern/service combination has a usable next step or explicit coverage notice', () => {
    for (const concern of concerns) for (const service of services) {
      const plan = buildPlan([concern.id], [service.id])
      expect(Object.keys(plan.entries).length, `${concern.id}/${service.id}`).toBeGreaterThan(0)
      if (plan.uncovered.length) expect(plan.entries.support).toBeDefined()
    }
    expect(buildPlan(['location'], ['whatsapp']).uncovered).toEqual(['location'])
  })
  it('new drafts add to existing observations and general notes without overwriting', () => {
    let current = record(buildPlan(['accounts'], ['google']), 'devices', 'uncertain', 'My existing observation')
    current = { ...current, note: 'Whole situation', drafts: { recovery: { note: 'Unfinished', status: null } } }
    const next = mergePlan(current, buildPlan(['photos'], ['google']))
    expect(next.entries.devices).toEqual(current.entries.devices)
    expect(next.entries.photos).toBeDefined()
    expect(next.note).toBe('Whole situation')
    expect(next.drafts).toEqual(current.drafts)
  })
  it('removing a prerequisite removes dependent checks without altering unrelated observations', () => {
    const plan = buildPlan(['accounts', 'location'], ['google'])
    const next = removeTask(plan, 'recovery')
    expect(Object.keys(next.entries)).toEqual(['maps'])
    expect(plan.entries.devices).toBeDefined()
    expect(next.entries.maps).toEqual(plan.entries.maps)
  })
  it('editing apps preserves overlapping history and removes incompatible drafts', () => {
    const plan = { ...record(buildPlan(['accounts', 'location'], ['google', 'apple']), 'maps', 'later', 'A question'), drafts: { devices: { note: 'Not completed', status: null } } }
    const next = revisePlan(plan, ['location'], ['google'])
    expect(Object.keys(next.entries)).toEqual(['maps'])
    expect(next.entries.maps).toEqual(plan.entries.maps)
    expect(next.drafts).toEqual({})
  })
  it('reads older version-1 files and rejects malformed new fields', () => {
    expect(validatePlan({ version: 1, example: false, concerns: [], entries: {} })).toEqual(emptyPlan())
    expect(() => validatePlan({ ...emptyPlan(), note: 'x'.repeat(501) })).toThrow()
    expect(() => validatePlan({ ...emptyPlan(), drafts: { maps: { status: 'safe', note: '' } } })).toThrow()
    expect(() => validatePlan({ ...emptyPlan(), services: ['unsupported'] })).toThrow()
  })
  it('has Polish translations for every app choice', () => {
    for (const service of services) for (const value of [service.title, service.detail]) expect(polish).toHaveProperty(value)
  })
})

describe('complete validated file bounds', () => {
  for (const [name, text] of [['ASCII', 'a'.repeat(500)], ['Polish letters', 'ą'.repeat(500)], ['emoji', '🙂'.repeat(250)], ['multibyte Unicode', '界'.repeat(500)], ['escaped controls', '\u0000'.repeat(500)]]) {
    it(`roundtrips maximum history, plan note and drafts with ${name}`, async () => {
      let plan = emptyPlan()
      for (const task of tasks) {
        plan = addTask(plan, task.id)
        for (let i = 0; i < 30; i++) plan = record(plan, task.id, 'uncertain', text)
        plan.drafts[task.id] = { status: 'later', note: text }
      }
      plan.note = text
      const file = await encryptPlan(plan, 'A test phrase with unrelated words')
      expect(Buffer.byteLength(file)).toBeLessThanOrEqual(MAX_PLAN_FILE_BYTES)
      expect(await decryptPlan(file, 'A test phrase with unrelated words')).toEqual(plan)
    })
  }
})

describe('AI service boundaries', () => {
  it('cannot add unrelated services or bypass scoped request checks', () => {
    expect(allowedFor(['accounts'], ['whatsapp'])).toEqual(['whatsapp'])
    expect(() => validateRequest({ topics: ['accounts'], services: ['whatsapp'], taskIds: ['devices'], operation: 'plan', text: '', consent: true })).toThrow()
    const request = validateRequest({ topics: ['accounts'], services: ['whatsapp'], taskIds: ['whatsapp'], operation: 'plan', text: '', consent: true })
    expect(() => validateDraft({ taskIds: ['devices'], editedText: '' }, request)).toThrow()
    expect(validateDraft({ taskIds: ['whatsapp'], editedText: '' }, request).taskIds).toEqual(['whatsapp'])
  })
})
