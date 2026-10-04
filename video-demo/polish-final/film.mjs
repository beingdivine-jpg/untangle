/* global document, window, fetch, URLSearchParams */
const [story,captions,manifest]=await Promise.all(['story.json','captions.json','assets/captures/manifest.json'].map(p=>fetch(p).then(r=>r.json())));
await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));
const preload=new globalThis.Image();preload.src='assets/captures/quiz-answer.png';await preload.decode();
const el=id=>document.getElementById(id),clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>1-(1-clamp(x))**3,smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const on=(id,v)=>{el(id).style.opacity=clamp(v)},range=(t,a,b,fade=.3)=>ease((t-a)/fade)*(b===Infinity?1:1-ease((t-b)/fade));
const appear=[...document.querySelectorAll('[data-at]')],ctx=el('thread-field').getContext('2d');
const chapterNames={reveal:'TWÓJ PRYWATNY PRZEWODNIK',situation:'01 / SYTUACJA',processing:'02 / PLAN',assistant:'03 / AGENT AI',consequences:'04 / SKUTKI I SŁOWA',choice:'05 / TWOJA ZGODA',continuity:'06 / KOLEJNY KROK'};
const pointer=(name,label,left,top,width,padX=0,padY=0)=>{const shot=manifest.shots[name],b=shot.controls.find(c=>c.label===label);if(!b)throw new Error(`Missing actual button: ${label}`);return [left+padX+b.x*width/shot.width,top+padY+b.y*width/shot.width]};
const cursors=[
 {start:16.1,click:16.85,end:17.4,to:pointer('story','Przygotuj propozycję dla Mai',935,241,870)},
 {start:46.65,click:47.25,end:47.6,to:pointer('wording','Użyj tej treści',945,279,860)},
 {start:50.2,click:50.85,end:51.15,to:pointer('approval','Zachowaj ten plan demo',960,226,845)},
 {start:55.4,click:56.15,end:56.55,to:pointer('result','Przejdź do pomocy krok po kroku',1030,190,775)},
 {start:61.45,click:62.1,end:62.5,to:pointer('quiz','Tak',865,386,880,30,75)}
];
window.renderFrame=frame=>{
 const t=Math.min(story.duration*30-1,Math.max(0,frame))/30;
 ctx.clearRect(0,0,1920,1080);ctx.lineWidth=1.1;
 for(let k=0;k<7;k++){ctx.strokeStyle=k%2?'#a77d5520':'#9caa882b';ctx.beginPath();for(let j=0;j<=100;j++){const u=j/100,x=-100+u*2120,y=270+k*80+Math.sin(u*6.2+t*.08+k*.5)*(120-80*smooth((t-18)/9))+Math.sin(u*11-k)*17;if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke()}
 for(const scene of story.scenes){const local=t-scene.start,node=el(scene.id);node.style.opacity=scene.id==='hook'?1-ease((t-5.8)/.4):range(t,scene.start-.12,scene.id==='close'?Infinity:scene.end-.12,.35);node.style.transform=scene.id==='hook'?'none':`translateY(${(1-ease((local+.12)/.65))*24}px)`}
 for(const node of appear){const p=ease((t-Number(node.dataset.at))/.6);node.style.opacity=p;node.style.translate=`0 ${(1-p)*17}px`}
 el('cinema-photo').style.transform=`scale(${1.085-t*.006}) translateX(${-t*2}px)`;
 on('hook-first',range(t,.1,1.75,.45));on('hook-second',ease((t-2)/.5));on('risk-line',ease((t-4.05)/.5));
 on('brand-reveal',range(t,6.05,7.65,.4));on('home-device',ease((t-7.8)/.6));
 el('home-device').style.transform=`perspective(1800px) rotateX(${(1-ease((t-7.8)/1.2))*5}deg) translateY(${(1-ease((t-7.8)/1.2))*65}px)`;
 on('agent-map',1-ease((t-33.75)/.4));on('agent-example',ease((t-34)/.4));
 on('effect-view',1-ease((t-43.6)/.4));on('wording-view',ease((t-43.85)/.4));
 on('approval-shot',1-ease((t-51.05)/.35));on('result-shot',ease((t-51.25)/.4));on('result-metrics',ease((t-52)/.5));
 el('choice-copy').innerHTML=t>=51.25?'Plan gotowy.<br>Sprawdzenie dopiero przed Tobą.':'Kroki i notatka.<br>Sprawdź je przed zatwierdzeniem.';
 on('step-shot',1-ease((t-60.1)/.35));on('quiz-shot',range(t,60.3,63.35,.4));on('outcome-shot',ease((t-63.6)/.4));
 el('quiz-image').src=`assets/captures/${t>=62.1?'quiz-answer':'quiz'}.png`;
 const phase=t<60.3?0:t<63.6?1:2;
 el('learn-title').innerHTML=['Jeden krok.<br>Z podpowiedzią.','Rozumiesz,<br>dlaczego.','Zapisujesz<br>własny wynik.'][phase];
 el('learn-copy').innerHTML=['Czytelna instrukcja.<br>W Twoim tempie.','Krótka lekcja.<br>Odpowiedź z wyjaśnieniem.','Niepewność też<br>ma miejsce w planie.'][phase];
 ['mini-one','mini-two','mini-three'].forEach((id,i)=>el(id).classList.toggle('active',i===phase));
 el('benefit-portrait').style.transform=`translateX(${(1-ease((t-67)/1.2))*-50}px)`;
 on('masthead',range(t,8,67,.4));on('chapter',range(t,8,67,.4));on('example-label',range(t,11.2,73,.4));
 const scene=story.scenes.find(s=>t>=s.start&&t<s.end);el('chapter').textContent=chapterNames[scene?.id]||'';
 const track=cursors.find(c=>t>=c.start&&t<c.end);
 if(track){const p=smooth((t-track.start)/(track.click-track.start));el('cursor').style.left=`${track.to[0]+(1-p)*150}px`;el('cursor').style.top=`${track.to[1]+(1-p)*80}px`;on('cursor',Math.min((t-track.start)/.12,(track.end-t)/.12));const c=clamp((t-track.click)/.35);on('click-ring',t>=track.click?1-c:0);el('click-ring').style.transform=`scale(${.3+c*1.25})`}else on('cursor',0);
 const caption=captions.find(c=>t>=c.start&&t<c.end);el('caption').firstElementChild.textContent=caption?.text||'';on('caption',caption?1:0);
 document.documentElement.dataset.frame=String(frame);
};
window.renderFrame(Number(new URLSearchParams(window.location.search).get('frame'))||0);window.filmReady=true;
