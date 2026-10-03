# Untangle

A private planning workspace for digital life after a breakup, built for the ImpactHer hackathon with React, TypeScript and Vite. It helps someone with little digital experience organise checks across services, understand consequences before making changes, keep unanswered questions, and return later.

Open **http://127.0.0.1:5173/**. The [product research report](public/research.html) is also served at **/research.html**. Nothing has been deployed.

## Run locally

Tested with Node 24.12 and npm 11.6. No API keys, backend, paid service or account connection is needed.

```sh
npm ci
npm run dev
```

For a production bundle, use `npm run build`, then `npm run preview` (port 4173).

## Product direction

The research compared Refuge Digital Break-Up, Chayn, Apple Safety Check, Google Security Checkup, Bright Sky, eSafety and specialist image-abuse tools. Existing services already provide broad checklists, accessible guidance, native controls and support. A longer checklist alone is not a useful differentiator.

Untangle’s proposed value is coordination and continuity: a cross-service plan with preparation dependencies, consequences, user-reported outcomes, open questions and opt-in local save/resume. This is a product hypothesis, not a claim of global uniqueness or proven safety impact. The report identifies which competitor flows were inspected and the limits of public-documentation comparisons.

## Working features

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

## A two-minute demo

1. Open **Explore Maya’s example plan** (or **Explore an example plan** on a phone). Her recovery check is reported reviewed, a laptop is still a question, and location sharing is deferred.
2. Open the password guide and **Before a change**. Explain why a password change does not resolve forwarding, location sharing or already-saved copies.
3. Open the photo-sharing guide. Its preparation link leads to deciding what to keep, and its preview explains that saved copies remain.
4. Keep an uncertain update on a check, then open **Review together**. Show how notes are excluded until explicitly selected.
5. Use **Save & resume** with a fictional demonstration passphrase. Download the encrypted file, reopen it, and explicitly choose to replace the current plan. Explain that it records observations, not verified account state.

A personal plan can be built from **Make my own plan** without typing a name, account identifier or password. The only password-like input is an optional file passphrase in Save & resume; it must not be an account password.

## Earlier work preserved

Source snapshots:

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
| `src/app/App.tsx` | Integration, navigation, shared help, exit and page lifecycle clearing |
| `src/domain/`, `src/features/guide/` | Retained detailed rules and slower device guide |
| `public/research.html` | Evidence, competitor comparison, design rationale, boundaries and validation agenda |

## Privacy and file handling

By default, text, observations, follow-up notes and references exist only in React/browser memory. No localStorage, sessionStorage, IndexedDB, service worker, analytics, session replay, account API, OCR, LLM or upload is used. Text is rendered as text, never HTML. Refreshing starts fresh.

The optional saved file contains selected checks, current notes, bounded update history and the fictional-example flag. Web Crypto encrypts the complete payload with AES-256-GCM, a fresh 96-bit IV, and a key derived from a 12–256-character file passphrase using PBKDF2-SHA256 with 310,000 iterations and a fresh 128-bit salt. The passphrase is not included in the file. This implementation has not had an independent security audit.

Imports are limited to 1 MB; format, KDF parameters, IV/salt lengths, task IDs, statuses, note lengths and history are checked. Only known fields are reconstructed. Authenticated decryption must succeed before a pending restore is shown. The user must explicitly replace the existing plan; importing cannot silently overwrite it. An asynchronous save cannot download after its component is unmounted by exit/reset. Password fields clear on successful operation or unmount.

A downloaded file can be found, lost, copied or retained. Untangle cannot recover a forgotten passphrase, remove downloaded copies, or protect an open plan on a monitored device. There is no cloud backup or automatic reminder. Restored observations may be out of date.

The retained detailed review accepts a single local PNG, JPEG or still WebP up to 10 MB, at most 8,000 pixels on either side and 16 million decoded pixels. Dimensions are checked before decoding. Local object URLs are revoked on replacement, removal, reset and exit. This is a local reference, not image analysis or an evidence vault; the new private-image guide does not accept image uploads.

