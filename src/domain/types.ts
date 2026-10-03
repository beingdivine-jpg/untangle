export type Account = 'Main account' | 'Backup account'
export type SessionStatus = 'signed-in' | 'signed-out' | 'not-shown' | 'unknown'
export type Answer = 'yes' | 'no' | 'unknown'
export type RecoveryStatus = 'present' | 'absent' | 'unknown'
export type CheckId = 'session' | 'control' | 'recovery' | 'remaining'
export type ScenarioId = 'tablet' | 'password' | 'incomplete'
export type Mode = 'example' | 'manual'
export type Step = 'start' | 'review' | 'connections' | 'preview' | 'followup'
export type Topic = 'Shared device' | 'Recovery details' | 'Not sure'
export type SafetyContext = 'possibly' | 'unsure' | 'continue' | 'skipped'
export type PreviewAction = 'sign-out' | 'recovery-change'

export interface Observations {
  account: Account
  session: SessionStatus
  control: Answer
  recovery: RecoveryStatus
  remaining: Answer
  passwordChanged: boolean
  reviewed: CheckId[]
}
export interface Relationship {
  id: string
  from: string
  to: string
  label: string
  category: 'User reported' | 'Example data' | 'Not checked'
}
export interface Prediction {
  explanation: string
  affectedRelationshipIds: string[]
  expectedEffect: string
  unresolved: string[]
  prerequisites: string[]
  sourceIds: ('devices' | 'password' | 'recovery')[]
  confidence: 'Expected effect' | 'Effect not modeled'
  applicability: string
  limitations: string
}
export interface Followup {
  id: string
  action: PreviewAction
  value: 'signed-out' | 'signed-in' | 'changed' | 'unchecked' | 'unconfirmed'
  at: string
  category: 'Reported by you'
}
