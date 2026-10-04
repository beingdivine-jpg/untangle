/* global process, console, window */
import { chromium } from 'playwright';
import { mkdir, readFile, rename } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { root, cut, serve, ffmpegPath } from './runtime.mjs';

const story = JSON.parse(await readFile(resolve(root, 'story.json'), 'utf8'));
if(!Number.isInteger(story.duration) || story.duration>80 || story.duration<1 || story.fps!==30) throw new Error('Use an integer duration up to 80 seconds at 30 fps.');
const frameCount=story.duration*story.fps, outputBase=story.outputBase||'untangle-60s';
const stills = process.argv.includes('--stills');
const {server,url} = await serve();
const browser = await chromium.launch({headless:true});
let encoder;
try {
  const page = await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${url}/${cut ? cut+'/' : ''}film.html`);
  await page.waitForFunction(()=>window.filmReady);
  await mkdir(resolve(root,'output/stills'),{recursive:true});
  const times = story.reviewTimes || [3,9,16,23,26.8,31,34,38.8,42,44.7,48.5,51.2,57.5,59.9667];
  for (const t of times) {
    await page.evaluate(f=>window.renderFrame(f),Math.min(frameCount-1,Math.round(t*30)));
    await page.screenshot({path:resolve(root,`output/stills/${t.toFixed(2).replace('.','-')}.png`)});
  }
  if(!stills) {
    const target=resolve(root,`output/${outputBase}.tmp.mp4`);
    encoder=spawn(ffmpegPath(), ['-hide_banner','-y','-f','image2pipe','-framerate','30','-i','pipe:0','-i',resolve(root,'assets/audio/master.flac'),'-map','0:v:0','-map','1:a:0','-vf','scale=in_range=full:out_range=tv:out_color_matrix=bt709','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-r','30','-frames:v',String(frameCount),'-t',String(story.duration),'-c:a','aac','-b:a','256k','-ar','48000','-movflags','+faststart','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-map_metadata','-1','-metadata',`title=${story.title}`,'-metadata','comment=Fictional scripted example. Captured from the implemented local workflow.',target],{stdio:['pipe','ignore','pipe']});
    let stderr=''; encoder.stderr.on('data',d=>{stderr=(stderr+d).slice(-12000);});
    const completion=new Promise((done,reject)=>{encoder.once('error',reject);encoder.once('close',code=>code===0?done():reject(new Error(stderr)));});
    encoder.stdin.on('error',()=>{});
    for(let frame=0;frame<frameCount;frame++) {
      await page.evaluate(f=>window.renderFrame(f),frame);
      const png=await page.screenshot({type:'png'});
      if(!encoder.stdin.write(png)) await once(encoder.stdin,'drain');
      if(frame%150===0) console.log(`Rendered ${frame}/${frameCount} frames (${(frame/30).toFixed(1)}s).`);
    }
    encoder.stdin.end();
    await completion;
    await rename(target,resolve(root,`output/${outputBase}.mp4`));
    console.log(`Rendered ${frameCount}/${frameCount} frames. MP4 ready for verification.`);
  }
  if(errors.length) throw new Error(errors.join('\n'));
  console.log(`Visual review frames: ${times.length}. No browser errors.`);
} finally {
  if(encoder && encoder.exitCode===null) encoder.kill('SIGTERM');
  await browser.close();
  await new Promise(done=>server.close(done));
}
