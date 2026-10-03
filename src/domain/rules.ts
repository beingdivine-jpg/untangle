import type { Mode, Observations, Prediction, PreviewAction, Relationship } from './types'

export const otherAccount = (account: Observations['account']) => account === 'Main account' ? 'Backup account' : 'Main account'
export const sessionLabels = { 'signed-in': 'Listed as signed in', 'signed-out': 'Listed as signed out', 'not-shown': 'Not shown', unknown: 'Not sure' }
export const recoverySentence = (o: Observations) => `${o.account} is a recovery email for ${otherAccount(o.account)}.`
export const PASSWORD_EXCEPTIONS = 'A password change has exceptions: verification devices, some devices with third-party app access, and connected home devices may remain signed in.'

export function relationships(o: Observations, mode: Mode): Relationship[] {
  const category = mode === 'example' ? 'Example data' : 'User reported'
  const result: Relationship[] = []
  if (o.session === 'signed-in') result.push({ id: 'tablet-session', from: 'Shared tablet', to: o.account, label: 'Listed as signed in', category })
  if (o.recovery === 'present') result.push({ id: 'recovery-email', from: o.account, to: otherAccount(o.account), label: 'Recovery email for', category })
  return result
}

export function nextChecks(o: Observations): string[] {
  const checks: string[] = []
  if (o.session === 'unknown' || o.session === 'not-shown') checks.push(`Confirm the selected session’s current status in ${o.account}. In plain words: look for the tablet and read whether it says signed in or signed out. Not finding it does not prove all access has ended.`)
  if (o.session === 'signed-in') checks.push(`Review the selected Shared tablet session in ${o.account}.`)
  if (o.control === 'unknown') checks.push('Think about whether you still use or control the shared tablet. We can’t check who owns it.')
  if (o.recovery === 'unknown') checks.push(`Check whether ${otherAccount(o.account)} uses ${o.account} as its recovery email.`)
  if (o.recovery === 'present') checks.push(`Review the recovery email configured in ${otherAccount(o.account)}.`)
  if (o.remaining !== 'no') checks.push('Check other signed-in devices and the email or phone number used to recover your account.')
  if (o.passwordChanged) checks.push('Check which devices are still signed in after the password change. Some may stay signed in.')
  return checks
}

export function preview(o: Observations, action: PreviewAction): Prediction {
  const common = {
    prerequisites: ['Think about whether someone noticing the change could cause a problem for you.', 'Before changing recovery details, make sure you still have a way to get back into your account. Read Google’s instructions when you’re ready. Any real change is your choice, outside Untangle.'],
    applicability: 'Google account settings only; available options can vary by account, region and device. Work or school accounts may need administrator guidance.',
    limitations: 'This is a conditional preview. Untangle cannot check account access, identify who used a session, or change settings.',
  }
  if (action === 'sign-out') {
    const modeled = o.session === 'signed-in'
    return { ...common, confidence: modeled ? 'Expected effect' : 'Effect not modeled', explanation: 'Only the selected, reported session is in this preview.', affectedRelationshipIds: modeled ? ['tablet-session'] : [], expectedEffect: modeled ? `If sign-out succeeds in Google, the selected Shared tablet session for ${o.account} should be shown as signed out. Confirm what the settings show afterward.` : 'We don’t know of a signed-in entry to explain yet. First, check whether the selected tablet entry is listed as signed in. You can leave this on your list for later.', unresolved: [...(o.recovery === 'present' ? [recoverySentence(o) + ' Signing out this session does not change that setting.'] : o.recovery === 'unknown' ? ['We still don’t know whether your two email accounts are linked.'] : []), 'Other sign-ins, recovery emails or phone numbers still need their own checks. Signing out does not remove copies of data someone may already have.', ...(o.passwordChanged ? [PASSWORD_EXCEPTIONS] : [])], sourceIds: o.passwordChanged ? ['devices', 'password'] : ['devices'] }
  }
  const modeled = o.recovery === 'present'
  return { ...common, confidence: modeled ? 'Expected effect' : 'Effect not modeled', explanation: `This preview concerns the recovery setting in ${otherAccount(o.account)}.`, affectedRelationshipIds: modeled ? ['recovery-email'] : [], expectedEffect: modeled ? `Changing the recovery email in ${otherAccount(o.account)} can update its configured recovery information. Google may still send codes to previous information for seven days; this route is not modeled as immediately removed.` : 'We don’t know of a recovery email link to explain yet. First check which recovery email is listed in the other account. You can leave this on your list for later.', unresolved: ['Previous recovery information may still receive codes for seven days after a change. Elapsed time alone does not confirm that the route has ended.', 'You’ll need to check the settings again. Untangle can’t confirm that the old email can no longer be used.', 'This explanation doesn’t change the tablet sign-in, other devices, or any recovery settings.'], sourceIds: ['recovery'] }
}
