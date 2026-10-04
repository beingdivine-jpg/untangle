import { useTranslation } from '../../i18n/context'
import { useEffect, useRef, useState } from 'react'
import { Download, FolderOpen, LockKeyhole } from 'lucide-react'
import { Button } from '../../components/Primitives'
import { decryptPlan, encryptPlan, MAX_PLAN_FILE_BYTES } from './crypto'
import { markCopy, confirmCopy } from '../../app/session'
import type { Plan } from './model'
export function SavePlan({ plan, restore, saveOnly = false }: { plan: Plan; restore: (plan: Plan) => void; saveOnly?: boolean }) {
  const { translate } = useTranslation()

  const [passphrase, setPassphrase] = useState(''), [confirm, setConfirm] = useState(''), [openPassword, setOpenPassword] = useState('')
  const [file, setFile] = useState<File | null>(null), [pending, setPending] = useState<Plan | null>(null)
  const [message, setMessage] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const [showSave, setShowSave] = useState(false), [showOpen, setShowOpen] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (busy) return; setMessage(''); setError('')
    if (passphrase !== confirm) { setError('The two passphrases do not match.'); return }
    setBusy(true)
    try {
      const encrypted = await encryptPlan(plan, passphrase)
      if (!alive.current) return
      const url = URL.createObjectURL(new Blob([encrypted], { type: 'application/json' }))
      const a = document.createElement('a'); a.href = url; a.download = 'my-plan.untangle'; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setPassphrase(''); setConfirm(''); setMessage('Download started. Check your Downloads folder before leaving this tab.'); markCopy(plan); setDownloaded(true)
    } catch (err) { if (alive.current) setError(err instanceof Error ? err.message : 'The plan could not be saved.') }
    finally { if (alive.current) setBusy(false) }
  }
  async function open(e: React.FormEvent) {
    e.preventDefault(); if (busy) return; setError(''); setMessage(''); setPending(null)
    if (!file) { setError('Choose your .untangle file first.'); return }
    if (file.size > MAX_PLAN_FILE_BYTES) { setError('This file is too large. Choose an Untangle plan under 2 MB.'); return }
    setBusy(true)
    try {
      const result = await decryptPlan(await file.text(), openPassword)
      if (alive.current) { setPending(result); if (JSON.stringify(result) === JSON.stringify(plan)) confirmCopy(); setOpenPassword('') }
    } catch (err) { if (alive.current) setError(err instanceof Error ? err.message : 'This plan could not be opened.') }
    finally { if (alive.current) setBusy(false) }
  }
  return <>
    <header className="p-page-heading"><span className="p-eyebrow">{translate("COME BACK WHEN YOU WANT")}</span><h1 id="platform-heading" tabIndex={-1}>{translate("Keep your place.")}</h1><p>{translate("Your plan stays in this tab until you leave or refresh. To return another day, you can choose to save a password-protected file.")}</p></header>
    <div className="p-notice"><LockKeyhole size={20} aria-hidden="true"/><p>{translate("The file stays wherever you download it. Its contents are encrypted, but someone may still see that the file exists. Use a passphrase you can remember; we cannot recover it.")}</p></div>
    <p>{translate("This password opens your file. It is not an Untangle login, and it is not sent to a server.")}</p><div className={`p-save-grid${saveOnly ? " p-save-grid--single" : ""}`}>
      <form aria-busy={busy} className="p-panel p-form" onSubmit={save}><Download size={25} aria-hidden="true"/><h2>{translate("Save a private copy")}</h2><p>{translate("Includes your selected checks, plan note, unfinished draft updates and previous updates")}{translate(plan.example ? ' from this fictional example' : '')}.</p><label htmlFor="save-password">{translate("Create a file passphrase")}</label><input disabled={busy} id="save-password" type={showSave ? "text" : "password"} autoComplete="new-password" value={passphrase} minLength={12} maxLength={256} required onChange={e => setPassphrase(e.target.value)} aria-describedby="pass-hint"/><small id="pass-hint">{translate("At least 12 characters. A few unrelated words work well. Don’t use your account password.")}</small><label htmlFor="save-confirm">{translate("Repeat the file passphrase")}</label><input disabled={busy} id="save-confirm" type={showSave ? "text" : "password"} autoComplete="new-password" value={confirm} maxLength={256} required onChange={e => setConfirm(e.target.value)}/><button type="button" className="password-toggle" disabled={busy} aria-pressed={showSave} onClick={() => setShowSave(!showSave)}>{translate(showSave ? "Hide file passphrase" : "Show file passphrase")}</button><Button disabled={busy || !Object.keys(plan.entries).length}>{translate("Download private plan")}</Button>{!Object.keys(plan.entries).length && <small>{translate("Add a check to your plan first.")}</small>}</form>
      {!saveOnly && <form aria-busy={busy} className="p-panel p-form" onSubmit={open}><FolderOpen size={25} aria-hidden="true"/><h2>{translate("Open a saved plan")}</h2><p>{translate("Choose a file you saved before. It opens on this device; it is not uploaded.")}</p><label htmlFor="plan-file">{translate("Your .untangle file")}</label><input disabled={busy} id="plan-file" type="file" accept=".untangle,application/json" onChange={e => { setFile(e.target.files?.[0] ?? null); setPending(null); setError('') }} required/><label htmlFor="open-password">{translate("Its file passphrase")}</label><input disabled={busy} id="open-password" type={showOpen ? "text" : "password"} autoComplete="off" value={openPassword} maxLength={256} required onChange={e => setOpenPassword(e.target.value)}/><button type="button" className="password-toggle" disabled={busy} aria-pressed={showOpen} onClick={() => setShowOpen(!showOpen)}>{translate(showOpen ? "Hide file passphrase" : "Show file passphrase")}</button><Button secondary disabled={busy}>{translate("Open private plan")}</Button></form>}
    </div>
    {busy && <p role="status" className="p-notice">{translate("Working on this device…")}</p>}{error && <p role="alert" className="p-notice">{translate(error)}</p>}{message && <p role="status" className="p-notice">{translate(message)}</p>}
    {downloaded && !saveOnly && <section className="save-rehearsal"><h2>{translate('Check your copy before leaving')}</h2><ol><li>{translate('Find my-plan.untangle in your browser downloads or device Files app.')}</li><li>{translate('Use “Open a saved plan” on this page to select that file and enter its passphrase.')}</li><li>{translate('If the preview opens, your file and passphrase work. You can keep your current plan instead of replacing it.')}</li></ol><p>{translate('We cannot see whether your device kept the file. A download is not a cloud backup.')}</p></section>}
    {pending && <section className="p-panel p-restore"><p role="status">{translate("File opened successfully. Keep this file and its passphrase to return later.")}</p><h2>{translate("Ready to open ")}{translate(pending.example ? 'a fictional example' : 'your saved plan')}</h2><p>{Object.keys(pending.entries).length}{translate(" checks found. This replaces the matching personal or example plan in this tab. You can undo it during this session. Save a private copy first if you want to keep both.")}</p><div className="p-actions"><Button disabled={busy} onClick={() => restore(pending)}>{translate("Use this saved plan")}</Button><Button secondary disabled={busy} onClick={() => setPending(null)}>{translate("Keep current plan")}</Button></div></section>}
    <p className="p-footnote">{translate("Untangle has no cloud backup or automatic reminders. “Leave this page” clears this tab, but cannot delete downloaded files or browser history. Encryption cannot protect information while it is open on a monitored device.")}</p>
  </>
}
