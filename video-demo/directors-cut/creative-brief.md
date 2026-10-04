# Creative brief · Your life. Your terms.

## One person, one useful journey

Untangle helps someone separating a shared digital life after a breakup. Maya has changed a password but still has questions about a shared laptop and photo sharing. The film moves from that uncertainty to a manageable plan, explains the limits of one change, preserves an unanswered question, and proves she can return to her progress.

The concrete benefit is less guesswork and a clearer next step, with the user choosing what to keep. A supported planning workflow is the product’s strongest implemented story. The demo does not imply that a password change resolves every connection or that software can establish someone’s safety.

## Final script and edit

| Time | Narration | Visual evidence |
| --- | --- | --- |
| 00–06 | A breakup ends a relationship. Not every digital connection. | A short photographic opening, slow camera drift and concise typography. Accounts, photos and location appear as lingering connections. |
| 06–11 | Meet Untangle. A private guide for your next chapter. | Brand reveal into the implemented introduction. |
| 11–18 | Maya changed her password. But the shared laptop, and their photos? She still has questions. | The actual shared-laptop example, original note and Connect the dots control. |
| 18–27 | Her story becomes six relevant checks. The companion includes preparation, connects related guides, and shows what it used. | The real, labelled local activity trace: three fictional details, six checks, preparation, awaiting the user’s choice. |
| 27–39 | Optional AI can select guides and clarify notes. This prepared example shows the controls: preview the wording, keep your meaning, accept, or undo. | A four-step diagram of the implemented optional AI request path, followed by actual before/after wording, acceptance and undo. The prepared example is labelled throughout. |
| 39–48 | Before changing anything, see what a password change affects, and what it leaves outside. The explanation links to its source. | The product’s effect preview, boundary explanation and Google source link. |
| 48–57 | Keep the steps you choose. An unanswered question stays a question. Reading a guide never marks it reviewed. | Six kept checks, the plan, selection of “I’m not sure what I found,” a deliberate update and “Still a question.” |
| 57–67 | Save an encrypted file. Open it later, and your checks, notes, and questions come back. No account to create. | Actual file creation, reopening, explicit restore confirmation and the restored question. |
| 67–73 | Less guesswork. A clearer next step. And the choice stays yours. | The product’s ink portrait and three restrained benefit reveals. |
| 73–78 | Your life. Your terms. Untangle. | Brand, guided-example invitation and product URL, held through the final frame. |

The [machine-readable script](story.json) defines exact scene boundaries and speech starts. Scenes are shortened in the edit, not presented as an uninterrupted recording.

## Judging criteria review

Weights come from the repository’s summary of the supplied ImpactHer brief in [research section 10](../../public/research.html). The original organizer rubric was not independently supplied or reverified. This is an evidence mapping, not a claimed judge score.

| Criterion | Weight | What the film demonstrates | Boundary |
| --- | --- | --- | --- |
| Idea / innovation | 30% | A coordinated plan across accounts and photos; prerequisite checks; consequences beyond one password; user-controlled AI assistance. 18–48s. | No claim to invent encryption or language models; no account scan. |
| Category relevance | 20% | A recognizable problem after a breakup, grounded in one person’s digital connections. 0–18s and 67–78s. | Maya and the portraits are fictional, not testimonials. |
| Practical usability | 20% | Concrete input, understandable steps, reversible wording, explicit uncertainty, save and return. 11–67s. | Demonstrated functionality, not validated outcomes from user research. |
| Design | 20% | Six-second cinematic entry; warm paper, terracotta, the existing fonts and artwork; readable UI close-ups; consistent motion; captions and a mixed soundtrack. | Visual craft is assessed by inspection, not a usability study. |
| Implementation | 10% | Real captures and state transitions; accepted text can be undone; the encrypted file is opened and restored; frame-accurate render and media checks. 31–67s. | The optional model integration is implemented but no live model is connected in this film. |

This cut spends most of its time on the workflow and its results. It does not spend judging time on an exhaustive feature catalogue, speculative roadmap or unsupported impact metrics.

## Direction and primary references

Research informed the presentation grammar; no reference footage, layouts, logos or music were copied.

- [Linear Agent launch, 24 March 2026](https://linear.app/changelog/2026-03-24-introducing-linear-agent): inspected its official embedded film. Close framing, restrained depth and attention on the input-to-result transition informed the camera moves and enlarged UI regions.
- [Raycast Focus release, 16 January 2025](https://www.raycast.com/changelog/1-89-0): its official problem, focused action and useful result structure informed the short narrative. The written release was reviewed; its video was not used as footage.
- [Granola’s product announcement](https://www.granola.ai/blog/announcement) and [2026 workflow explanation](https://www.granola.ai/blog/how-to-use-ai-to-take-meeting-notes-a-step-by-step-guide-for-2026): the legible transformation from rough input to useful output informed the side-by-side wording sequence and the distinction between user input and an AI draft.

Untangle supplies the identity: Manrope, Archivo and Fraunces; paper, charcoal and terracotta; the thread motif; the fictional photographic portrait and stippled ink artwork. The film translates those assets into a calm cinematic opening, controlled transitions and an optimistic ending appropriate to the subject.

## Implementation evidence

- `src/features/companion/agentCore.ts`: Maya’s exact details and prepared rewrite, supported guide IDs, request validation and preparation dependencies.
- `src/features/companion/Experience.tsx`: explicit preview, acceptance, discard and undo controls; local demo labels.
- `server/agent.ts`: optional consented provider request, bounded catalogue, observable activity events and validated output. The diagram describes this path, not hidden reasoning.
- `src/features/plan/content.ts`: effects, boundaries, preparation and primary-source links.
- `src/features/plan/Platform.tsx`: selected checks, explicit outcomes and restoration.
- `src/features/plan/SavePlan.tsx` and `crypto.ts`: passphrase-protected local file, reopening and explicit replacement.
- `assets/captures/manifest.json`: observed UI and workflow assertions; `output/verification.json`: finished-media validation.

The video, narration, score and edit were authored with AI assistance. Product code, libraries and pre-existing artwork are reused with provenance. This deliverable does not establish hackathon eligibility or constitute a submission.
