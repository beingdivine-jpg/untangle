import { AccountBadge } from '../features/community/AccountBadge'
import { LockKeyhole } from 'lucide-react'
import { useTranslation } from '../i18n/context'
import { navigate, useNavigation } from '../app/navigation'
import { useSession } from '../app/session'

export function SessionStatus() {
  const { translate } = useTranslation()
  const walkthrough = useNavigation().area === 'walkthrough'
  const state = useSession(), plan = state[state.mode], copy = state.copies[state.mode]
  const label = walkthrough ? 'Walkthrough only · Return to your plan to save' : plan.example ? 'Practice only · Your own plan is separate' : !copy ? 'This tab only · Not saved to a file' : copy.snapshot !== JSON.stringify(plan) ? 'New changes · Download another copy' : copy.checked ? 'Private copy checked · No cloud backup' : 'Download started · Check your file'
  return <><AccountBadge/><div className="session-status"><LockKeyhole size={17} aria-hidden="true"/><span>{translate(label)}</span><button onClick={() => navigate({ area: 'plan', view: walkthrough ? 'plan' : 'save', mode: state.mode })}>{translate(walkthrough ? 'Return to the main plan' : 'Save or open a file')}</button></div></>
}
