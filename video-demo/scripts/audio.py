"""Author speech, captions and an original, deterministic ambient score.

Existing narration MP3s are reused. --refresh-voice resynthesizes only this
fictional script using Microsoft's online Edge speech service.
"""
import asyncio
import json
from pathlib import Path
import re
import subprocess
import sys
import wave

import edge_tts
import imageio_ffmpeg
import numpy as np

BASE = Path(__file__).resolve().parents[1]
CUT = next((arg.split('=', 1)[1] for arg in sys.argv if arg.startswith('--cut=')), '')
if CUT and not re.fullmatch(r'[a-z0-9-]+', CUT):
    raise ValueError('Use a named video cut directory.')
ROOT = BASE / CUT
ASSETS = ROOT / 'assets' / 'audio'
CACHE = ROOT / '.cache'
ASSETS.mkdir(parents=True, exist_ok=True)
CACHE.mkdir(parents=True, exist_ok=True)
STORY = json.loads((ROOT / 'story.json').read_text())
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
SR = 48000


def ffmpeg(*args):
    return subprocess.run([FFMPEG, '-hide_banner', '-y', *map(str, args)], check=True, capture_output=True)


def write_wave(path, data):
    with wave.open(str(path), 'wb') as output:
        output.setnchannels(data.shape[1])
        output.setsampwidth(2)
        output.setframerate(SR)
        output.writeframes((np.clip(data, -1, 1) * 32767).astype('<i2').tobytes())


async def speech(scene):
    path = ASSETS / f'{scene["id"]}.mp3'
    metadata = ASSETS / f'{scene["id"]}.json'
    if path.exists() and metadata.exists() and '--refresh-voice' not in sys.argv:
        existing = json.loads(metadata.read_text())
        if existing['text'] == scene['text']:
            return
    words = []
    speaker = edge_tts.Communicate(scene['text'], STORY['voice'], rate=STORY.get('voiceRate', '-3%'), boundary='WordBoundary')
    with path.open('wb') as output:
        async for chunk in speaker.stream():
            if chunk['type'] == 'audio':
                output.write(chunk['data'])
            elif chunk['type'] == 'WordBoundary':
                words.append({key: chunk[key] for key in ['offset', 'duration', 'text']})
    metadata.write_text(json.dumps({'text': scene['text'], 'voice': STORY['voice'], 'words': words}, indent=2) + '\n')


