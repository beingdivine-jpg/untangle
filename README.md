# Untangle

The [product demo films](video-demo/README.md) include a new **78-second director’s cut** with a cinematic opening, the AI workflow, reversible wording and encrypted save-and-restore, plus the original exact 60-second edition. Finished MP4s, narration, captions, a judging-criteria review and reproducible compositions are included. Render the new cut with `npm --prefix video-demo run render:director` after the video setup steps; the application commands below are unchanged.

A planning companion for digital life after a breakup, built for the ImpactHer hackathon with React, TypeScript and Vite. It helps someone with little digital experience organise checks across services, understand consequences before making changes, keep unanswered questions, and return later.

Live: **https://untangle-orpin.vercel.app/**. Local: **http://127.0.0.1:5173/**. The [product research report](public/research.html) is also served at **/research.html**. Vercel deployment configuration is included; see the hosting section below.

## Run locally

Tested with Node 24.12 and npm 11.6. The scripted Try Me experience, local planner and retained guide workspace work without an API key, paid service or account connection. Optional live AI uses the local server adapter described below.

```sh
npm ci
npm run dev
```

For a production bundle, use `npm run build`, then `npm run preview` (port 4173).

## Hosting on Vercel

The Vite production bundle is configured by `vercel.json`: `npm ci`, `npm run build`, output `dist`, and Node 24.x. The introduction, scripted Try Me, guides, local planner and private file workflow work on static hosting. `/api/agent/status` explicitly reports live AI unavailable; the development-only OpenAI middleware is not exposed as a public function. Adding an API key to Vercel alone does not enable that middleware.

`.vercelignore` excludes local environment files, Git metadata, build/test artifacts and archived source snapshots from CLI uploads. `.vercel/` stays local and ignored. Deployment headers disable referrers, prevent MIME sniffing and prohibit iframe embedding.

Vercel project **divin-josephs-projects/untangle** is connected to **beingdivine-jpg/untangle** on GitHub. Production URL: **https://untangle-orpin.vercel.app/**. The Git integration deploys updates from `main` to production; successful deployments update the same live link. CLI sign-in and linking are local to the developer's Vercel account; no token belongs in this repository.

```sh
npx vercel login
npx vercel link
npx vercel git connect
npx vercel --prod
```

## Product direction

The research compared Refuge Digital Break-Up, Chayn, myPlan, Apple Safety Check, Google Security Checkup, Bright Sky, eSafety and specialist image-abuse tools. The report distinguishes published user counts, downloads, organisation reach, historical guide usage and research participation; it does not invent comparable active-user metrics. Existing services already provide broad checklists, accessible guidance, native controls and support. A longer checklist alone is not a useful differentiator.

Untangle’s proposed value is coordination and continuity: a cross-service plan with preparation dependencies, consequences, user-reported outcomes, open questions and opt-in local save/resume. This is a product hypothesis, not a claim of global uniqueness or proven safety impact. The report identifies which competitor flows were inspected and the limits of public-documentation comparisons.

## Working features

- An editorial one-page introduction retains the Untangle name and knot logo. **Try Me** starts one of three fictional stories: shared laptop, location sharing, or keeping photos/services.
- A visual thread is an index of selected checks, not an account scan. Visible activity records show inputs, catalogue matching, preparation and the approval boundary. The demo uses synchronous local rules and prepared wording, explicitly labelled; it does not simulate a live provider request.
- “What if I change…” explains effects and limits using existing source-based guidance. This is deterministic decision support, not a predictive ML model or personal danger score.
- The bounded live assistant can select existing guide IDs or simplify one approved note. It cannot change accounts or take external actions. A person reviews exact fields before sending, then separately accepts/rejects the draft. Wording edits have undo.
- Kept checks transfer into the existing full plan; the displayed note transfers to the first check. Fictional examples remain labelled. The plan tools are also directly available at **/?view=plan**.

- Two short setup screens select concerns and relevant services; an unsure route and an other-apps route are available.
- A personal plan presents one next suggested check, all selected checks, status filters and reviewed activity counts (never a safety score).
- Thirteen searchable guides cover recovery, Google devices and password changes, Gmail forwarding, Maps location sharing, Apple Safety Check, content to keep, partner photos, WhatsApp linked devices, Apple Family Sharing, home devices, intimate-image support and trusted-person help.
- Preparation tasks are included automatically: recovery access before relevant account changes, and content preservation before selected sharing changes. The UI explains why; it does not prevent reading or claim universally safe sequencing.
- Each guide separates where to look, effects before a change, and the user’s update. Reading or previewing never marks a check reviewed.
- “Reviewed by me”, “Still a question”, “For later” and “With someone’s help” are explicit user-reported states. A user can revisit a check, replace the current observation and retain up to 30 previous updates.
- Review together collects open questions. Notes are hidden there by default, and nothing is sent automatically.
- Save & resume downloads an optional encrypted plan file and restores a validated file after a separate replacement confirmation. Incorrect passphrases and corrupt files leave the current plan intact.
- Support links include a global directory, UK Refuge, Polish youth support, wider guide libraries and image-abuse specialists. Location is not inferred or requested.
- Maya’s example is visibly fictional across navigation and saved-file restoration.

