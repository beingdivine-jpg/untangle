import { describe, expect, it } from 'vitest'
import { emptyObservations, scenarios } from '../src/domain/scenarios'
import { nextChecks, PASSWORD_EXCEPTIONS, preview, relationships } from '../src/domain/rules'
import { initialState, reducer } from '../src/app/state'
import { imageDimensions, validateImageDimensions } from '../src/features/start/image'

describe('conservative relationship rules', () => {
  it('points a recovery route from the recovery email account toward the account it helps recover', () => {
    const edge = relationships(scenarios.tablet.observations, 'example').find(item => item.id === 'recovery-email')
    expect(edge).toMatchObject({ from: 'Main account', to: 'Backup account', category: 'Example data' })
    const reverse = relationships({ ...scenarios.tablet.observations, account: 'Backup account' }, 'manual').find(item => item.id === 'recovery-email')
    expect(reverse).toMatchObject({ from: 'Backup account', to: 'Main account', category: 'User reported' })
  })
  it('does not promote unknown or absent relationships to established edges', () => {
    expect(relationships(emptyObservations(), 'manual')).toEqual([])
    expect(relationships({ ...emptyObservations(), session: 'not-shown', recovery: 'absent' }, 'manual')).toEqual([])
  })
  it('previews are immutable and switching actions recomputes from original observations', () => {
    const o = structuredClone(scenarios.tablet.observations)
    const before = structuredClone(o)
    Object.freeze(o.reviewed); Object.freeze(o)
    const first = preview(o, 'sign-out')
    expect(first.affectedRelationshipIds).toEqual(['tablet-session'])
    expect(first.unresolved.join(' ')).toContain('Main account is a recovery email for Backup account')
    preview(o, 'recovery-change')
    expect(preview(o, 'sign-out')).toEqual(first)
    expect(o).toEqual(before)
  })
  it('retains password-change exceptions and does not infer sign-out', () => {
    const o = scenarios.password.observations
    expect(o.session).toBe('unknown')
    expect(preview(o, 'sign-out').confidence).toBe('Effect not modeled')
    expect(preview(o, 'sign-out').unresolved).toContain(PASSWORD_EXCEPTIONS)
    expect(PASSWORD_EXCEPTIONS).toContain('verification devices')
    expect(PASSWORD_EXCEPTIONS).toContain('third-party app')
    expect(PASSWORD_EXCEPTIONS).toContain('home devices')
  })
  it('retains the prior recovery route and never certifies it removed based on elapsed time', () => {
    const result = preview(scenarios.tablet.observations, 'recovery-change')
    expect(result.expectedEffect).toContain('seven days')
    expect(result.expectedEffect).toContain('not modeled as immediately removed')
    expect(result.unresolved.join(' ')).toContain('Elapsed time alone does not confirm')
  })
  it('incomplete information yields actionable checks, without modeled effects', () => {
    const o = scenarios.incomplete.observations
    expect(nextChecks(o).length).toBeGreaterThanOrEqual(3)
    expect(preview(o, 'recovery-change').confidence).toBe('Effect not modeled')
    expect(preview(o, 'sign-out').affectedRelationshipIds).toEqual([])
  })
})

