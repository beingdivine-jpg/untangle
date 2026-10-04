/* global process, console */
import { serve, cut } from './runtime.mjs';
const {server,url}=await serve(Number(process.env.PORT||5188));
console.log(`Watch the film: ${url}\nDirector’s composition: ${url}/${cut||'directors-cut'}/film.html?frame=990\nOriginal 60-second edition: ${url}/original.html`);
process.on('SIGINT',()=>server.close(()=>process.exit(0)));