The development server uses only a local asset/HMR connection. Fonts are bundled locally. Official links open a new tab without a referrer and are subject to the destination’s privacy policy. Runtime guide instructions are static; no personal information is sent to an AI.

Quick exit synchronously covers content, clears both workspaces and navigates with `location.replace` to Wikipedia. `pagehide` clears and covers the app; a persisted `pageshow` resets before uncovering it. No promise is made about erasing history, caches, downloads, monitoring or network records. OS/browser memory disposal is outside the app’s control.

## Sources and research scope

Primary provider and specialist sources were reviewed on **3 October 2026**. Each guide links to its source; the [research report](public/research.html) gives a cited comparison and evidence-to-feature mapping. Google, Apple, WhatsApp, Refuge, Chayn and the other organisations are not partners or endorsers. Instructions may change with account type, region and software version.

The comparison is desk research plus a bounded browser walkthrough of Refuge’s introduction, menu and location flow. It is not an exhaustive hands-on audit of every competitor. No interviews, real-user validation, measured reduction in harm or global novelty are claimed.

## Validation

```sh
npm run build       # Typecheck and production build
npm run lint
npm test            # 25 unit tests
npm run test:e2e    # 21 Chromium browser suites
```

If Chromium is not installed for Playwright, run `npx playwright install chromium` first.

New unit coverage exercises preparation ordering, service selection, uncertain outcomes, immutable prior state, history limits, untrusted import validation, encrypted roundtrips, randomness, wrong passphrases, tampering and bounded KDF/file handling. Existing domain, reducer and image-preflight tests remain.

Browser coverage includes personal setup, cross-guide preparation, immutable previews, note visibility in review together, repeat updates, real file download/restore, incorrect passphrases, fictional-mode preservation, request/storage boundaries, quick exit and lifecycle clearing, slower-walkthrough integration, and specialist links. The 14 older suites continue to cover original workflows, image failures, reset, keyboard use and source-navigation behaviour.

Responsive checks cover 320, 390, 768 and 1440 CSS-pixel widths. Axe checks home, plan and guide views; existing audits cover the older flow and help. See [platform audit](docs/platform-accessibility-audit.json), [older detailed-flow audit](docs/accessibility-audit.json), and [short-guide audit](docs/guide-accessibility-audit.json). These checks are not WCAG certification or a substitute for real screen-reader/mobile testing.

| New workspace | Desktop | Phone |
| --- | --- | --- |
| Home | [View](docs/screenshots/platform-home-1440.png) | [View](docs/screenshots/platform-home-390.png) |
| Fictional multi-topic plan | [View](docs/screenshots/platform-plan-1440.png) | [View](docs/screenshots/platform-plan-390.png) |
| Before-change guide | [View](docs/screenshots/platform-guide-1440.png) | [View](docs/screenshots/platform-guide-390.png) |

## Remaining product work

- Practitioner and real-user validation, particularly novice comprehension, supported use and safeguarded youth research.
- Independent content, encryption and privacy review; production hosting/security hardening if this is deployed.
- More provider coverage and verified localisation. Current interface language is English; regional support links do not imply translated UI.
- Safari/Firefox, real devices, assistive technologies and broader native page-restoration testing.
- No account integrations, scanning, automated setting changes, live adviser, emergency response, evidence hosting or universal image removal.

The research report maps the supplied hackathon rubric to the demonstrable product and calls out submission-platform inconsistency between the supplied documents. Significant AI assistance, dependencies and pre-existing work must be disclosed accurately; this project does not establish hackathon eligibility or submit anything.

Fonts use Fontsource packages, with SIL Open Font License copies under `public/licenses/`. Lucide supplies interface icons. Research, design, implementation and testing were substantially assisted by Codex; no AI inference runs in the product.
