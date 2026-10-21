// The original OpenKrillion ocean look, kept as a fallback theme.
// Paint hooks run with `this` bound to the Scene.
import { Seascape } from './seascape.mjs';

const mix = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
function seed(n) { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453123; return v - Math.floor(v); }
const stops=[[0,[29,85,128]],[150,[18,58,94]],[350,[11,21,38]],[800,[8,16,32]],[1400,[5,10,20]],[2600,[3,7,15]],[5200,[2,5,11]]];
function colorAt(depth){let i=stops.findIndex(([d])=>d>depth);if(i<0)return stops.at(-1)[1];if(!i)return stops[0][1];const[a,c]=stops[i-1],[b,k]=stops[i];return c.map((n,j)=>Math.round(mix(n,k[j],(depth-a)/(b-a))));}

function cloud(x,y,scale){const c=this.ctx;const blocks=[[0,4,5,2],[2,3,7,3],[4,1,5,5],[6,0,4,5],[9,2,4,4],[12,3,5,2],[15,4,5,1],[1,5,6,1],[8,5,5,1]];c.fillStyle='#eaf6fa';for(const[a,b,w,h]of blocks)c.fillRect(Math.round(x+a*scale),Math.round(y+b*scale),w*scale,h*scale);c.fillStyle='#c8e0e8';for(const[a,b,w,h]of [[1,5,4,1],[5,4,2,1],[8,5,4,1],[13,4,3,1]])c.fillRect(x+a*scale,y+b*scale,w*scale,h*scale);}
function boat(x,y,s){const c=this.ctx;c.save();c.translate(Math.round(x),Math.round(y));c.scale(s,s);c.fillStyle='#061e2c';
  for(const[a,b,w,h]of[[0,-5,2,3],[1,-6,3,5],[3,-4,23,3],[4,-1,20,1],[5,0,18,1],[23,-5,4,2],[26,-7,4,1],[25,-6,3,2],[10,-10,10,1],[11,-9,2,5],[17,-9,2,5],[14,-20,1,11]])c.fillRect(a,b,w,h);
  c.fillStyle='#ff5682';for(const[a,b,w,h]of[[9,-17,5,3],[10,-19,4,2],[8,-16,6,2],[7,-15,3,1]])c.fillRect(a,b,w,h);c.fillStyle='#e6386a';c.fillRect(8,-15,6,1);
  c.fillStyle='#9cc9d8';c.fillRect(13,-9,1,3);c.fillRect(16,-9,1,3);c.restore();}
