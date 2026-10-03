export type GuideStep = 'ready' | 'recognize' | 'open' | 'find' | 'read' | 'result'
export type GuideResult = 'signed-out' | 'possibly-in' | 'not-found' | 'unsure' | 'paused'
export interface GuideState {
  example: boolean
  step: GuideStep
  result: GuideResult | null
}

export const newGuide = (example: boolean): GuideState => ({ example, step: 'ready', result: null })

export const guideResults: Record<GuideResult, { title: string; explanation: string; next: string }> = {
  'signed-out': {
    title: 'That entry says “Signed out”.',
    explanation: 'That is what you saw for this one entry. It doesn’t tell us about other devices or other ways into your account.',
    next: 'You can stop here. Another time, you can look at the other entries in Google’s device list.',
  },
  'possibly-in': {
    title: 'This entry may still be signed in.',
    explanation: 'It might still be able to open your Google account. The listing cannot tell us who used it.',
    next: 'Before deciding what to do, you can read what signing out would change below.',
  },
  'not-found': {
    title: 'You didn’t spot that device.',
    explanation: 'It might appear under a different name. Not finding it doesn’t tell us whether all access has ended.',
    next: 'If you want help, ask someone you trust to look through the list with you. You don’t need to give them your password.',
  },
  unsure: {
    title: 'You don’t have to guess.',
    explanation: 'We haven’t worked out what this entry means yet. It’s okay to leave it here.',
    next: 'If you want help, ask someone you trust to look at the device list with you. Keep your password to yourself.',
  },
  paused: {
    title: 'You can leave this for now.',
    explanation: 'You don’t need to open any settings or make a decision today.',
    next: 'You can read a made-up example instead, or come back when you feel ready.',
  },
}
