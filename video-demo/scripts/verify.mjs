/* global console */
import { readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { root, ffmpegPath } from './runtime.mjs';
const run=promisify(execFile), ffmpeg=ffmpegPath();
const story=JSON.parse(await readFile(resolve(root,'story.json'),'utf8'));
const outputBase=story.outputBase||'untangle-60s';
const expectedFrames=story.duration*story.fps;
const file=resolve(root,`output/${outputBase}.mp4`);
const mp4=await readFile(file);
// Read MP4 timing tables directly, without relying on rounded player duration.
function boxes(start,end) {
  const result=[];
  for(let offset=start;offset+8<=end;) {
    let size=mp4.readUInt32BE(offset),header=8;
    if(size===1){size=Number(mp4.readBigUInt64BE(offset+8));header=16;}
    if(size===0)size=end-offset;
    assert(size>=header && offset+size<=end,'Malformed MP4 box');
    result.push({type:mp4.toString('ascii',offset+4,offset+8),start:offset+header,end:offset+size});
    offset+=size;
  }
  return result;
}
function child(box,type){return boxes(box.start,box.end).find(b=>b.type===type);}
function duration(box){const v=mp4[box.start];const scale=mp4.readUInt32BE(box.start+(v?20:12));const ticks=v?Number(mp4.readBigUInt64BE(box.start+24)):mp4.readUInt32BE(box.start+16);return {timescale:scale,ticks,seconds:ticks/scale};}
const moov=boxes(0,mp4.length).find(b=>b.type==='moov');assert(moov);
const movie=duration(child(moov,'mvhd'));assert.equal(movie.seconds,story.duration);
const tracks=boxes(moov.start,moov.end).filter(b=>b.type==='trak').map(track=>{
  const mdia=child(track,'mdia'), handler=child(mdia,'hdlr');
  const kind=mp4.toString('ascii',handler.start+8,handler.start+12);
  const stbl=child(child(mdia,'minf'),'stbl'),stsz=child(stbl,'stsz');
  return {kind,...duration(child(mdia,'mdhd')),samples:mp4.readUInt32BE(stsz.start+8)};
});
const video=tracks.find(t=>t.kind==='vide');assert.equal(video.seconds,story.duration);assert.equal(video.samples,expectedFrames);assert.equal(video.samples/video.seconds,story.fps);
const decode=await run(ffmpeg,['-hide_banner','-i',file,'-map','0:v:0','-an','-progress','pipe:1','-f','null','-'],{maxBuffer:2**23});
assert.match(decode.stderr,/1920x1080/);assert.match(decode.stderr,/h264/);assert.match(decode.stderr,/yuv420p/);
const frames=[...decode.stdout.matchAll(/^frame=(\d+)/gm)].at(-1)[1];assert.equal(Number(frames),expectedFrames);
const audio=await run(ffmpeg,['-hide_banner','-i',file,'-vn','-af','loudnorm=I=-16:TP=-1.5:LRA=9:print_format=json','-f','null','-'],{maxBuffer:2**23});
assert.match(audio.stderr,/Audio: aac[^\n]*48000 Hz, stereo/);
const log=audio.stderr;const levels=JSON.parse(log.slice(log.lastIndexOf('{'),log.lastIndexOf('}')+1));
assert(Number(levels.input_tp)<-1,'Audio peak exceeds -1 dBTP');assert(Math.abs(Number(levels.input_i)+16)<1.5,'Audio loudness is outside target');
const black=await run(ffmpeg,['-hide_banner','-i',file,'-an','-vf','blackdetect=d=0.03:pix_th=0.05','-f','null','-'],{maxBuffer:2**23});
assert(!black.stderr.includes('black_start:'),'Unexpected black frame');
const captions=JSON.parse(await readFile(resolve(root,'captions.json'),'utf8'));
assert.equal(captions.map(c=>c.text).join(' '),story.scenes.map(s=>s.text).join(' '));
for(let i=0;i<captions.length;i++) {const c=captions[i];assert(c.start>=0&&c.end<=story.duration&&c.end>c.start);if(i)assert(c.start>=captions[i-1].end,'Captions overlap');}
const workflow=JSON.parse(await readFile(resolve(root,'assets/captures/manifest.json'),'utf8'));
assert(workflow.workflowVerified && workflow.encryptedDownloadVerified && workflow.liveProviderCalls===0);
if(story.outputBase)assert(workflow.wordingPreviewAcceptanceUndoVerified&&workflow.encryptedRestoreVerified);
const report={file:`${outputBase}.mp4`,sha256:createHash('sha256').update(mp4).digest('hex'),bytes:mp4.length,movieDurationSeconds:movie.seconds,video:{width:1920,height:1080,frames:video.samples,fps:story.fps,durationSeconds:video.seconds,codec:'H.264',pixelFormat:'yuv420p'},audio:{codec:'AAC',sampleRate:48000,channels:2,integratedLUFS:Number(levels.input_i),truePeakDBTP:Number(levels.input_tp)},fullDecodePassed:true,blackFramesDetected:false,captionCues:captions.length,captionTranscriptMatches:true,fictionalWorkflowVerified:true,encryptedDownloadVerified:true,...(story.outputBase?{wordingPreviewAcceptanceUndoVerified:true,encryptedRestoreVerified:true}:{}),tracks};
await writeFile(resolve(root,'output/verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
