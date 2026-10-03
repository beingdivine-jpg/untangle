/* global process, console */
import { serve } from './runtime.mjs';
const {server,url}=await serve(Number(process.env.PORT||5188));
console.log(`Watch the film: ${url}\nComposition: ${url}/film.html?frame=690`);
process.on('SIGINT',()=>server.close(()=>process.exit(0)));