function fish(x,y,s,dir=1,glow=false){const c=this.ctx;c.save();c.translate(x,y);c.scale(dir*s,s);c.fillStyle=glow?'#0b515e':'#031522';c.beginPath();c.ellipse(0,0,8,3.5,0,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(-7,0);c.lineTo(-14,-4);c.lineTo(-14,4);c.closePath();c.fill();if(glow){c.fillStyle='#52cdd6';c.fillRect(4,-1,1,1);}c.restore();}
function bubble(x,y,r,alpha=.5){const c=this.ctx;c.strokeStyle=`rgba(173,218,238,${alpha})`;c.lineWidth=1;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();if(r>4){c.strokeStyle=`rgba(224,247,255,${alpha*.7})`;c.beginPath();c.arc(x-1,y-1,r-2,Math.PI,Math.PI*1.5);c.stroke();}}
function seaLife(worldY){const c=this.ctx,t=this.time,w=this.w;
  const y=worldY(800);if(y>-100&&y<this.h+100)for(let i=0;i<22;i++){c.fillStyle=`rgba(77,227,255,${.22+.18*Math.sin(t*3+i)})`;c.beginPath();c.arc(w*(.12+i*.034),y+Math.sin(t*.7+i*.55)*22,2.2,0,Math.PI*2);c.fill();}
  const eyeY=worldY(980);if(eyeY>-100&&eyeY<this.h+100)for(let i=0;i<6;i++){const x=((t*14+i*110)%(w+200))-100,yy=eyeY+Math.sin(t+i*2)*20+i*8;fish.call(this,x,yy,.6,-1);c.fillStyle=`rgba(232,241,255,${.25+.25*Math.sin(t*5+i)})`;c.fillRect(x-1,yy-1,2,2);}
  const wreckY=worldY(3800);if(wreckY>-160&&wreckY<this.h+160){c.save();c.translate(w*.5,wreckY);c.rotate(.06);c.fillStyle='#040912df';c.fillRect(-108,-8,137,22);c.beginPath();c.moveTo(-108,-8);c.lineTo(-132,14);c.lineTo(-108,14);c.fill();for(let i=0;i<3;i++)c.fillRect(-92+i*34,-22,8,14);c.fillRect(58,-4,60,18);c.restore();}
  const sparkY=worldY(4400);if(sparkY>-80&&sparkY<this.h+80)for(let i=0;i<8;i++){c.fillStyle=`rgba(255,93,143,${.15+.2*Math.sin(t*4+i*3)})`;c.fillRect(w*(.05+i*.13)+Math.sin(t*.8+i*2)*14,sparkY+Math.sin(t*1.3+i)*18+i%3*10,2,2);}
}

function backdrop({ w, h, t, l, sea, worldY }) {
  const c=this.ctx;
  if(sea>0){const sky=c.createLinearGradient(0,sea-620,0,sea);sky.addColorStop(0,'#81cbe8');sky.addColorStop(.6,'#a8dcef');sky.addColorStop(1,'#f1f9ff');c.fillStyle=sky;c.fillRect(0,0,w,sea+8);
    if(l.mobile){const sunX=w*.79,sunY=sea-151;c.fillStyle='#ffdf85';c.fillRect(sunX,sunY,38,38);c.fillStyle='#ffeaa7';c.fillRect(sunX-4,sunY+8,46,22);cloud.call(this,40,sea-147,6.5);cloud.call(this,210,sea-140,3.5);cloud.call(this,142,sea-105,4);cloud.call(this,-25,sea-100,3);cloud.call(this,335,sea-110,5);}
    else{const sy=sea-600,sunX=w*.84,sunY=sy+80;c.fillStyle='#ffdf85';c.fillRect(sunX,sunY,128,128);c.fillStyle='#ffeaa7';c.fillRect(sunX-8,sunY+12,144,104);cloud.call(this,w*.1,sy+20,24);cloud.call(this,w*.54,sy+40,13);cloud.call(this,w*.36,sy+205,17);cloud.call(this,-120,sy+215,12);cloud.call(this,w*.85,sy+230,16);}
    boat.call(this,w*.25,sea+3,w/288);
  }
  for(let y=Math.max(0,Math.floor(sea)-3);y<h;y+=6){const d=Math.max(0,this.cameraDepth+(y-l.height/2)/2);const color=colorAt(d);c.fillStyle=`rgb(${color.join(',')})`;c.fillRect(0,y,w,7);}
  if(sea>-10&&sea<h+10){c.fillStyle='#1d5580';c.beginPath();c.moveTo(0,sea+8);for(let x=0;x<=w+12;x+=12)c.lineTo(x,sea+Math.sin(x*.011+t*.7)*3+Math.sin(x*.024-t*.3)*2);c.lineTo(w,sea+14);c.lineTo(0,sea+14);c.fill();}
  this.scenery.draw(c,w,h,worldY);
  for(let i=0;i<(this.lowPower?65:220);i++){const x=seed(i+91)*w,yy=((seed(i+331)*h+t*(1+seed(i)*4)+this.cameraDepth*.35)%h+h)%h;if(yy<sea)continue;c.fillStyle=`rgba(190,224,248,${.08+seed(i+2)*.26})`;c.fillRect(x,yy,seed(i+20)>.8?2:1,seed(i+20)>.8?2:1);}
  for(let i=0;i<(l.mobile?14:26);i++){const d=i<(l.mobile?5:10)?75+seed(i+7)*45:this.cameraDepth+(seed(i+7)-.5)*400,yy=worldY(d);if(yy<sea+20||yy<-20||yy>h+20)continue;const direction=i%2?1:-1,x=((seed(i+32)*w+t*(4+seed(i+40)*13)*direction)%(w+60)+w+60)%(w+60)-30;fish.call(this,x,yy,.6+seed(i+9)*.8,direction,this.cameraDepth>600&&i%7===0);}
  seaLife.call(this,worldY);
  if(this.cameraDepth>3200){const floorY=worldY(7000);c.fillStyle='#09192b';c.beginPath();c.moveTo(0,floorY);for(let x=0;x<=w+20;x+=12)c.lineTo(x,floorY+Math.sin(x*.014)*30+Math.sin(x*.045)*9);c.lineTo(w,h);c.lineTo(0,h);c.fill();}
}

function effect(l) {
  const c=this.ctx,t=this.time,p=this.fx.progress,x=l.center,landed=this.phase==='landed',y=l.height/2-60,tier=this.fx.tier,scatter=landed?clamp((performance.now()-(this.goldLandAt||performance.now())-1000)/1500,0,1):0;
  if(tier==='og'){const g=c.createRadialGradient(x,y,66,x,y,330);g.addColorStop(0,'#02040a00');g.addColorStop(.55,'#02040ab8');g.addColorStop(1,'#02040af5');c.fillStyle=g;c.fillRect(0,0,this.w,this.h);}
  if(tier==='degen'){for(let i=0;i<9;i++){const xx=x+Math.sin(i*4+t)*55,yy=y+Math.cos(i*3+t)*35,r=30+seed(i)*50;const g=c.createRadialGradient(xx,yy,0,xx,yy,r);g.addColorStop(0,'#3c040ed0');g.addColorStop(1,'#14000600');c.fillStyle=g;c.fillRect(xx-r,yy-r,r*2,r*2);}}
  if(tier==='midcurve'&&this.sprites.tooclever?.complete){for(let i=0;i<11;i++){const direction=i%2?1:-1,progress=clamp(p*2-i*.07,0,1),xx=mix(direction>0?-70:this.w+70,direction>0?this.w+70:-70,progress),yy=l.height*.42+(seed(i+8)-.5)*260;c.save();c.translate(xx,yy);c.scale(-direction,1);c.rotate(Math.sin(t+i)*.2);c.drawImage(this.sprites.tooclever,-27,-27,54,54);c.restore();}}
  if(!landed){const glow=c.createRadialGradient(x,y-32,6,x,y-32,80);glow.addColorStop(0,'#4de3ff24');glow.addColorStop(1,'#4de3ff00');c.fillStyle=glow;c.fillRect(x-80,y-112,160,160);}
  if(tier==='holder'&&this.sprites.schooler?.complete){for(const[dx,dy]of[[-64,-26],[-88,10],[64,-18],[88,18],[-40,34],[44,38]]){c.save();c.translate(x+dx,y+dy+Math.sin(t*4+dx)*6);c.scale(dx>0?-1:1,1);c.drawImage(this.sprites.schooler,-16,-16,32,32);c.restore();}}
  const sprite=tier==='satoshi'?this.sprites.krill:null;
  if(sprite?.complete){for(let i=0;i<18;i++){const angle=t*(i%2?1:-1)+i*2.4,r=(30+seed(i)*48)*(landed?.62:1)*(1+scatter*7),xx=x+Math.cos(angle)*r*1.12,yy=y+Math.sin(angle)*r*.62,size=15+seed(i+3)*13;c.save();c.globalAlpha=Math.max(0,.92-scatter*1.15);c.translate(xx,yy);c.scale(-Math.sin(angle)*(i%2?1:-1)>0?-1:1,1);c.drawImage(sprite,-size/2,-size/2,size,size);c.restore();}}
  for(let i=0;i<(landed?24:18);i++){const yy=y-((seed(i+62)*180+t*(landed?38:24))%180),xx=x+Math.sin(i*3+t)*30;bubble.call(this,xx,yy,1.5+seed(i)*3,landed?.35:.5);}
}
function foreground({ w, h, t, sea }) {
  for(let i=0;i<(this.lowPower?3:10);i++){const x=seed(i+741)*w+Math.sin(t*.3+i)*10,yy=h-((t*16+seed(i+94)*h)%(h*.9));if(yy>sea)bubble.call(this,x,yy,2+i%3,.38);}
}
function typeParticle(x, y) { return { x:x+(Math.random()-.5)*8, y:y+Math.random()*10, vx:(Math.random()-.5)*8, vy:-35-Math.random()*15, life:1, color:'#b2dce8', float:true, r:1+Math.random()*2 }; }
function particle(p) { if (p.float) bubble.call(this, p.x, p.y, p.r || 2, p.life * .65); else { this.ctx.fillStyle = p.color; this.ctx.fillRect(p.x, p.y, 3, 4); } }

export default {
  id: 'sea',
  tiers: {
    normie: { name: 'Plankton', emoji: '🫧', color: '#8fa3c4', blurb: 'The answer everyone blurts out.', sprite: 'plankton' },
    midcurve: { name: 'Too Clever', emoji: '🤡', color: '#ff9f43', blurb: 'The obscure answer the whole school thought of.', sprite: 'tooclever' },
    holder: { name: 'Schooler', emoji: '🐟', color: '#4de3ff', blurb: 'Solid — swims with the school.', sprite: 'schooler' },
    degen: { name: 'Rare', emoji: '🦑', color: '#ff5252', blurb: 'An uncommon answer. Nice pull.', sprite: 'rare' },
    og: { name: 'Deep Cut', emoji: '🏮', color: '#9d7bff', blurb: 'True obscurity. Few go this deep.', sprite: 'deepcut' },
    satoshi: { name: 'One in a Million', emoji: '🌟', color: '#ffd166', blurb: 'The designated gem. Trench floor.', sprite: 'krill' },
  },
  bands: {
    normie: { name: 'Plankton', text: 'Plenty of ocean left down there.' },
    holder: { name: 'Schooler', text: 'Swimming with the school.' },
    degen: { name: 'Rare', text: 'Below the thermocline. Nice.' },
    og: { name: 'Deep cut', text: 'Seriously deep dive.' },
    satoshi: { name: 'One in a million', text: 'Trench dweller. Absurd.' },
  },
  copy: {
    tagline: 'THE DAILY DIVE',
    subline: '7 prompts · 25 seconds each · rarer answers sink deeper',
    canvasLabel: 'Animated pixel ocean, depth increases downward',
    startLabel: 'SURFACE',
    mascotLabel: 'Poke your dive buddy',
    mascotSay: 'blub!',
    hint: '▼ rarer answers sink deeper ▼',
    howToRare: 'rare answers score big. obvious ones float.',
    howToDepth: 'every point sinks you 10 metres. 700 is the trench.',
    howToDaily: 'one daily dive. practice whenever you like.',
    startButton: '▼ BEGIN DESCENT ▼',
    runNoun: 'Dive',
    submitButton: 'DIVE',
    previewCountdown: 'descending · the clock starts in',
    nextButton: 'DESCEND ▼',
    finishButton: 'SURFACE ▲',
    sinkVerb: 'sink',
    missQuip: 'never made it onto the reef.',
    menuRule: 'DIVE IN',
    menuDaily: '↓ Daily dive',
    menuPractice: '∞ Practice dive',
    logbookButton: 'My dives →',
    buddyTitle: 'Dive buddy',
    logbookEyebrow: 'YOUR DIVER’S LOGBOOK',
    logbookNote: 'Daily dives extend streaks. Practice dives don’t.',
    logbookEmpty: 'Your next dive starts your logbook.',
    logbookCount: 'Daily dives',
    distributionLoading: 'Sounding this ocean’s depths…',
    chartRule: 'DIVE LOG · DEEPER = RARER',
    bandsRule: 'THE BEARING',
    keepGoing: 'KEEP DIVING ∞',
    reviewRule: 'THE CATCH · TAP A ROUND FOR EVERY ANSWER',
    practiceNote: 'Practice dive · your daily score stays unchanged.',
    needMore: 'YOUR SCORE · MORE DAILY DIVES NEEDED FOR COMPARISON',
    playersNoun: 'DIVERS',
    rateLabel: 'how was that dive? 1 = meh · 5 = great',
    nextReset: 'next dive in',
    reject: '“{answer}”: no echo. try again',
    shareIcon: '🦐',
  },
  sprites: {
    mascot: 'krill',
    mascotGold: 'krill-gold',
    buddies: [
      { id: 'krill', name: 'The Krill', sprite: 'krill', streak: 0, poke: 'roll' },
      { id: 'schooler', name: 'Schooler', sprite: 'schooler', streak: 5, poke: 'dart' },
      { id: 'rare', name: 'Rare Squid', sprite: 'rare', streak: 14, poke: 'jet' },
      { id: 'deepcut', name: 'Deep Cut Angler', sprite: 'deepcut', streak: 30, poke: 'chomp' },
      { id: 'evil', name: 'Evil Krill', sprite: 'evil', streak: 45, poke: 'roll' },
    ],
    scene: ['krill', 'krill-gold', 'schooler', 'rare', 'deepcut', 'tooclever'],
  },
  palette: { ink: '#050a14', ruler: '#7d93b8', marker: '#ff5d8f', gold: '#ffd166', burst: '#4de3ff' },
  landmarks: [[60,'light begins to fade','L'],[200,'most sunlight stops here','R'],[332,'deepest scuba dive ever — 332m','R'],[385,'sperm whales hunt below here','L'],[535,'emperor penguins dive this deep','R'],[660,'pressure: 67x the surface','L'],[800,'siphonophore drift zone','R'],[1040,'THE MIDNIGHT ZONE','L'],[1240,'anglerfish territory','R'],[1550,'sperm whales duel giant squid here','L'],[1850,'giant squid territory','R'],[2150,'colossal squid eyes: football-sized','L'],[2500,'the water is 2°C and utterly black','R'],[3000,'THE ABYSSAL ZONE','L'],[3800,'the Titanic rests here — 3,800m','R'],[4400,'cusk eels patrol the plain','L'],[4900,'the abyssal plain stretches out','R'],[5500,'deeper than most submarines survive','L'],[6000,'THE HADAL ZONE','R'],[6500,'named for Hades. fitting.','L'],[7000,'the trench floor — a perfect dive ends here','R']],
  Scenery: Seascape,
  paint: { backdrop, effect, foreground, typeParticle, particle },
  sounds: {},
};