Provider-specific coverage is limited; this is not an exhaustive security review. The workspace cannot read an account, detect spyware or hidden devices, identify who used a session, change settings, or verify the success of a reported change.

## English and Polish

The visible **English / Polski** control is available in both app headers and on the research pages, including narrow phone layouts. It switches presentation in place: selected topics, drafts, progress and personal notes stay intact. Personal notes and imported records are never automatically translated. The fictional examples have authored Polish text.

Open `/?lang=pl` for Polish, or `/?view=plan&lang=pl` for the plan. The non-sensitive language choice stays in the URL across refreshes and research links; no cookie or browser storage is introduced. A fresh URL without `lang=pl` defaults to English. Leaving or refreshing still clears unsaved work as before.

`src/i18n/pl.json` is the authored Polish catalog, keyed by the English presentation text. Translate UI text at the React rendering boundary with `useTranslation()`; keep stable task/status IDs and user content out of translation. Dynamic messages use numbered placeholders, with more specific patterns taking precedence. Guide search matches localized and English titles; dates use the selected locale. The report has a separate static Polish edition at `public/research-pl.html` with the same evidence and limitations.

Optional AI requests explicitly include the chosen response language in the consent preview and in the validated request. The local server instructs the model to draft in that language. This was tested with fixtures, not real provider inference. UI translation is bundled locally and does not use a translation service. Official Polish terminology was checked against [Apple’s Safety Check guide](https://support.apple.com/pl-pl/guide/personal-safety/-ips2aad835e1/web) , [Google’s recovery guide](https://support.google.com/accounts/answer/183723?hl=pl) and [Google Photos partner-sharing help](https://support.google.com/photos/answer/7378858?hl=pl). No independent human translation review is claimed.

## A two-minute demo

For judges, use the visible **Demo walkthrough** button in the introduction or plan header, or open [the guided demo](https://untangle-orpin.vercel.app/?view=demo&lang=en) directly. Six short stages cover Maya’s story, suggested checks, a sourced change preview, editable wording, explicit approval, and the finished plan. The walkthrough is also available in Polish with `lang=pl`.

Each stage explains the next action and its purpose. Back, restart and exit controls keep the pace in the judge’s hands. The examples are labelled as scripted; the actual local planner builds the draft and its preparation dependencies. No live AI call or account scan occurs. Tour choices stay separate from existing work. **Open example plan** explicitly replaces only the practice plan, with every check still “Not checked yet”; personal notes, unfinished updates and setup choices remain intact.

For free exploration beyond the guided tour:

1. Open **Try Me**. Choose “We shared a laptop.” and **Connect the dots**. Show the labelled local activity record and proposed checks.
2. Try **What if I change…**. Choose a password or photo-sharing change and compare its effect with what remains outside it.
3. Open **Help me put it into words**. Preview Maya’s prepared edit, change the draft, keep it, then undo. Explain that this demonstration is scripted.
4. Return to **Connect the dots**, choose **Keep these steps**, then **Open my full plan**. Every check is still “Not checked yet”; viewing guidance is not completion.
5. In the full plan, keep an uncertain observation, review together with notes hidden, or use the optional encrypted **Save & resume** workflow.

## Optional live AI

No API key is configured in this installation and no real provider inference was exercised during this implementation. Live-path tests use explicit fixtures; they verify controls, not model quality. The UI reports this honestly and keeps the local planner available.

To enable locally, copy `.env.example` to `.env.local`, set `OPENAI_API_KEY` and `OPENAI_MODEL` in that local file, and restart Vite. Never put a secret in a `VITE_` variable, client code, source control, screenshots or chat. The supplied example model is configurable; check its availability for your project. Requests may incur provider charges.

`server/agent.ts` supplies middleware to Vite development and preview servers. It uses the OpenAI Responses API with `store: false`, strict structured JSON output and no provider tools. A browser config check does not call OpenAI. Inference requires same-origin POST, affirmative consent, bounded known topics/task IDs and at most 500 characters of text. Plan requests reject free text. Editing rejects common contact/credential patterns; this is not a complete PII detector. Only reconstructed request fields plus public guide metadata go to the provider; no file, other notes, history or account data is included.

The adapter validates output scope, adds preparation dependencies, keeps edits from changing task selection, caps requests at 12/minute per local address, limits bodies to 12 KB, and aborts after 30 seconds or disconnect. NDJSON events reflect completed validation, a provider request being made, output checking and readiness—not hidden reasoning or invented progress percentages. Client cancellation and generation checks prevent stale updates. Provider refusals and failures do not apply a draft.

Structured output and a small set of content checks do not establish semantic correctness. Review suggested wording before applying it. `store: false` is not zero retention; provider abuse-monitoring records may still be retained. See [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data).

This adapter is **loopback-only**; a static `dist` upload does not include an AI backend. Production use needs authenticated hosting, secure secret management, deployment-level abuse controls, provider-error/retention review, model evaluations, and appropriate youth safeguards. In particular, review [OpenAI’s under-18 guidance](https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance) before exposing live AI to minors. The prototype does not claim this review or real-user validation has been completed.

## Earlier work preserved

Source snapshots:

- [planning-workspace-v4.zip](docs/archive/planning-workspace-v4.zip): the full workspace immediately before this companion redesign.

- [single-check-v3.zip](docs/archive/single-check-v3.zip): the previous beginner device-check version, before this expansion.
- [guided-v2.zip](docs/archive/guided-v2.zip): the previous guided interface.
- [editorial-v1.zip](docs/archive/editorial-v1.zip): the earliest editorial interface.

The slower Google device walkthrough remains available inside the device guide. Its entrance also offers **Open the detailed review**, which retains the original two-account relationship diagram, conditional previews, screenshot reference, fictional scenarios and follow-up records. Direct development/testing entry: **/?view=walkthrough**. Returning to the broader plan preserves it; completing or clearing the older review does not clear the broader plan. Quick exit clears both.

The original domain rules still distinguish a recovery route from proof of access, a session from its user, selected-session sign-out from global sign-out, and reported password changes from verified current state. The previous recovery-information seven-day caveat never becomes a timed safety guarantee.

## Implementation map

| Files | Purpose |
| --- | --- |
| `src/features/plan/Platform.tsx`, `platform.css` | Workspace, setup, library, guide, outcomes, history, review together and support |
| `src/features/plan/content.ts` | Thirteen bounded guides, official source links and preparation relationships |
| `src/features/plan/model.ts` | Pure plan construction, service filtering, sequencing, observations, example and import validation |
| `src/features/plan/crypto.ts`, `SavePlan.tsx` | Local encryption, decryption, download and explicit restore workflow |
| `src/features/companion/` | Introduction, visual index, controlled assistant UI, static previews, validation and streaming client |
| `server/agent.ts`, `vite.config.ts` | Optional loopback OpenAI adapter; server-only configuration |
| `src/app/App.tsx`, `LegacyApp.tsx` | Companion-to-plan integration, retained workflows, exit and lifecycle clearing |
| `src/domain/`, `src/features/guide/` | Retained detailed rules and slower device guide |
| `public/research.html`, `public/research-pl.html` | Evidence, competitor comparison, design rationale, boundaries and validation agenda |

## Privacy and file handling

By default, text, observations, follow-up notes and references exist only in React/browser memory. No localStorage, sessionStorage, IndexedDB, service worker, analytics, session replay, account API or OCR is used. Optional live AI transmits only the separately reviewed fields when explicitly approved; Try Me and the local planner do not call an AI provider. Text is rendered as text, never HTML. Refreshing starts fresh.

The optional saved file contains selected checks, current notes, bounded update history and the fictional-example flag. Web Crypto encrypts the complete payload with AES-256-GCM, a fresh 96-bit IV, and a key derived from a 12–256-character file passphrase using PBKDF2-SHA256 with 310,000 iterations and a fresh 128-bit salt. The passphrase is not included in the file. This implementation has not had an independent security audit.

Imports are limited to 1 MB; format, KDF parameters, IV/salt lengths, task IDs, statuses, note lengths and history are checked. Only known fields are reconstructed. Authenticated decryption must succeed before a pending restore is shown. The user must explicitly replace the existing plan; importing cannot silently overwrite it. An asynchronous save cannot download after its component is unmounted by exit/reset. Password fields clear on successful operation or unmount.

A downloaded file can be found, lost, copied or retained. Untangle cannot recover a forgotten passphrase, remove downloaded copies, or protect an open plan on a monitored device. There is no cloud backup or automatic reminder. Restored observations may be out of date.

The retained detailed review accepts a single local PNG, JPEG or still WebP up to 10 MB, at most 8,000 pixels on either side and 16 million decoded pixels. Dimensions are checked before decoding. Local object URLs are revoked on replacement, removal, reset and exit. This is a local reference, not image analysis or an evidence vault; the new private-image guide does not accept image uploads.

The default local experience uses only local assets/HMR and, in personal mode, a configuration-status request. Fonts are bundled locally. Official links open a new tab without a referrer and are subject to the destination’s privacy policy. Runtime guide instructions are static. Optional approved AI requests are the sole inference path, as described above.

Quick exit synchronously covers content, clears both workspaces and navigates with `location.replace` to Wikipedia. `pagehide` clears and covers the app; a persisted `pageshow` resets before uncovering it. No promise is made about erasing history, caches, downloads, monitoring or network records. OS/browser memory disposal is outside the app’s control.

## Sources and research scope

Primary provider and specialist sources were reviewed on **3 October 2026**. Each guide links to its source; the [research report](public/research.html) gives a cited comparison and evidence-to-feature mapping. Google, Apple, WhatsApp, Refuge, Chayn and the other organisations are not partners or endorsers. Instructions may change with account type, region and software version.

The comparison is desk research plus a bounded browser walkthrough of Refuge’s introduction, menu and location flow. It is not an exhaustive hands-on audit of every competitor. No interviews, real-user validation, measured reduction in harm or global novelty are claimed.

## Validation

```sh
npm run build       # Typecheck and production build
npm run lint
npm test            # 35 unit tests
npm run test:e2e    # 29 Chromium browser suites
```

If Chromium is not installed for Playwright, run `npx playwright install chromium` first.

New unit coverage exercises preparation ordering, service selection, uncertain outcomes, immutable prior state, history limits, untrusted import validation, encrypted roundtrips, randomness, wrong passphrases, tampering and bounded KDF/file handling. Existing domain, reducer and image-preflight tests remain.

New tests cover fictional demo transfers, all three editing stories, immutable previews, no-key fallback, exact-field consent, acceptance/rejection, unsupported output, cancellation, keyboard focus and responsive accessibility. Server tests use a stubbed provider and cover origin/scope/body/rate bounds, storage settings, schema, errors and aborts. Browser coverage also includes personal setup, cross-guide preparation, immutable previews, note visibility in review together, repeat updates, real file download/restore, incorrect passphrases, fictional-mode preservation, request/storage boundaries, quick exit and lifecycle clearing, slower-walkthrough integration, and specialist links. The 14 older suites continue to cover original workflows, image failures, reset, keyboard use and source-navigation behaviour.

Responsive checks cover 320, 390, 768 and 1440 CSS-pixel widths. Axe checks home, plan and guide views; existing audits cover the older flow and help. See [companion audit](docs/companion-accessibility-audit.json), [platform audit](docs/platform-accessibility-audit.json), [older detailed-flow audit](docs/accessibility-audit.json), and [short-guide audit](docs/guide-accessibility-audit.json). These checks are not WCAG certification or a substitute for real screen-reader/mobile testing.

| Companion and retained workspace | Desktop | Phone |
| --- | --- | --- |
| Introduction | [View](docs/screenshots/companion-home-1440.png) | [View](docs/screenshots/companion-home-390.png) |
| Draft and visible activity | [View](docs/screenshots/companion-demo-1440.png) | [View](docs/screenshots/companion-demo-390.png) |
| Full-plan home | [View](docs/screenshots/platform-home-1440.png) | [View](docs/screenshots/platform-home-390.png) |
| Fictional multi-topic plan | [View](docs/screenshots/platform-plan-1440.png) | [View](docs/screenshots/platform-plan-390.png) |
| Before-change guide | [View](docs/screenshots/platform-guide-1440.png) | [View](docs/screenshots/platform-guide-390.png) |

## Remaining product work

- Practitioner and real-user validation, particularly novice comprehension, supported use and safeguarded youth research.
- Independent content, encryption and privacy review; production hosting/security hardening if this is deployed.
- More provider coverage and verified localisation. Current interface language is English; regional support links do not imply translated UI.
- Safari/Firefox, real devices, assistive technologies and broader native page-restoration testing.
- No account integrations, scanning, automated setting changes, live adviser, emergency response, evidence hosting or universal image removal.

The research report maps the supplied hackathon rubric to the demonstrable product and calls out submission-platform inconsistency between the supplied documents. Significant AI assistance, dependencies and pre-existing work must be disclosed accurately; this project does not establish hackathon eligibility or submit anything.

Fonts use Fontsource packages, with SIL Open Font License copies under `public/licenses/`. Lucide supplies interface icons. Research, design, implementation and testing were substantially assisted by Codex. Product inference is optional and disabled when server credentials are absent; the scripted demonstration always runs locally.
