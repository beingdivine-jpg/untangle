import type { Observations, ScenarioId } from './types'

export const emptyObservations = (): Observations => ({ account: 'Main account', session: 'unknown', control: 'unknown', recovery: 'unknown', remaining: 'unknown', passwordChanged: false, reviewed: [] })
export const scenarios: Record<ScenarioId, { title: string; description: string; observations: Observations }> = {
  tablet: {
    title: 'The shared tablet',
    description: 'Someone stopped sharing a tablet after a breakup. Their Google account is still signed in on it, and that email is also used to help recover a second account.',
    observations: { ...emptyObservations(), session: 'signed-in', control: 'no', recovery: 'present', remaining: 'yes' },
  },
  password: {
    title: 'The password was changed',
    description: 'You changed a password and expected every device to disconnect. Let’s look at what the current settings actually show.',
    observations: { ...emptyObservations(), passwordChanged: true, control: 'no', remaining: 'yes' },
  },
  incomplete: {
    title: 'Some details are missing',
    description: 'Someone isn’t sure which devices are signed in or whether their emails are linked. We can still make a list of what to check, without guessing.',
    observations: emptyObservations(),
  },
}
