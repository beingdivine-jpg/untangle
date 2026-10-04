# Untangle · Product demo films

**Featured: [Your life. Your terms. — the 78-second director’s cut](directors-cut/README.md).** This expanded edition follows the revised 80-second maximum: a cinematic opening, visible processing, the optional AI workflow, before/after wording with undo, consequence checks and an actual encrypted save-and-restore. [Watch the MP4](directors-cut/output/untangle-directors-cut-78s.mp4), or review the [script and judging-criteria mapping](directors-cut/creative-brief.md).

Use `npm --prefix video-demo run render:director` and `verify:director` after the setup below. `npm --prefix video-demo run preview` features the new cut. Both editions remain isolated from normal application commands.

## Original edition · A little less tangled

A complete **60.000-second** product film, rendered at **1920 × 1080, 30 fps**: exactly **1,800 frames**, H.264 video and stereo AAC audio. English narration, an original ambient score, gentle interaction cues and burned-in captions are included.

## Watch and share

- [Final MP4](output/untangle-60s.mp4)
- [Storyboard](output/storyboard.jpg) and [poster](output/poster.jpg)
- [SRT captions](output/untangle-60s.srt) and [WebVTT captions](output/untangle-60s.vtt)
- [Machine-readable verification](output/verification.json)

From the repository root, `npm --prefix video-demo run preview` opens a local server at `http://127.0.0.1:5188`. The root page features the new director’s cut; visit `/original.html` for this original edition’s player, chapters and downloads. The viewer uses the MP4’s burned-in captions; sidecar subtitles are provided for reuse. To inspect this edition’s editable composition, visit `/film.html?frame=690` on the same server.

## Story and creative direction

Untangle is a planning companion for people separating a shared digital life after a breakup. The implemented product’s strongest journey is Maya’s shared laptop story: she changed a password, but still has questions about the laptop and shared photos. The film follows that one situation through a local draft, preparation steps, a before-change preview, a kept question and an optional encrypted file.

| Time | Beat | What the viewer sees |
| --- | --- | --- |
| 00–07 | The problem | The digital ties that linger: a shared laptop, password and photos |
| 07–12 | The product | Untangle’s real introduction and planning companion |
| 12–20 | Maya’s input | “We shared a laptop,” her fictional note, and Connect the dots |
| 20–28 | A useful proposal | Six actual checks; preparation included; Maya chooses Keep these steps |
| 28–37 | Understand before deciding | The real password-change explanation, its limits and recovery preparation |
| 37–46 | A useful result | Her plan, an explicit uncertain outcome and “Still a question” |
| 46–53 | Continue later | The actual encrypted-file form and a verified fictional download |
| 53–60 | Invitation | Your pace. Your permission. Try Maya’s story. |

The voice script and exact scene boundaries are in [story.json](story.json). Captions use the synthesized voice’s word timings, with non-overlapping cues. Narration plays at its natural rate; the script was shortened to leave breathing room.

The visual direction follows the product: Fraunces and Manrope, warm paper, dark brown/plum ink, terracotta thread lines, restrained sage and lavender. The knot path comes from `src/components/Thread.tsx`; palette values come from `src/styles/tokens.css` and the companion stylesheet. Actual UI regions are captured at double pixel density, then cropped, enlarged and animated inside an editorial composition. This is an edited demonstration, not an uninterrupted screen recording. Animated pointers are aligned to recorded button centers.

## Reproduce the MP4

Run these commands from the repository root. Use Node 24 and Python 3.9–3.12 with the pinned dependencies (this delivery used Python 3.9).

```sh
npm ci
npx playwright install chromium
python3 -m venv video-demo/.venv
video-demo/.venv/bin/pip install -r video-demo/requirements.txt
npm --prefix video-demo run render
npm --prefix video-demo run verify
npm --prefix video-demo run storyboard
```

The render reuses the committed UI captures, fonts, captions and lossless audio master. **No running app, API key, speech request or network connection is needed during rendering** once dependencies and Chromium are installed. The resulting video has deterministic frame timing; encoded file hashes may differ across Chromium, FFmpeg or OS versions.

