# Untangle · Your life. Your terms.

The **78.000-second director’s cut**: 1920 × 1080, 30 fps, **2,340 frames**, H.264 video, stereo AAC, English narration, an original score and burned-in captions. This expanded film follows the user’s revised limit of 1 minute 20 seconds. The [original exact 60-second film](../output/untangle-60s.mp4) remains available.

The agentic explanation identifies four concrete roles: **AI selects useful checks → app logic adds preparation → AI clarifies a note → the user reviews.** Revised narration connects those capabilities to Maya’s situation. The [capability map](creative-brief.md#where-the-agentic-assistance-fits) ties each role to its implementation.

## Watch

- [Final MP4](output/untangle-directors-cut-78s.mp4)
- [Storyboard](output/storyboard.jpg) · [poster](output/poster.jpg)
- [SRT](output/untangle-directors-cut-78s.srt) · [WebVTT](output/untangle-directors-cut-78s.vtt)
- [Verification report](output/verification.json)
- [Script, evidence and judging criteria](creative-brief.md)

Run `npm --prefix video-demo run preview` from the repository root, then open `http://127.0.0.1:5188`. The player features this cut, chapter navigation and downloads. The editable composition is `/directors-cut/film.html?frame=990`.

## Reproduce

The ordinary application commands and dependencies are unchanged. After the [shared video dependency setup](../README.md#reproduce-the-mp4), run from the repository root:

```sh
npm --prefix video-demo run render:director
npm --prefix video-demo run verify:director
npm --prefix video-demo run storyboard:director
```

Rendering uses the committed UI captures, fonts, narration, captions and lossless audio master. It needs no API key, running product or network after dependencies are installed. `render:director` renders every frame explicitly, including the review stills used by `storyboard:director`. `stills:director` provides a faster visual check. Intermediate PNGs and caches are ignored; the final MP4, poster, storyboard and subtitles are committed.

For a product recapture, run the normal development server in one terminal, then:

```sh
APP_URL=http://127.0.0.1:5173 npm --prefix video-demo run capture:director
```

The capture script exercises actual controls using Maya’s fictional example. It verifies six selected checks; unchanged text during the wording preview; accepted wording and undo; an uncertain check remaining unreviewed; private notes hidden in the shared review; an encrypted download without plaintext; and the restored checks, note and uncertainty. It rejects browser errors, external requests and provider POSTs. To rerun those assertions without replacing the captures, append `-- --verify-only`.

The capture manifest records source selectors, dimensions and button centers. After changing the product or crop sizes, review the composition and pointer positions before rendering. [Source fingerprints](assets/source-snapshot.json) record the product files behind this edition; the committed captures are the authoritative visual snapshot for reproducing it.

Edit [story.json](story.json) to change narration, then run `npm --prefix video-demo run audio:director` before rendering. Unchanged voice clips are reused locally. New text uses Microsoft’s online Edge speech service (`en-GB-SoniaNeural`); only the fictional script is submitted. Original MP3s and word timings are included. A few segments receive a small tempo adjustment to fit their scene; exact values are in [the audio report](assets/audio/report.json).

The score combines original synthesized pads, bells, a restrained 90 BPM pulse and seeded transition sweeps. It ducks under the narration and fades out before the end. No stock music or third-party recordings are used. The final AAC audio is measured against −16 LUFS and a true peak below −1 dBTP. Captions follow the voice word timings.

## Fidelity

The film is an edited composition of real UI captures with animated pointers and editorial callouts. The opening uses existing fictional photographic artwork with camera motion; it is not a recording of a real user. [Artwork provenance](assets/artwork-provenance.json) and bundled font licenses are included.

**No live model was configured for this recording.** The demo trace uses deterministic local rules, and the wording example is prepared in the product. Both are labelled on screen; narration calls the wording prepared. The four-role diagram summarizes capabilities in `server/agent.ts` and `agentCore.ts`. Planning and editing are separate user-triggered operations; the cards do not imply four automatic AI calls. The film makes no claim of account scanning, automatic account changes, guaranteed safety, measured AI quality, user adoption or research outcomes.

Verification reads MP4 timing tables, decodes all 2,340 frames, checks dimensions and frame rate, measures the encoded audio, detects unexpected black frames, validates caption timing and confirms the exact caption transcript. The original 60-second commands continue to work independently.

The delivered master passed all media checks: **78.000 seconds**, **−16.01 LUFS**, **−4.19 dBTP**, 30 matching caption cues and no unexpected black frames. Full-size composition frames and decoded MP4 frames were inspected. [Playback checks](output/playback-check.json) cover metadata, chapter seeking, a 390-pixel mobile viewport, the nested player route and the original 60-second edition. This revision passed video lint and all 59 unit tests. The product build and filmed workflow assertions passed at the original capture checkpoint; the unchanged UI captures retain that evidence.