async def main():
    await asyncio.gather(*(speech(scene) for scene in STORY['scenes']))
    length = SR * STORY['duration']
    voice = np.zeros((length, 2), dtype=np.float64)
    captions = []
    segment_report = []
    for scene in STORY['scenes']:
        raw = ffmpeg('-i', ASSETS / f'{scene["id"]}.mp3', '-ar', SR, '-ac', 1, '-f', 'f32le', 'pipe:1').stdout
        samples = np.frombuffer(raw, dtype='<f4')
        available = scene['end'] - scene['voiceStart'] - 0.32
        speed = max(1.0, len(samples) / SR / available)
        assert speed <= 1.22, f'{scene["id"]}: rewrite narration instead of rushing it ({speed:.2f}x)'
        if speed > 1:
            raw = ffmpeg('-i', ASSETS / f'{scene["id"]}.mp3', '-af', f'atempo={speed:.8f}', '-ar', SR, '-ac', 1, '-f', 'f32le', 'pipe:1').stdout
            samples = np.frombuffer(raw, dtype='<f4')
        start = round(scene['voiceStart'] * SR)
        voice[start:start + len(samples)] += samples[:, None] * 0.88
        words = json.loads((ASSETS / f'{scene["id"]}.json').read_text())['words']
        # Align exact written punctuation with the voice service's word times.
        written = scene['text'].split()
        assert len(words) == len(written), f'Caption alignment changed for {scene["id"]}'
        group = []
        for index, word in enumerate(words):
            group.append((index, written[index]))
            if len(' '.join(w for _, w in group)) >= 44 or written[index].endswith(('.', '?')) or index == len(words)-1:
                first, last = words[group[0][0]], words[group[-1][0]]
                begin = scene['voiceStart'] + first['offset'] / 1e7 / speed
                end = scene['voiceStart'] + (last['offset'] + last['duration']) / 1e7 / speed + 0.12
                captions.append({'start': round(begin, 3), 'end': round(min(end, scene['end']-.12), 3), 'text': ' '.join(w for _, w in group)})
                group = []
        segment_report.append({'scene': scene['id'], 'start': scene['voiceStart'], 'duration': round(len(samples)/SR, 3), 'tempo': round(speed, 4)})

    # Original score: softly voiced Cmaj9 / Am9 / Fmaj9 / Gsus, no samples.
    score = np.zeros_like(voice)
    chords = [[48,55,59,62,64], [45,52,55,59,60], [41,48,52,55,57], [43,50,55,57,62]]
    for bar in range(int(np.ceil(STORY['duration']/7.5))):
        start = round(bar * 7.5 * SR)
        count = min(round(9 * SR), length-start)
        t = np.arange(count)/SR
        env = np.minimum(t/1.6, 1) * np.clip((9-t)/2.5, 0, 1)
        for j, midi in enumerate(chords[bar % 4]):
            frequency = 440 * 2 ** ((midi-69)/12)
            oscillator = np.sin(2*np.pi*frequency*t + .009*np.sin(2*np.pi*.19*t)) + .19*np.sin(2*np.pi*frequency*2*t)
            pan = j/4
            score[start:start+count, 0] += oscillator * env * .006 * (1-.4*pan)
            score[start:start+count, 1] += oscillator * env * .006 * (.6+.4*pan)
        for beat, note in enumerate([0, 2, 4, 1, 3]):
            onset = start + round((.45 + beat*1.5)*SR)
            count = min(2*SR, length-onset)
            if count <= 0:
                continue
            t = np.arange(count)/SR
            frequency = 440*2**((chords[bar%4][note]+24-69)/12)
            bell = (np.sin(2*np.pi*frequency*t) + .23*np.sin(2*np.pi*2.003*frequency*t))*np.exp(-t*3)*np.minimum(t/.014, 1)*.007
            score[onset:onset+count, 0] += bell * (1 if beat%2 else .65)
            score[onset:onset+count, 1] += bell * (.65 if beat%2 else 1)
    t = np.arange(length)/SR
    score *= (np.minimum(t/2, 1) * np.clip((STORY['duration']-t)/2.8, 0, 1))[:, None]
    # Gentle editorial click cues, well below the narrator.
    for at in ([16.7, 25.6, 36.7, 37.9, 52.1, 60.5, 64.6] if CUT else [14.6, 25.9, 42.7, 50.1]):
        count = int(.11*SR)
        t = np.arange(count)/SR
        cue = np.sin(2*np.pi*740*t)*np.exp(-t*55)*np.minimum(t/.006, 1)*.018
        start = int(at*SR)
        score[start:start+count] += cue[:, None]
    if STORY.get('score') == 'cinematic':
        # A restrained pulse, warm sub bass, and airy transition sweeps.
        # Seeded noise keeps the bespoke score reproducible; no stock samples.
        rng = np.random.default_rng(417)
        for onset in np.arange(6, 73, 60/90):
            start = round(onset*SR)
            n=min(int(.38*SR), length-start)
            tx=np.arange(n)/SR
            pulse=np.sin(2*np.pi*(58*tx+22*(1-np.exp(-tx*28))/28))*np.exp(-tx*16)*.015
            score[start:start+n] += pulse[:, None]
        for onset in [5.4, 10.5, 17.45, 26.5, 38.4, 47.45, 56.4, 66.4, 72.4]:
            start=round(onset*SR); n=int(.85*SR); tx=np.arange(n)/SR
            noise=rng.normal(0,1,n)
            airy=np.convolve(noise,np.ones(18)/18,mode='same')
            sweep=airy*np.sin(np.pi*tx/.85)**2*.018
            score[start:start+n,0]+=sweep
            score[start:start+n,1]+=np.roll(sweep,183)
        # Bring musical motion forward between spoken phrases, duck under speech.
        envelope=np.abs(voice[:,0])
        duck=1-.33*np.minimum(np.convolve(envelope[::480],np.ones(20)/20,mode='same')*14,1)
        score *= np.repeat(duck,480)[:length,None]*1.7
    write_wave(CACHE / 'premix.wav', voice + score)
    # Two-pass EBU R128 normalization; exact sample count follows story duration.
    first = ffmpeg('-i', CACHE / 'premix.wav', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=9:print_format=json', '-f', 'null', '-')
    log = first.stderr.decode()
    measure = json.loads(log[log.rfind('{'):log.rfind('}')+1])
    filter_ = 'loudnorm=I=-16:TP=-1.5:LRA=9:linear=true:' + ':'.join([
        f'measured_I={measure["input_i"]}', f'measured_TP={measure["input_tp"]}',
        f'measured_LRA={measure["input_lra"]}', f'measured_thresh={measure["input_thresh"]}', f'offset={measure["target_offset"]}'])
    ffmpeg('-i', CACHE / 'premix.wav', '-af', filter_, '-ar', SR, '-ac', 2, '-c:a', 'flac', ASSETS / 'master.flac')
    for index in range(len(captions)-1):
        captions[index]['end'] = min(captions[index]['end'], captions[index+1]['start'])
    (ASSETS / 'report.json').write_text(json.dumps({'voice': STORY['voice'], 'duration': STORY['duration'], 'sampleRate': SR, 'score': 'Original procedural composition; no third-party samples', 'segments': segment_report, 'premixLoudness': measure}, indent=2)+'\n')
    (ROOT / 'captions.json').write_text(json.dumps(captions, indent=2)+'\n')
    def timestamp(value, separator):
        ms = round(value*1000)
        return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}{separator}{ms%1000:03}'
    for suffix, separator in [('srt', ','), ('vtt', '.')]:
        content = 'WEBVTT\n\n' if suffix == 'vtt' else ''
        for index, caption in enumerate(captions, 1):
            content += f'{index}\n{timestamp(caption["start"], separator)} --> {timestamp(caption["end"], separator)}\n{caption["text"]}\n\n'
        (ROOT / 'output' / f'{STORY.get("outputBase", "untangle-60s")}.{suffix}').write_text(content.rstrip() + '\n')
    print(json.dumps(segment_report, indent=2))


asyncio.run(main())
