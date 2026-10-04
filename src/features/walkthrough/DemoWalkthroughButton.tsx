import { Play } from 'lucide-react'
import { navigate, useNavigation } from '../../app/navigation'
import { useTranslation } from '../../i18n/context'
import './walkthrough.css'

export function DemoWalkthroughButton() {
  const route = useNavigation(), { translate } = useTranslation()
  return <button className="demo-tour-launch" onClick={() => navigate({ area: 'tour', returnRoute: route })}>
    <Play size={15} aria-hidden="true"/><span>{translate('Demo walkthrough')}</span>
  </button>
}
