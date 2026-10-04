/* global document, window, fetch, URLSearchParams */
const [story,captions]=await Promise.all([fetch('story.json').then(r=>r.json()),fetch('captions.json').then(r=>r.json())]);
await document.fonts.ready;
await Promise.all([...document.images].map(image=>image.decode()));
const preloads=['outcomes','edit-applied','edit-restored'].map(name=>{const i=new globalThis.Image();i.src=`assets/captures/${name}.png`;return i.decode()});
await Promise.all(preloads);
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return 1-(1-x)**3;};
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const el=id=>document.getElementById(id);
const on=(id,alpha)=>{el(id).style.opacity=clamp(alpha);};
const range=(t,start,end,fade=.3)=>ease((t-start)/fade)*(end===Infinity?1:1-ease((t-end)/fade));
const appear=[...document.querySelectorAll('[data-at]')];
const ctx=el('thread-field').getContext('2d');
const chapterNames={reveal:'A PRIVATE GUIDE',situation:'01 / THE SITUATION',processing:'02 / THE PROCESS',assistant:'03 / THE AI WORKFLOW',consequences:'04 / THE CONSEQUENCES',choice:'05 / THE CHOICE',continuity:'06 / CONTINUITY'};
const cursors=[
 {from:[1780,815],to:[1181,778],start:15.8,click:16.7,end:17.1},
 {from:[1700,820],to:[1039,825],start:35.85,click:36.7,end:37.02},
 {from:[1550,774],to:[1031,714],start:37.18,click:37.9,end:38.2},
 {from:[1700,610],to:[1271,541],start:51.35,click:52.1,end:52.5},
 {from:[1280,780],to:[866,821],start:53.35,click:54,end:54.35},
 {from:[739,808],to:[289,861],start:59.8,click:60.5,end:60.9},
 {from:[1580,777],to:[376,639],start:63.65,click:64.6,end:65}
];

