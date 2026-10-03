/* global document, window, fetch, URLSearchParams */
const [story, captions] = await Promise.all([fetch('story.json').then(r=>r.json()), fetch('captions.json').then(r=>r.json())]);
await document.fonts.ready;
await Promise.all([...document.images].map(image => image.decode()));
const outcomeSelected=new globalThis.Image();outcomeSelected.src='assets/captures/outcomes.png';await outcomeSelected.decode();
const clamp = (v, min=0, max=1) => Math.max(min, Math.min(max,v));
const ease = x => { x=clamp(x); return 1-(1-x)**3; };
const el = id => document.getElementById(id);
const show = (id, value) => { el(id).style.opacity = clamp(value); };
const appearances = [...document.querySelectorAll('[data-in]')];
const cursorTracks = [
  { start: 17.9, click: 19.1, end:19.55, from:[1660,790], to:[1030,653] },
  { start: 24.9, click: 25.9, end:26.35, from:[1690,790], to:[1060,885] },
  { start: 40.18, click: 40.65, end:41.1, from:[1630,650], to:[1310,530] },
  { start: 49.1, click: 50.1, end:50.6, from:[1750,810], to:[1240,864] }
];
window.renderFrame = frame => {
  const t=clamp(frame,0,1799)/story.fps;
  for (const scene of story.scenes) {
    const node=el(scene.id), local=t-scene.start;
    const opacity = ease((local+.16)/.5) * (scene.id==='end'?1:clamp((scene.end+.12-t)/.35));
    node.style.opacity=opacity;
    node.style.transform=`translateY(${(1-ease((local+.16)/.7))*22}px)`;
  }
  for (const node of appearances) {
    const scene=story.scenes.find(s=>s.id===node.closest('.scene').id);
    const p=ease((t-scene.start-Number(node.dataset.in))/.7);
    node.style.opacity=p;
    node.style.translate=`0 ${(1-p)*22}px`;
  }
  el('problem-thread').style.strokeDasharray='3000';
  el('problem-thread').style.strokeDashoffset=3000*(1-ease((t-.3)/5.6));
  el('end-line').style.strokeDasharray='3400';
  el('end-line').style.strokeDashoffset=3400*(1-ease((t-53)/5));
  show('brand', 1-ease((t-53)/.4));
  show('demo-label', ease((t-12)/.4)*(1-ease((t-53)/.3)));
  show('draft-list', ease((t-20.2)/.6)*(1-ease((t-26.1)/.4)));
  show('kept-panel', ease((t-26.1)/.5));
  el('draft-pan').style.transform=`translateY(${-126*ease((t-22.1)/2.7)}px)`;
  show('plan-overview', ease((t-37.2)/.6)*(1-ease((t-40)/.4)));
  show('plan-question', ease((t-40.15)/.5));
  el('outcome-image').src=t>=40.65?'assets/captures/outcomes.png':'assets/captures/outcomes-unselected.png';
  show('question-result', ease((t-43.4)/.5));
  show('saved-file', ease((t-50.4)/.6));
  el('saved-file').style.translate=`0 ${(1-ease((t-50.4)/.6))*18}px`;
  el('effect-card').style.opacity=.45+.55*ease((t-29.1)/.8);
  el('boundary-card').style.opacity=.45+.55*ease((t-32.4)/.8);
  const track=cursorTracks.find(c=>t>=c.start&&t<c.end);
  if(track) {
    const p=ease((t-track.start)/(track.click-track.start));
    el('cursor').style.left=`${track.from[0]+(track.to[0]-track.from[0])*p}px`;
    el('cursor').style.top=`${track.from[1]+(track.to[1]-track.from[1])*p}px`;
    show('cursor', Math.min((t-track.start)/.18,(track.end-t)/.18));
    const click=clamp((t-track.click)/.42);
    show('click-ring', t>=track.click?1-click:0);
    el('click-ring').style.transform=`scale(${.3+click*1.15})`;
  } else show('cursor',0);
  const caption=captions.find(c=>t>=c.start&&t<c.end);
  el('caption').firstElementChild.textContent=caption?.text||'';
  show('caption',caption?1:0);
  el('progress').style.width=`${(t+1/story.fps)/60*100}%`;
  document.documentElement.dataset.frame=String(frame);
};
window.renderFrame(Number(new URLSearchParams(window.location.search).get('frame'))||0);
window.filmReady=true;
