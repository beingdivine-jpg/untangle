import { useTranslation } from '../i18n/context'
import { ChevronDown, CircleHelp, Mail, Monitor, UserRound } from 'lucide-react'
import { Privacy, SourceLink } from './Primitives'

export function Help() {
  const { translate } = useTranslation()

  return <div className="help-content">
    <div className="help-intro"><span className="icon-tile lavender"><CircleHelp size={23} aria-hidden="true" /></span><div><h3>{translate("It’s okay to be new to this.")}</h3><p>{translate("Untangle helps you make a plan across accounts, location sharing, photos and things you shared. Choose a concern, read a guide, and keep an update about what you found. It cannot see your accounts, tell who used them, or change settings.")}</p></div></div>
    <div className="glossary"><article><UserRound size={20} aria-hidden="true" /><h3>{translate("Account")}</h3><p>{translate("Your sign-in for a service, such as Gmail. The same account can be open on more than one device.")}</p></article><article><Monitor size={20} aria-hidden="true" /><h3>{translate("Signed in / session")}</h3><p>{translate("An account is open in an app or browser. Google calls each sign-in a session. One device can have several.")}</p></article><article><Mail size={20} aria-hidden="true" /><h3>{translate("Recovery email")}</h3><p>{translate("An email Google may use to help you get back into another account. It does not automatically give someone access.")}</p></article></div>
    <details className="help-answer"><summary>{translate("Do I need to open my Google settings now?")}<ChevronDown size={17} aria-hidden="true" /></summary><p>{translate("No. You can explore Maya’s made-up plan or just read a guide. “Where to look” explains the setting; “Before a change” explains the effects. You decide whether to open an outside website.")}</p></details>
    <details className="help-answer"><summary>{translate("What if I don’t know an answer?")}<ChevronDown size={17} aria-hidden="true" /></summary><p>{translate("Choose “I’m not sure what I found”, “later”, or “with someone’s help” when keeping an update. Uncertainty stays in your plan. In the slower device walkthrough, you can also use “I’m stuck”.")}</p></details>
    <details className="help-answer"><summary>{translate("Will clicking a button change my account?")}<ChevronDown size={17} aria-hidden="true" /></summary><p>{translate("No. Buttons here only move through the guide or record your answers in this tab. Any real account change happens separately in that service’s app or website. “Save & resume” can create a private plan file on your device when you choose Download.")}</p></details>
    <details className="help-answer"><summary>{translate("I’d rather go through this with someone.")}<ChevronDown size={17} aria-hidden="true" /></summary><p>{translate("You can ask a trusted person or adviser to sit with you. “Review together” brings your open checks and questions into one page. Notes are hidden there unless you choose to show them. It does not send or share anything.")}</p><SourceLink id="safety">{translate("General safety information from NNEDV (US)")}</SourceLink></details>
    <Privacy />
  </div>
}
