import { useTranslation } from '../../i18n/context'
import { useEffect, useRef, useState } from 'react'
import { Download, FolderOpen, LockKeyhole } from 'lucide-react'
import { Button } from '../../components/Primitives'
import { decryptPlan, encryptPlan } from './crypto'
import type { Plan } from './model'
export function SavePlan({ plan, restore }: { plan: Plan; restore: (plan: Plan) => void }) {
  const { translate } = useTranslation()

  const [passphrase, setPassphrase] = useState(''), [confirm, setConfirm] = useState(''), [openPassword, setOpenPassword] = useState('')
  const [file, setFile] = useState<File | null>(null), [pending, setPending] = useState<Plan | null>(null)
  const [message, setMessage] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  async function save(e: React.FormEvent) {
    e.preventDefault(); setMessage(''); setError('')
    if (passphrase !== confirm) { setError('The two passphrases do not match.'); return }
    setBusy(true)
    try {
      const encrypted = await encryptPlan(plan, passphrase)
      if (!alive.current) return
      const url = URL.createObjectURL(new Blob([encrypted], { type: 'application/json' }))
      const a = document.createElement('a'); a.href = url; a.download = 'my-plan.untangle'; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setPassphrase(''); setConfirm(''); setMessage('Your private copy was downloaded. You will need its passphrase to open it again.')
    } catch (err) { if (alive.current) setError(err instanceof Error ? err.message : 'The plan could not be saved.') }
    finally { if (alive.current) setBusy(false) }
  }
  async function open(e: React.FormEvent) {
    e.preventDefault(); setError(''); setMessage(''); setPending(null)
    if (!file) { setError('Choose your .untangle file first.'); return }
    if (file.size > 1000000) { setError('This file is too large. Choose an Untangle plan under 1 MB.'); return }
    setBusy(true)
    try {
      const result = await decryptPlan(await file.text(), openPassword)
      if (alive.current) { setPending(result); setOpenPassword('') }
    } catch (err) { if (alive.current) setError(err instanceof Error ? err.message : 'This plan could not be opened.') }
    finally { if (alive.current) setBusy(false) }
  }
  return <>
    <header className="p-page-heading"><span className="p-eyebrow">{translate("COME BACK WHEN YOU WANT")}</span><h1 id="platform-heading" tabIndex={-1}>{translate("Keep your place.")}</h1><p>{translate("Your plan stays in this tab until you leave or refresh. To return another day, you can choose to save a password-protected file.")}</p></header>
    <div className="p-notice"><LockKeyhole size={20} aria-hidden="true"/><p>{translate("The file stays wherever you download it. Its contents are encrypted, but someone may still see that the file exists. Use a passphrase you can remember; we cannot recover it.")}</p></div>
    <div className="p-save-grid">
      <form className="p-panel p-form" onSubmit={save}><Download size={25} aria-hidden="true"/><h2>{translate("Save a private copy")}</h2><p>{translate("Includes your selected checks, notes and previous updates")}{translate(plan.example ? ' from this fictional example' : '')}.</p><label htmlFor="save-password">{translate("Create a file passphrase")}</label><input id="save-password" type="password" autoComplete="new-password" value={passphrase} minLength={12} maxLength={256} required onChange={e => setPassphrase(e.target.value)} aria-describedby="pass-hint"/><small id="pass-hint">{translate("At least 12 characters. A few unrelated words work well. Don’t use your account password.")}</small><label htmlFor="save-confirm">{translate("Repeat the file passphrase")}</label><input id="save-confirm" type="password" autoComplete="new-password" value={confirm} maxLength={256} required onChange={e => setConfirm(e.target.value)}/><Button disabled={busy || !Object.keys(plan.entries).length}>{translate("Download private plan")}</Button>{!Object.keys(plan.entries).length && <small>{translate("Add a check to your plan first.")}</small>}</form>
      <form className="p-panel p-form" onSubmit={open}><FolderOpen size={25} aria-hidden="true"/><h2>{translate("Open a saved plan")}</h2><p>{translate("Choose a file you saved before. It opens on this device; it is not uploaded.")}</p><label htmlFor="plan-file">{translate("Your .untangle file")}</label><input id="plan-file" type="file" accept=".untangle,application/json" onChange={e => { setFile(e.target.files?.[0] ?? null); setPending(null); setError('') }} required/><label htmlFor="open-password">{translate("Its file passphrase")}</label><input id="open-password" type="password" autoComplete="off" value={openPassword} maxLength={256} required onChange={e => setOpenPassword(e.target.value)}/><Button secondary disabled={busy}>{translate("Open private plan")}</Button></form>
    </div>
    {busy && <p role="status" className="p-notice">{translate("Working on this device…")}</p>}{error && <p role="alert" className="p-notice">{translate(error)}</p>}{message && <p role="status" className="p-notice">{translate(message)}</p>}
    {pending && <section className="p-panel p-restore"><h2>{translate("Ready to open ")}{translate(pending.example ? 'a fictional example' : 'your saved plan')}</h2><p>{Object.keys(pending.entries).length}{translate(" checks found. Opening this file will replace the plan currently in this tab. Save your current plan first if you want to keep it.")}</p><div className="p-actions"><Button onClick={() => restore(pending)}>{translate("Use this saved plan")}</Button><Button secondary onClick={() => setPending(null)}>{translate("Keep current plan")}</Button></div></section>}
    <p className="p-footnote">{translate("Untangle has no cloud backup or automatic reminders. “Leave this page” clears this tab, but cannot delete downloaded files or browser history. Encryption cannot protect information while it is open on a monitored device.")}</p>
  </>
}