function threads(t){
 ctx.clearRect(0,0,1920,1080);
 ctx.lineWidth=1.15;
 const settle=smooth((t-18)/8);
 for(let k=0;k<7;k++){
  ctx.strokeStyle=k%2?'#a77d5525':'#9caa8830';ctx.beginPath();
  for(let j=0;j<=100;j++){
   const u=j/100,x=-120+u*2220;
   const y=250+k*81+Math.sin(u*6.2+t*.09+k*.5)*(130*(1-settle*.7))+Math.sin(u*11-k)*17;
   if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.stroke();
 }
}

window.renderFrame=frame=>{
 const t=Math.min(story.duration*30-1,Math.max(0,frame))/30;
 threads(t);
 for(const scene of story.scenes){
  const node=el(scene.id),local=t-scene.start;
  const alpha=scene.id==='hook'?(1-ease((t-5.82)/.45)):range(t,scene.start-.15,scene.id==='close'?Infinity:scene.end-.12,.38);
  node.style.opacity=alpha;
  node.style.transform=scene.id==='hook'?'none':`translateY(${(1-ease((local+.15)/.75))*27}px)`;
 }
 for(const node of appear){const p=ease((t-Number(node.dataset.at))/.65);node.style.opacity=p;node.style.translate=`0 ${(1-p)*19}px`;}
 el('cinema-photo').style.transform=`scale(${1.085-t*.006}) translateX(${-t*2.1}px)`;
 on('hook-first',range(t,.15,2.55,.55));
 on('hook-second',range(t,2.8,Infinity,.55));
 el('hook-second').style.translate=`0 ${(1-ease((t-2.8)/.65))*30}px`;
 on('brand-reveal',range(t,6.1,7.6,.45));
 on('home-device',ease((t-7.65)/.65));
 el('home-device').style.transform=`perspective(1800px) rotateX(${(1-ease((t-7.65)/1.4))*6}deg) translateY(${(1-ease((t-7.65)/1.4))*90}px) scale(${.97+.03*ease((t-7.65)/1.6)})`;
 on('trace-device',ease((t-19.1)/.65));
 el('trace-device').style.transform=`perspective(2000px) rotateX(${(1-ease((t-19.1)/1.2))*5}deg)`;
 const traceStep=Math.min(3,Math.max(0,Math.floor((t-20)/1.55)));
 el('trace-highlight').style.top=`${178+traceStep*71}px`;
 on('trace-highlight',range(t,20,26.5,.25)*.8);
 on('ai-architecture',1-ease((t-31.1)/.4));
 on('wording-demo',ease((t-31.35)/.5));
 on('rewrite-preview',1-ease((t-36.8)/.3));
 on('applied-state',ease((t-36.85)/.35));
 const restored=t>=37.98;
 el('applied-image').src=`assets/captures/${restored?'edit-restored':'edit-applied'}.png`;
 el('applied-label').textContent=restored?'ORIGINAL WORDING RESTORED':'WORDING ACCEPTED';
 on('undo-control',1-ease((t-38)/.2));
 on('preparation-note',range(t,32.45,34.35,.3));
 on('meaning-note',ease((t-34.65)/.5));
 const whatif=el('whatif-device');
 whatif.style.transform=`perspective(2500px) rotateX(${(1-ease((t-39.4)/1.2))*4}deg) scale(${.975+.025*ease((t-39.4)/1.4)})`;
 el('whatif-device').querySelector('.second').style.opacity=.3+.7*ease((t-43.2)/.7);
 on('kept-device',range(t,48.2,49.75,.4));
 on('plan-device',range(t,49.85,51.05,.35));
 on('question-device',ease((t-51.15)/.45));
 el('question-device').style.height=`${400+90*(1-ease((t-54.1)/.22))}px`;
 on('uncertainty-copy',ease((t-51.15)/.45));
 el('outcome-image').src=`assets/captures/${t>=52.1?'outcomes':'outcomes-unselected'}.png`;
 on('update-control',1-ease((t-54.1)/.2));
 on('question-result',ease((t-54.35)/.45));
 on('save-stage',1-ease((t-61.1)/.4));
 on('file-token',ease((t-60.55)/.4));
 el('file-token').style.transform=`translate(${(1-ease((t-60.55)/.45))*-70}px,${(1-ease((t-60.55)/.45))*30}px)`;
 on('restore-stage',ease((t-61.35)/.5));
 on('restored-state',ease((t-64.75)/.5));
 el('benefit-portrait').style.transform=`translateX(${(1-ease((t-67)/1.3))*-55}px) scale(${1+.012*Math.sin(t*.5)})`;
 const scene=story.scenes.find(s=>t>=s.start&&t<s.end);
 on('masthead',range(t,8,67,.4));
 on('chapter',range(t,8,67,.4));
 el('chapter').textContent=chapterNames[scene?.id]||'';
 on('example-label',range(t,11.2,67,.4));
 const track=cursors.find(c=>t>=c.start&&t<c.end);
 if(track){
  const p=smooth((t-track.start)/(track.click-track.start));
  el('cursor').style.left=`${track.from[0]+(track.to[0]-track.from[0])*p}px`;
  el('cursor').style.top=`${track.from[1]+(track.to[1]-track.from[1])*p}px`;
  on('cursor',Math.min((t-track.start)/.12,(track.end-t)/.12));
  const click=clamp((t-track.click)/.35);on('click-ring',t>=track.click?1-click:0);el('click-ring').style.transform=`scale(${.3+click*1.25})`;
 }else on('cursor',0);
 const caption=captions.find(c=>t>=c.start&&t<c.end);
 el('caption').firstElementChild.textContent=caption?.text||'';on('caption',caption?1:0);
 document.documentElement.dataset.frame=String(frame);
};
window.renderFrame(Number(new URLSearchParams(window.location.search).get('frame'))||0);
window.filmReady=true;
