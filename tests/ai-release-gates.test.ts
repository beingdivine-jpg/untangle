import { describe, it, expect } from 'vitest'
import fixtures from '../docs/quality/ai-evaluation-cases.json'
import { validateDraft, validateRequest } from '../src/features/companion/agentCore'

describe('bilingual structural AI regression fixtures (not a live-model evaluation)', () => {
  for (const fixture of fixtures.guardCases) {
    it(`rejects ${fixture.locale} ${fixture.reason}`, () => {
      const request = validateRequest({ locale: fixture.locale, operation: 'edit', topics: ['accounts'], services: ['google'], taskIds: ['devices'], text: 'A fictional question.', consent: true })
      expect(() => validateDraft({ taskIds: ['devices'], editedText: fixture.text }, request)).toThrow()
    })
  }
  it('retains bilingual semantic cases for independent review before live AI is enabled', () => {
    expect(fixtures.cases.filter(row => row.locale === 'en')).toHaveLength(6)
    expect(fixtures.cases.filter(row => row.locale === 'pl')).toHaveLength(6)
    // This false flag is deliberate: schema/regex checks cannot prove meaning preservation.
    expect(fixtures.liveModelEvaluated).toBe(false)
  })
})
