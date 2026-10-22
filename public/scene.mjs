import { easeInOut } from './presentation.mjs';
const mix=(a,b,t)=>a+(b-a)*t;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export class Scene {
  constructor(canvas,mascot,theme){
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.mascot=mascot;this.theme=theme;
    this.scenery=new theme.Scenery();this.phase='intro';this.depth=0;this.target=0;this.cameraDepth=-45;this.cameraTarget=-45;this.active=0;this.targetActive=0;this.time=0;this.particles=[];this.fx=null;
    this.lowPower=false;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.last=0;this.mx=.72;this.my=.66;
    this.sprites={};for(const name of theme.sprites.scene){const img=new Image();img.src='/assets/'+name+'.svg';this.sprites[name]=img;}
    this.resize();this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);requestAnimationFrame(t=>this.tick(t));
  }
  layout(){const mobile=this.w<700,rail=this.w>=1200?180:0,bottom=mobile?50:90;return{mobile,rail,bottom,height:this.h-bottom,left:rail,width:this.w-rail*2,center:this.w/2-24};}
  resize(){const previousHeight=this.h,previousWidth=this.w;this.w=this.canvas.clientWidth;this.h=this.canvas.clientHeight;this.canvas.width=Math.ceil(this.w/2);this.canvas.height=Math.ceil(this.h/2);this.ctx.setTransform(.5,0,0,.5,0,0);this.ctx.imageSmoothingEnabled=false;
    if(previousHeight&&(previousHeight!==this.h||previousWidth!==this.w)&&['preview','answering'].includes(this.phase)){const l=this.layout(),cardHeight=document.getElementById('prompt-card')?.offsetHeight||180,dockTop=l.height-80;this.roundAnchor=Math.max(8,Math.min(l.mobile?175:210,(dockTop-cardHeight)/2));this.cameraDepth=this.cameraTarget=(this.roundBase||0)+(l.height/2-this.roundAnchor)/2;this.cameraJob=null;}
    this.draw();}
  moveCamera(to,duration=2200,ease=easeInOut){this.cameraTarget=to;this.cameraJob={from:this.cameraDepth,to,start:performance.now(),duration:this.reduced?1:duration,ease};}
  setPhase(phase){this.phase=phase;this.targetActive=phase==='intro'||phase==='done'?0:1;if(phase==='intro')this.moveCamera(-45,700);}
  setDepth(value){this.target=value;if(!['plunge','surface'].includes(this.phase)){this.depth=value;if(this.phase==='landed')this.moveCamera(value+30,500);}}
  round(depth){this.target=depth;this.depth=depth;this.fx=null;this.roundBase=depth;const l=this.layout(),card=document.getElementById('prompt-card'),dockTop=l.height-80,cardHeight=card?.offsetHeight||180;this.roundAnchor=Math.max(8,Math.min(l.mobile?175:210,(dockTop-cardHeight)/2));this.moveCamera(depth+(l.height/2-this.roundAnchor)/2,2200);}
  drop(oldDepth,result,progress){this.cameraJob=null;this.fx={tier:result.tier,progress,startDepth:oldDepth,resultDepth:oldDepth+result.score*10};const eased=result.tier==='normie'?(1-Math.cos(Math.PI*progress))/2:easeInOut(progress);this.cameraDepth=mix(oldDepth+120,oldDepth+result.score*10+30,eased);this.cameraTarget=oldDepth+result.score*10+30;this.depth=result.tier==='satoshi'?oldDepth:mix(oldDepth,oldDepth+result.score*10,eased);this.target=oldDepth+result.score*10;}
  typeAt(x,y,n=2){if(this.reduced)return;for(let i=0;i<n;i++)this.particles.push(this.theme.paint.typeParticle.call(this,x,y));}
  burst(color=this.theme.palette.burst,n=30){if(this.reduced)return;const l=this.layout();for(let i=0;i<(this.lowPower?n/3:n);i++)this.particles.push({x:l.center,y:l.height/2-60,vx:(Math.random()-.5)*220,vy:(Math.random()-.5)*240-40,life:1,color});}
  tick(now){const dt=Math.min(.05,(now-this.last)/1000||.016);if(!document.hidden&&(!this.lowPower||now-this.last>=50)){this.dt=dt;this.last=now;this.time+=this.reduced?0:dt;if(this.cameraJob){const job=this.cameraJob,t=clamp((now-job.start)/job.duration,0,1);this.cameraDepth=mix(job.from,job.to,job.ease(t));if(t===1)this.cameraJob=null;}this.active=mix(this.active,this.targetActive,1-Math.exp(-3.6*dt));for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;if(!p.float)p.vy+=90*dt;p.life-=dt*.65;}this.particles=this.particles.filter(p=>p.life>0);this.draw();}requestAnimationFrame(t=>this.tick(t));}
  draw(){
    if(!this.ctx)return;const c=this.ctx,w=this.w,h=this.h,t=this.time,l=this.layout(),sea=l.height/2-this.cameraDepth*2,worldY=d=>l.height/2+(d-this.cameraDepth)*2,pal=this.theme.palette,paint=this.theme.paint,frame={w,h,t,l,sea,worldY};
    c.fillStyle=pal.ink;c.fillRect(0,0,w,h);
    paint.backdrop.call(this,frame);
    const rulerX=w-l.rail-14;c.lineWidth=1.5;c.strokeStyle=pal.ruler+'8c';c.fillStyle=pal.ruler+'e6';c.font='13px VT323';c.textAlign='right';c.beginPath();c.moveTo(rulerX,Math.max(0,sea));c.lineTo(rulerX,l.height);c.stroke();
    const minD=Math.max(0,Math.floor((this.cameraDepth-l.height/4)/10)*10),maxD=this.cameraDepth+l.height/4;
    for(let d=minD;d<=maxD;d+=10){const yy=worldY(d);if(yy<0||yy>l.height)continue;const size=d%100===0?16:d%50===0?10:5;c.beginPath();c.moveTo(rulerX-size,yy);c.lineTo(rulerX,yy);c.stroke();if(d%100===0&&(!this.roundIndex||Math.abs(yy-worldY(this.target))>14))c.fillText(d===0?'0m':`-${d.toLocaleString()}m`,rulerX-size-5,yy+4);}
    if(this.roundIndex){const yy=worldY(this.target);if(yy>0&&yy<l.height){c.fillStyle=pal.marker;c.beginPath();c.moveTo(rulerX+4,yy);c.lineTo(rulerX+12,yy-5);c.lineTo(rulerX+12,yy+5);c.fill();c.strokeStyle=pal.marker;c.beginPath();c.moveTo(rulerX-20,yy);c.lineTo(rulerX+4,yy);c.stroke();c.fillText('YOU',rulerX-24,yy+4);}}
    c.font=`${l.mobile?13:17}px VT323`;c.fillStyle=pal.ruler+(this.phase==='plunge'?'d9':'1a');for(const[d,text,side]of this.theme.landmarks){const yy=worldY(d);if(yy<90||yy>l.height-100)continue;if(['intro','done'].includes(this.phase))continue;c.textAlign=side==='L'?'left':'right';c.fillText(side==='L'?`── ${text}`:`${text} ──`,side==='L'?l.left+l.width*.05:w-l.rail-96,yy);}
    c.textAlign='left';
    if(this.fx&&(this.phase==='plunge'||this.phase==='landed'&&this.fx.tier==='satoshi'))paint.effect.call(this,l);
    for(const p of this.particles){c.globalAlpha=p.life;paint.particle.call(this,p);}c.globalAlpha=1;
    const introTop=document.getElementById('intro')?.offsetTop||l.height-190,fadeTop=this.phase==='intro'?introTop-14:l.height-85,fade=c.createLinearGradient(0,fadeTop,0,this.phase==='intro'?fadeTop+85:l.height+40);fade.addColorStop(0,pal.ink+'00');fade.addColorStop(.35,pal.ink+'de');fade.addColorStop(1,pal.ink);c.fillStyle=fade;c.fillRect(0,fadeTop,w,h-fadeTop);
    paint.foreground.call(this,frame);
    const hero=document.getElementById('hero');if(hero){hero.style.top=(sea-336)+'px';hero.style.opacity=this.phase==='intro'?'1':this.phase==='preview'?String(clamp((sea-175)/360,0,1)):'0';}
    if(['preview','answering','plunge'].includes(this.phase)){const card=document.getElementById('prompt-card');if(card)card.style.top=worldY(this.roundBase||0)+'px';}
    if(this.phase==='plunge')document.querySelectorAll('.tier-line').forEach(line=>line.style.top=worldY((this.fx?.startDepth||0)+Number(line.dataset.score)*10)+'px');
    const landing=document.getElementById('landing');if(landing&&this.phase==='landed')landing.style.top=(worldY(this.target)-124)+'px';
    const target=this.phase==='intro'?this.theme.layout.intro(l,w,sea):this.phase==='done'?(l.mobile?{x:w*.62,y:110}:{x:l.left+l.width*.82,y:l.height*.16}):this.phase==='landed'&&this.fx?.tier==='satoshi'?{x:l.center,y:worldY(this.target)-80}:this.phase==='landed'?{x:l.left+l.width*.16,y:l.mobile?l.height/2-226:l.height*.28}:this.phase==='plunge'?{x:Math.min(l.center+95,w-l.rail-44),y:l.height/2-74}:{x:l.left+48,y:l.height-168};
    const follow=1-Math.exp(-2.6*(this.dt||.016));this.mx=mix(this.mx*w,target.x,follow)/w;this.my=mix(this.my*h,target.y,follow)/h;const mascotSize=this.phase==='landed'&&this.fx?.tier==='satoshi'?(l.mobile?66:88):64;this.mascot.style.width=mascotSize+'px';this.mascot.style.height=mascotSize+'px';this.mascot.style.left=(this.mx*w-mascotSize/2)+'px';this.mascot.style.top=(this.my*h-mascotSize/2)+'px';this.mascot.style.transform='none';
  }
}
