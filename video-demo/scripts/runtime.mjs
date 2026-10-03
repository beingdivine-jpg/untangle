/* global process, URL */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

export const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
export function ffmpegPath() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  const python = process.env.VIDEO_PYTHON || resolve(root, process.platform === 'win32' ? '.venv/Scripts/python.exe' : '.venv/bin/python');
  return execFileSync(python, ['-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())'], { encoding: 'utf8' }).trim();
}
export async function serve(port=0) {
  const types = { '.html':'text/html', '.css':'text/css', '.mjs':'text/javascript', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.woff2':'font/woff2', '.mp4':'video/mp4', '.vtt':'text/vtt', '.flac':'audio/flac' };
  const server = createServer(async (req,res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const path = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!path.startsWith(root + sep) || pathname.split('/').some(p=>p.startsWith('.'))) { res.writeHead(403).end(); return; }
      const info = await stat(path);
      const type = types[extname(path)] || 'application/octet-stream';
      const match = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
      if(match) {
        const start=Number(match[1]), end=Math.min(match[2]?Number(match[2]):info.size-1, info.size-1);
        if(start>end) {res.writeHead(416).end();return;}
        res.writeHead(206, { 'Content-Type':type, 'Content-Range':`bytes ${start}-${end}/${info.size}`, 'Content-Length':end-start+1, 'Accept-Ranges':'bytes' });
        createReadStream(path,{start,end}).pipe(res);
      } else {
        res.writeHead(200, { 'Content-Type':type, 'Content-Length':info.size, 'Accept-Ranges':'bytes' });
        res.end(await readFile(path));
      }
    } catch { res.writeHead(404).end('Not found'); }
  });
  await new Promise((done,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',done);});
  return { server, url:`http://127.0.0.1:${server.address().port}` };
}
