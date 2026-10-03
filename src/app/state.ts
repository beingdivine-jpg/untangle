import { newGuide, type GuideState, type GuideStep, type GuideResult } from '../features/guide/state'
import { emptyObservations, scenarios } from '../domain/scenarios'
import type { Account, CheckId, Followup, Mode, Observations, PreviewAction, SafetyContext, ScenarioId, Step, Topic } from '../domain/types'

export interface State {
  guide: GuideState | null
  active: boolean
  mode: Mode
  scenario: ScenarioId
  step: Step
  startPhase: 'topic' | 'safety'
  furthestStep: number
  question: number
  concern: string
  topic: Topic | null
  safety: SafetyContext | null
  observations: Observations
  action: PreviewAction
  followups: Followup[]
}
export const initialState = (): State => ({ guide: null, active: false, mode: 'manual', scenario: 'tablet', step: 'start', startPhase: 'topic', furthestStep: 0, question: 0, concern: '', topic: null, safety: null, observations: emptyObservations(), action: 'sign-out', followups: [] })
export type Action =
  | { type: 'BEGIN_GUIDE'; example: boolean }
  | { type: 'GUIDE_STEP'; value: GuideStep }
  | { type: 'GUIDE_RESULT'; value: GuideResult }
  | { type: 'RESET' }
  | { type: 'EXAMPLE'; scenario: ScenarioId }
  | { type: 'MANUAL' }
  | { type: 'CONCERN'; value: string }
  | { type: 'TOPIC'; value: Topic }
  | { type: 'START_PHASE'; value: 'topic' | 'safety' }
  | { type: 'SAFETY'; value: SafetyContext }
  | { type: 'STEP'; value: Step }
  | { type: 'QUESTION'; value: number }
  | { type: 'ACCOUNT'; value: Account }
  | { type: 'ANSWER'; key: CheckId; value: string }
  | { type: 'SKIP'; key: CheckId }
  | { type: 'REVIEWED'; key: CheckId }
  | { type: 'ACTION'; value: PreviewAction }
  | { type: 'FOLLOWUP'; value: Followup }

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'BEGIN_GUIDE': return { ...initialState(), active: true, guide: newGuide(action.example) }
    case 'GUIDE_STEP': return state.guide ? { ...state, guide: { ...state.guide, step: action.value } } : state
    case 'GUIDE_RESULT': return state.guide ? { ...state, guide: { ...state.guide, step: 'result', result: action.value } } : state
    case 'RESET': return initialState()
    case 'EXAMPLE': return { ...initialState(), active: true, mode: 'example', scenario: action.scenario, step: 'review', furthestStep: 1, observations: structuredClone(scenarios[action.scenario].observations) }
    case 'MANUAL': return { ...initialState(), active: true, concern: state.concern }
    case 'CONCERN': return { ...state, concern: action.value }
    case 'TOPIC': return { ...state, topic: action.value, startPhase: 'safety', action: action.value === 'Recovery details' ? 'recovery-change' : 'sign-out' }
    case 'START_PHASE': return { ...state, startPhase: action.value }
    case 'SAFETY': return { ...state, safety: action.value, step: 'review', furthestStep: Math.max(state.furthestStep, 1), question: 0 }
    case 'STEP': return { ...state, step: action.value, furthestStep: Math.max(state.furthestStep, ['start', 'review', 'connections', 'preview', 'followup'].indexOf(action.value)) }
    case 'QUESTION': return { ...state, question: action.value }
    case 'ACCOUNT': return action.value === state.observations.account ? state : { ...state, observations: { ...emptyObservations(), account: action.value, passwordChanged: state.observations.passwordChanged }, followups: [] }
    case 'ANSWER': return { ...state, observations: { ...state.observations, [action.key]: action.value } }
    case 'SKIP': return { ...state, observations: { ...state.observations, [action.key]: 'unknown', reviewed: state.observations.reviewed.filter(id => id !== action.key) } }
    case 'REVIEWED': return { ...state, observations: { ...state.observations, reviewed: [...new Set([...state.observations.reviewed, action.key])] } }
    case 'ACTION': return { ...state, action: action.value }
    case 'FOLLOWUP': return { ...state, followups: [...state.followups, action.value] }
  }
}