On Windows, create the venv with `py -m venv video-demo/.venv` and install through `video-demo/.venv/Scripts/python.exe -m pip`. The Node renderer detects that venv layout. Run audio/storyboard Python scripts using that interpreter directly. `VIDEO_PYTHON` can select another interpreter; `FFMPEG` can select an existing FFmpeg binary. Linux Chromium may need Playwright’s documented OS dependencies.

`npm --prefix video-demo run stills` renders only the review frames. These intermediate PNGs live in ignored `output/stills/`; the shareable storyboard and poster are tracked. The film renders each frame explicitly through `window.renderFrame(frame)` before encoding, so wall-clock delays cannot change its duration.

### Update the product captures

Start the ordinary application in one terminal:

```sh
npm run dev -- --host 127.0.0.1 --port 5173
```

Then run:

```sh
APP_URL=http://127.0.0.1:5173 npm --prefix video-demo run capture
```

The capture script uses only Maya’s fictional example, clicks real controls and asserts that six checks are kept, an uncertain check stays unreviewed, notes are hidden in Review together, and an AES-GCM encrypted download contains no plaintext note or passphrase. It also rejects browser errors, external requests and provider POSTs. The temporary encrypted file is not committed. A fixed, explicitly fictional file passphrase exists only in the capture script; it is not an account credential.

Capture outputs and exact source selectors/text are recorded in [assets/captures/manifest.json](assets/captures/manifest.json). If the app changes, review the resulting crop dimensions and cursor positions in `film.html` / `film.mjs` before rendering again. Source fingerprints for the delivered captures are in [assets/source-snapshot.json](assets/source-snapshot.json).

### Update the narration, score or captions

Edit `story.json`, then run:

```sh
npm --prefix video-demo run audio
npm --prefix video-demo run render
npm --prefix video-demo run verify
npm --prefix video-demo run storyboard
```

`audio.py` reuses unchanged narration MP3s and regenerates the deterministic score, lossless master and subtitle files locally. Changed narration is synthesized through the online Microsoft Edge speech service with the `en-GB-SoniaNeural` voice. Only the fictional script is submitted. `--refresh-voice` forces resynthesis; this is optional and depends on that external service’s availability. Each original MP3 and its word timings are committed, so reproduction does not depend on the service.

The original score is generated from sine-based pads and soft bell tones in C major, with no stock music or third-party samples. The stereo master targets −16 LUFS and −1.5 dBTP. Verification measures the final AAC track, rather than assuming the master’s values survive encoding. Original score generation is in `scripts/audio.py`; font license files are included beside the reused fonts.

## Fidelity and verification

The current implementation is authoritative. Sources inspected include the repository README, `src/features/companion/Experience.tsx`, `agentCore.ts`, `ThreadScene.tsx`, `src/features/plan/content.ts`, `Platform.tsx`, `SavePlan.tsx`, `crypto.ts`, their tests and existing project screenshots.

The film keeps the product’s important boundaries visible:

- Maya is fictional, and the demonstration uses local rules and prepared content.
- A guide index is not an account scan. The film shows no account connection or live AI inference.
- The password explanation describes an implemented preview; no account setting is changed.
- “Still a question” is a user-reported state. The check is not silently marked reviewed or safe.
- Saving is an optional encrypted local file, not cloud storage or automatic persistence.

`verify.mjs` reads MP4 timing tables to assert **60 seconds and 1,800 video samples**, decodes every frame, checks full-HD dimensions, measures AAC loudness/true peak, detects unexpected black frames, validates caption timing and checks that the caption transcript exactly matches the narration script. The captured workflow has independent assertions. Full-size frames were visually inspected for framing, readability and cursor placement; the final slate remains visible through frame 1799.

The existing application’s start and build scripts, dependencies and source code are unchanged. All video data and tooling are isolated here. `.vercelignore` excludes this deliverable from normal CLI deployment uploads; the film is not automatically added to the product’s website.