describe('review state', () => {
  it('the short guide keeps uncertainty separate from detailed observations and clears on reset', () => {
    let state = reducer(initialState(), { type: 'BEGIN_GUIDE', example: false })
    state = reducer(state, { type: 'GUIDE_STEP', value: 'find' })
    state = reducer(state, { type: 'GUIDE_RESULT', value: 'unsure' })
    expect(state.guide).toEqual({ example: false, step: 'result', result: 'unsure' })
    expect(state.observations).toEqual(emptyObservations())
    expect(state.followups).toEqual([])
    expect(reducer(state, { type: 'RESET' }).guide).toBeNull()
  })
  it('switching from a personal guide to practice clears the personal outcome', () => {
    let state = reducer(initialState(), { type: 'BEGIN_GUIDE', example: false })
    state = reducer(state, { type: 'GUIDE_RESULT', value: 'possibly-in' })
    state = reducer(state, { type: 'BEGIN_GUIDE', example: true })
    expect(state.guide).toEqual({ example: true, step: 'ready', result: null })
    expect(reducer(state, { type: 'MANUAL' }).guide).toBeNull()
    expect(reducer(state, { type: 'EXAMPLE', scenario: 'tablet' }).guide).toBeNull()
  })
  it('keeps visited stages available when answers are revisited, and clears progress for a new example', () => {
    let state = reducer(initialState(), { type: 'EXAMPLE', scenario: 'tablet' })
    state = reducer(state, { type: 'STEP', value: 'followup' })
    state = reducer(state, { type: 'STEP', value: 'review' })
    expect(state.furthestStep).toBe(4)
    expect(state.observations).toEqual(scenarios.tablet.observations)
    state = reducer(state, { type: 'EXAMPLE', scenario: 'incomplete' })
    expect(state.furthestStep).toBe(1)
    expect(reducer(state, { type: 'RESET' }).furthestStep).toBe(0)
  })
  it('returning to topic selection preserves earlier answers and context', () => {
    let state = reducer(initialState(), { type: 'CONCERN', value: 'A device to review' })
    state = reducer(state, { type: 'MANUAL' })
    state = reducer(state, { type: 'TOPIC', value: 'Shared device' })
    state = reducer(state, { type: 'SAFETY', value: 'continue' })
    state = reducer(state, { type: 'ANSWER', key: 'session', value: 'signed-in' })
    state = reducer(state, { type: 'STEP', value: 'start' })
    state = reducer(state, { type: 'START_PHASE', value: 'topic' })
    expect(state.observations.session).toBe('signed-in')
    expect(state.concern).toBe('A device to review')
  })
  it('skip replaces a previous answer with unknown and preserves it as unfinished', () => {
    let state = reducer(initialState(), { type: 'EXAMPLE', scenario: 'tablet' })
    state = reducer(state, { type: 'REVIEWED', key: 'session' })
    state = reducer(state, { type: 'SKIP', key: 'session' })
    expect(state.observations.session).toBe('unknown')
    expect(state.observations.reviewed).not.toContain('session')
    expect(nextChecks(state.observations).join(' ')).toContain('Confirm the selected session')
  })
  it('a reviewed unknown still yields an unresolved next check', () => {
    const state = reducer(initialState(), { type: 'REVIEWED', key: 'session' })
    expect(state.observations.reviewed).toContain('session')
    expect(state.observations.session).toBe('unknown')
    expect(nextChecks(state.observations).length).toBeGreaterThan(0)
  })
  it('follow-up does not change original observations or resolve other routes', () => {
    const state = reducer(initialState(), { type: 'EXAMPLE', scenario: 'tablet' })
    const next = reducer(state, { type: 'FOLLOWUP', value: { id: 'test', action: 'sign-out', value: 'signed-out', at: '2026-10-03T12:00:00Z', category: 'Reported by you' } })
    expect(next.observations).toEqual(state.observations)
    expect(next.observations.recovery).toBe('present')
    expect(next.observations.remaining).toBe('yes')
    expect(next.followups[0].category).toBe('Reported by you')
  })
  it('switching scenarios clears personal context, selections, progress and follow-ups', () => {
    const prior = { ...initialState(), concern: 'private text', question: 4, action: 'recovery-change' as const, safety: 'possibly' as const }
    const next = reducer(prior, { type: 'EXAMPLE', scenario: 'incomplete' })
    expect(next.concern).toBe('')
    expect(next.followups).toEqual([])
    expect(next.question).toBe(0)
    expect(next.action).toBe('sign-out')
    expect(next.safety).toBeNull()
    expect(next.observations).toEqual(emptyObservations())
  })
  it('changing the account clears observations tied to the old account', () => {
    const state = reducer(initialState(), { type: 'EXAMPLE', scenario: 'tablet' })
    const next = reducer(state, { type: 'ACCOUNT', value: 'Backup account' })
    expect(next.observations).toEqual({ ...emptyObservations(), account: 'Backup account' })
  })
})

describe('image preflight', () => {
  it('rejects oversized dimensions before decoding', () => {
    expect(() => validateImageDimensions(10_000, 10_000)).toThrow('too large')
    expect(() => validateImageDimensions(5000, 5000)).toThrow('too large')
    expect(() => validateImageDimensions(0, 400)).toThrow('too large')
    expect(() => validateImageDimensions(4000, 4000)).not.toThrow()
  })
  it('rejects malformed formats', () => {
    expect(() => imageDimensions(new Uint8Array([1, 2, 3]), 'image/png')).toThrow('could not be read')
    expect(() => imageDimensions(new Uint8Array([0xff, 0xd8, 0xff]), 'image/jpeg')).toThrow('could not be read')
  })
  it('reads a PNG header before decoding bitmap data', () => {
    const bytes = new Uint8Array(24)
    const view = new DataView(bytes.buffer)
    view.setUint32(0, 0x89504e47); view.setUint32(4, 0x0d0a1a0a)
    bytes.set([73, 72, 68, 82], 12)
    view.setUint32(16, 1200); view.setUint32(20, 800)
    expect(imageDimensions(bytes, 'image/png')).toEqual([1200, 800])
  })
})
