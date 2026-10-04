# Untangle — Polish final film

78 seconds, 1920 × 1080, 30 fps. Polish narration, burned-in Polish captions, current Polish product captures and an original music bed. The separate [English script](script-english.txt) explains the narration for the project owner.

- [Download MP4](output/untangle-final-pl-78s.mp4)
- [Polish captions](output/untangle-final-pl-78s.srt)
- [Storyboard](output/storyboard.jpg)
- [Verification](output/verification.json)

## Story and current product updates

A breakup does not necessarily end every digital connection. Maya uses **Demo krok po kroku**, reviews six proposed checks and their preparation, sees effects and limits, accepts wording, and approves a plan. The latest **guided help** takes that plan into an instruction, a short understanding check and an explicit user-reported outcome. The final benefit shows the route to human support.

Actual Polish UI regions were captured from a separate production build of the local implementation on 4 October 2026. The product was still being edited concurrently. The captures are a frozen, reproducible snapshot of that checkpoint; later product edits do not change this film. See the [capture manifest](assets/captures/manifest.json) and [source fingerprints](assets/source-snapshot.json).

The optional agent diagram corresponds to `server/coach.ts`: a bounded `read_guide` call retrieves the current authored guide and, where relevant, preparation; validated output explains the step, reason, next action and understanding question. This cut does not show live inference, account access, a real volunteer conversation or a guaranteed safety outcome. The practice label and optional-AI limitation stay visible. No product backend was contacted to fabricate an AI response.

## Reproduce

Use the dependency setup in [the shared video README](../README.md). From the repository root:

```sh
npm --prefix video-demo run render:polish
npm --prefix video-demo run verify:polish
npm --prefix video-demo run storyboard:polish
npm --prefix video-demo run check:polish-player
npm --prefix video-demo run preview:polish
```

Open `http://127.0.0.1:5188/polish-final/`. The MP4 also opens directly from disk. The composition `film.html` needs the local server because it loads its timing data with fetch.

The final render is offline and uses committed captures, voice clips, word timings, fonts and the lossless audio master. `render:polish` renders exactly 2,340 frames. `stills:polish` renders the visual review frames only. No application start/build command was changed.

To update the product captures, run the product separately and then:

```sh
APP_URL=http://127.0.0.1:5173 npm --prefix video-demo run capture:polish
```

This capture path uses fictional data and checks approval, language, guidance, correct learning feedback, uncertainty remaining unreviewed and the support entry. It rejects external requests and provider POSTs. Pointer locations derive from actual captured button centers.

To change narration, edit `story.json`, then run `audio:polish`. New script text goes to Microsoft's Edge speech service using `pl-PL-ZofiaNeural`; unchanged clips are reused. Only fictional narration is sent. Music is synthesized locally without stock samples. Audio is normalized to −16 LUFS; tempo adjustments are listed in `assets/audio/report.json`. Polish Latin Extended glyphs are bundled with the existing licensed fonts.

## Review criteria

- Clear opening: lingering digital connections and risk, without an unsupported greatest-risk claim.
- One concrete journey: situation → proposed checks → limits and wording → approval → practical help.
- Authentic AI explanation: retrieved guidance and bounded suggestions; no simulated live response.
- Latest implemented value: guided instruction, learning feedback, honest outcome and a human-support route.
- Legibility: 1080p composition, large callouts, Polish screenshots, synchronized captions and dedicated review stills.
- Reproducibility: isolated video directory, saved audio/captures and a dedicated render command.

The captured UI files match product commit `c66d821`; the server import-resolution fix after capture changed module extensions, not the agent behavior illustrated in the film.

## Final verification

The delivered MP4 passed a complete decode of all 2,340 frames, exact 78.000-second movie timing, H.264/yuv420p video, stereo AAC at 48 kHz, no unexpected black frames, and 33 caption cues matching the Polish narration. Encoded audio measures −16.02 LUFS and −1.49 dBTP. Full-size composition stills and decoded MP4 frames were visually inspected.

Both the main player and the dedicated Polish preview passed metadata, chapter seeking, 390-pixel mobile layout, English-script download, MP4 download hash and byte-range streaming checks. The existing 60-second and English director's-cut media checks still pass. Video lint and all 76 unit tests passed. This is automated technical and editorial verification, not an independent native-speaker review or an evaluation of live AI quality.
