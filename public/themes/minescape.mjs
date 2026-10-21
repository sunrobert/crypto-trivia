// Cached pixel scenery for the mine shaft: topsoil, rock strata, deep crystal cavern.
// Same draw contract and depth bands as Seascape.
const n=i=>{const v=Math.sin(i*91.37+18.9)*43758.54;return v-Math.floor(v)};
const step=v=>Math.round(v/2)*2;
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(step(x),step(y)):c.moveTo(step(x),step(y)));c.closePath();c.fill()}
function grain(c,seed,color,amount=.06){for(let y=0;y<688;y+=2)for(let x=0;x<384;x+=2)if(n(x*13+y*57+seed)<amount){c.fillStyle=color;c.fillRect(x,y,2,2)}}
// Jagged shaft walls on both sides; the open middle stays darker so prompts read well.
function walls(c,seed,color,edge){for(let side=0;side<2;side++){const pts=[[side?384:0,0]];for(let y=0;y<=688;y+=24)pts.push([side?384-(46+n(y+seed+side*7)*34):46+n(y+seed+side*7)*34,y]);pts.push([side?384:0,688]);poly(c,pts,color);const rim=pts.slice(1,-1);c.fillStyle=edge;for(const[x,y]of rim)c.fillRect(step(x)-(side?0:2),y,2,24)}}
function timber(c,y){c.fillStyle='#3a2518';c.fillRect(34,y,5,80);c.fillRect(345,y,5,80);c.fillStyle='#4f3322';c.fillRect(34,y,316,4);c.fillStyle='#24170f';c.fillRect(34,y+4,316,1)}
function topsoil(c){const g=c.createLinearGradient(0,0,0,688);g.addColorStop(0,'#3a2618');g.addColorStop(.5,'#2c1d16');g.addColorStop(1,'#211719');c.fillStyle=g;c.fillRect(0,0,384,688);
 grain(c,1,'#4c3424',.08);grain(c,5,'#1a110d',.05);walls(c,3,'#1d130e','#5a3c28');
 for(let i=0;i<14;i++){const x=n(i+4)>.5?10+n(i)*40:330+n(i)*40,y=20+n(i+9)*640;c.strokeStyle='#5c4030';c.lineWidth=2;c.beginPath();c.moveTo(x,y);for(let j=1;j<6;j++)c.lineTo(x+(n(i*7+j)-.5)*18,y+j*9);c.stroke()}
 for(let i=0;i<40;i++){const x=n(i+30)*384,y=n(i+60)*688;c.fillStyle=n(i)>.5?'#6a5a52':'#4e4440';c.fillRect(step(x),step(y),6,4)}
 for(const y of[60,320,580])timber(c,y)}
function strata(c){const g=c.createLinearGradient(0,0,0,688);g.addColorStop(0,'#24202a');g.addColorStop(1,'#1a1722');c.fillStyle=g;c.fillRect(0,0,384,688);
 for(let b=0;b<12;b++){const y=b*58+n(b)*20,tilt=(n(b+3)-.5)*40;poly(c,[[0,y],[384,y+tilt],[384,y+tilt+18+n(b+5)*16],[0,y+20+n(b+8)*14]],['#2b2632','#302a30','#26222e','#2e2834'][b%4])}
 grain(c,11,'#3a3440',.06);walls(c,13,'#110f16','#3e3646');
 for(let i=0;i<70;i++){const x=n(i+90)*384,y=n(i+120)*688,k=n(i+7);c.fillStyle=k>.86?'#e07a2e':k>.72?'#0b0a0d':k>.66?'#3fbf9a':'#4a4450';c.fillRect(step(x),step(y),k>.66?4:2,k>.66?4:2)}}
function cavern(c){const g=c.createLinearGradient(0,0,0,688);g.addColorStop(0,'#160f22');g.addColorStop(1,'#08060e');c.fillStyle=g;c.fillRect(0,0,384,688);
 grain(c,21,'#231a33',.05);walls(c,23,'#05040a','#2a1f3d');
 for(let i=0;i<9;i++){const x=n(i+300)>.5?20+n(i)*50:314+n(i)*50,y=30+n(i+40)*620,color=n(i+2)>.5?'#47ced9':'#c46bff';for(let j=0;j<4;j++){const h=14+n(i*5+j)*26,xx=x+j*7-10;poly(c,[[xx,y],[xx+4,y-h],[xx+8,y]],color+'cc');c.fillStyle='#ffffff55';c.fillRect(step(xx+3),step(y-h+4),2,4)}}
 for(let v=0;v<5;v++){const y=60+v*130+n(v)*40;c.strokeStyle='#ffd84a';c.lineWidth=2;c.beginPath();let x=n(v+8)>.5?0:384;c.moveTo(x,y);for(let j=1;j<9;j++){x+=(x<192?1:-1)*(10+n(v*9+j)*12);c.lineTo(x,y+(n(v*3+j)-.5)*30)}c.stroke();c.fillStyle='#fff3a6';for(let j=0;j<4;j++)c.fillRect(step(20+n(v*4+j)*344),step(y+(n(j+v)-.5)*24),2,2)}}
export class Minescape{
 constructor(){this.layers=[topsoil,strata,cavern].map(paint=>{const canvas=document.createElement('canvas');canvas.width=384;canvas.height=688;paint(canvas.getContext('2d'));return canvas})}
 draw(ctx,w,h,worldY){for(const [index,start,end,alpha]of[[0,0,470,.95],[1,480,2620,.9],[2,2950,7060,.9]]){
  const topY=worldY(start),bottom=worldY(end);if(topY>h||bottom<0)continue;const scale=w/384,tileH=688*scale;
  ctx.save();
  for(let y=Math.max(0,topY);y<Math.min(h,bottom);){
   const sourceY=((y-topY)%tileH+tileH)%tileH,strip=Math.min(8,h-y,bottom-y,tileH-sourceY),fade=Math.max(0,Math.min(1,index?(y+strip/2-topY)/150:1,(bottom-y-strip/2)/150));
   ctx.globalAlpha=alpha*fade;ctx.drawImage(this.layers[index],0,sourceY/scale,384,strip/scale,0,y,w,strip+.5);y+=strip;
  }
  ctx.restore();
 }}
}
