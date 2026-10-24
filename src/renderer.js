/* Small offline 3D renderer. Geometry is transformed, depth sorted, lit,
   projected and hit-tested; the raised state changes the mesh height and
   camera angle. No remote library or image is required. */
(()=>{'use strict';
const C={ink:'#315c59',mint:'#b9dbc7',teal:'#579d8e',cream:'#fff4d5',yellow:'#f5ca68',orange:'#e9a17d',blue:'#96c6cc',pink:'#ddb0b9'};
const mix=(a,b,t)=>a+(b-a)*t;
function shade(hex,k){const x=hex.replace('#','');const a=[0,2,4].map(i=>parseInt(x.slice(i,i+2),16));return `rgb(${a.map(v=>Math.round(Math.max(0,Math.min(255,v*k)))).join(',')})`;}
function round(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function city(ctx,w,h,variant=0){
 ctx.fillStyle=variant===1?'#e9c3b8':variant===2?'#d2e4bd':'#bce0df';ctx.fillRect(0,0,w,h);
 ctx.fillStyle='#f7d170';ctx.beginPath();ctx.arc(w*.79,h*.22,w*.09,0,Math.PI*2);ctx.fill();
 const buildings=[[.04,.16,.44],[.23,.17,.62],[.45,.14,.49],[.64,.13,.72],[.81,.15,.39]];
 buildings.forEach((b,i)=>{let [xx,ww,hh]=b;xx*=w;ww*=w;hh*=h;ctx.fillStyle=['#6fa69f','#4d8d88','#91bbb0','#437c7e','#7aa59a'][i];round(ctx,xx,h*.87-hh,ww,hh,3);ctx.fill();if(i===3){ctx.beginPath();ctx.moveTo(xx,h*.87-hh);ctx.lineTo(xx+ww/2,h*.87-hh-h*.15);ctx.lineTo(xx+ww,h*.87-hh);ctx.fill();ctx.fillStyle='#d6ebe0';ctx.fillRect(xx+ww*.3,h*.87-hh+h*.1,ww*.4,h*.1);}
 ctx.fillStyle='#f6dfad';for(let ry=h*.87-hh+h*.08;ry<h*.81;ry+=h*.13){for(let rx=xx+ww*.18;rx<xx+ww*.8;rx+=ww*.37){ctx.fillRect(rx,ry,ww*.13,h*.055);}}});
 ctx.fillStyle='#d6c394';ctx.fillRect(0,h*.87,w,h*.13);ctx.fillStyle='#548b70';
 for(let i=0;i<4;i++){const x=w*(i*.28+.04);ctx.fillStyle='#a58256';ctx.fillRect(x,h*.69,w*.012,h*.24);ctx.fillStyle='#4f8c6d';ctx.beginPath();ctx.ellipse(x,h*.7,w*.055,h*.07,0,0,Math.PI*2);ctx.fill();}
}
const textureCache=new Map();
function texture(kind,label='',variant=0){const key=kind+label+variant;if(textureCache.has(key))return textureCache.get(key);const cv=document.createElement('canvas');cv.width=400;cv.height=280;let x=cv.getContext('2d');x.fillStyle='#fff7df';x.fillRect(0,0,400,280);x.strokeStyle=C.ink;x.lineWidth=6;
 if(kind==='image'){city(x,400,280,variant);}
 else if(kind==='copyright'){x.fillStyle='#f8d97d';x.fillRect(0,0,400,280);x.fillStyle=C.ink;x.font='bold 205px Arial';x.textAlign='center';x.fillText('©',200,215);}
 else if(kind==='cc'){x.fillStyle='#d1e6ca';x.fillRect(0,0,400,280);x.fillStyle=C.ink;x.font='bold 133px Arial';x.textAlign='center';x.fillText('CC',200,186);x.beginPath();x.arc(200,136,115,0,Math.PI*2);x.stroke();}
 else if(kind==='permission'){x.fillStyle='#f9ecc4';x.fillRect(0,0,400,280);x.strokeStyle='#acc6ac';x.lineWidth=8;for(let y=65;y<240;y+=43){x.beginPath();x.moveTo(50,y);x.lineTo(305,y);x.stroke();}x.strokeStyle='#36846a';x.lineWidth=20;x.beginPath();x.moveTo(215,170);x.lineTo(255,209);x.lineTo(346,108);x.stroke();}
 else if(kind==='browser'){x.fillStyle='#fff9e8';x.fillRect(0,0,400,280);x.fillStyle='#cde4d4';x.fillRect(0,0,400,56);x.fillStyle='#6e9c8b';for(let i=0;i<3;i++){x.beginPath();x.arc(25+i*22,27,7,0,Math.PI*2);x.fill();}x.fillStyle='#fffaf0';round(x,110,13,260,29,9);x.fill();x.fillStyle='#a6c3b1';round(x,55,85,290,37,18);x.fill();for(let i=0;i<3;i++){x.save();x.translate(28+i*123,150);x.scale(.25,.32);city(x,400,280,i);x.restore();}}
 else if(kind==='video'){city(x,400,280,1);x.fillStyle='#fff8e3dd';x.beginPath();x.arc(200,140,60,0,Math.PI*2);x.fill();x.fillStyle=C.ink;x.beginPath();x.moveTo(184,105);x.lineTo(184,175);x.lineTo(239,140);x.fill();}
 else if(kind==='coin'){x.fillStyle='#f4cd71';x.fillRect(0,0,400,280);x.fillStyle='#8f7437';x.font='bold 94px Lesson,Arial';x.textAlign='center';x.direction='rtl';x.fillText(label,200,170);}
 else if(kind==='person'){x.fillStyle='#d5e7d5';x.fillRect(0,0,400,280);x.fillStyle='#507e79';round(x,106,147,187,140,70);x.fill();x.fillStyle='#f2ca9f';x.beginPath();x.arc(200,99,66,0,Math.PI*2);x.fill();x.fillStyle='#45615b';x.beginPath();x.ellipse(200,55,67,27,0,0,Math.PI*2);x.fill();x.fillStyle='#315754';x.beginPath();x.arc(179,100,5,0,7);x.arc(221,100,5,0,7);x.fill();x.strokeStyle='#a77958';x.lineWidth=5;x.beginPath();x.arc(201,113,20,.2,Math.PI-.2);x.stroke();}
 textureCache.set(key,cv);return cv;}

class Paper3D{
 constructor(canvas,type,onSelect){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.type=type;this.onSelect=onSelect;this.raised=false;this.t=0;this.yaw=0;this.targetYaw=0;this.selected=null;this.disposed=false;this.hit=[];this.frame=0;this.geometry=[];this.dragging=null;this.resize=new ResizeObserver(()=>this.draw());this.resize.observe(canvas);this.down=e=>{this.dragging={x:e.clientX,y:e.clientY,yaw:this.yaw,moved:false};};this.move=e=>{if(!this.dragging||!this.raised)return;const dx=e.clientX-this.dragging.x,dy=e.clientY-this.dragging.y;if(Math.abs(dx)>7&&Math.abs(dx)>Math.abs(dy)*.8){this.dragging.moved=true;this.yaw=Math.max(-.65,Math.min(.65,this.dragging.yaw+dx*.006));this.draw();}};this.up=e=>{if(this.dragging&&!this.dragging.moved){let r=canvas.getBoundingClientRect();let p=[e.clientX-r.left,e.clientY-r.top];for(let i=this.hit.length-1;i>=0;i--){if(this.inside(p,this.hit[i].points)){this.select(this.hit[i].id);break;}}}this.dragging=null;};canvas.addEventListener('pointerdown',this.down);canvas.addEventListener('pointermove',this.move);canvas.addEventListener('pointerup',this.up);canvas.addEventListener('pointercancel',()=>this.dragging=null);this.draw();document.fonts.ready.then(()=>{if(!this.disposed)this.draw();});}
 inside(p,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){let a=poly[i],b=poly[j];if(((a[1]>p[1])!==(b[1]>p[1]))&&(p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]))inside=!inside;}return inside;}
 select(id){if(!id)return;this.selected=id;if(!this.raised)this.raise(true);this.draw();if(this.onSelect)this.onSelect(id);}
 raise(value){this.raised=value;cancelAnimationFrame(this.frame);let start=this.t,target=value?1:0;const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(reduce){this.t=target;this.draw();return;}let at=performance.now();const tick=now=>{if(this.disposed)return;let f=Math.min(1,(now-at)/650);this.t=mix(start,target,1-Math.pow(1-f,3));this.draw();if(f<1)this.frame=requestAnimationFrame(tick);};this.frame=requestAnimationFrame(tick);}
 rotate(n){this.yaw=Math.max(-.65,Math.min(.65,n));if(!this.raised)this.raise(true);this.draw();}
 box(x,y,z,w,d,h,col,id,tex){const a=x-w/2,b=x+w/2,c=y-d/2,e=y+d/2,f=z,g=z+h;const faces=[[[a,c,f],[b,c,f],[b,e,f],[a,e,f]],[[a,c,g],[a,e,g],[b,e,g],[b,c,g]],[[a,e,g],[a,e,f],[b,e,f],[b,e,g]],[[a,c,f],[a,c,g],[b,c,g],[b,c,f]],[[a,c,g],[a,c,f],[a,e,f],[a,e,g]],[[b,e,g],[b,e,f],[b,c,f],[b,c,g]]];const shades=[.72,1.06,.97,.8,.88,.8];faces.forEach((p,i)=>this.geometry.push({pts:p,color:shade(col,shades[i]),id,texture:tex&&((this.t<.55&&i===1)||(this.t>=.55&&i===2))?tex:null,face:i,outline:true}));}
 sphere(x,y,z,r,col,id,globe=false){const rows=10,cols=18;for(let i=0;i<rows;i++){for(let j=0;j<cols;j++){let a=i*Math.PI/rows-Math.PI/2,b=(i+1)*Math.PI/rows-Math.PI/2,c=j*Math.PI*2/cols,d=(j+1)*Math.PI*2/cols;let pt=(la,lo)=>[x+r*Math.cos(la)*Math.cos(lo),y+r*Math.cos(la)*Math.sin(lo),z+r*Math.sin(la)];let land=globe&&(Math.sin(j*1.7+i*.8)+Math.cos(i*1.9-j*.7)>.6);let base=land?'#8eb590':col;this.geometry.push({pts:[pt(a,c),pt(a,d),pt(b,d),pt(b,c)],color:shade(base,.76+.23*Math.sin(j*.3+i*.16)),id,outline:globe});}}}
 make(){this.geometry=[];let t=this.t,sel=this.selected;const lift=id=>sel===id?.17*t:0;this.labels=[];const box=(...args)=>this.box(...args),sphere=(...args)=>this.sphere(...args);
 if(this.type==='rights'){
  box(-3.5,0,lift('author'),2.1,1.55,2.3,C.mint,'author',texture('person'));this.labels.push([-3.5,0,2.6,'صاحب العمل','author']);
  box(0,0,lift('rights'),2.15,1.4,2.0,C.yellow,'rights',texture('copyright'));this.labels.push([0,0,2.4,'حقوق النشر','rights']);
  sphere(3.5,0,1.15+lift('network'),1.17,C.blue,'network',true);this.labels.push([3.5,0,2.7,'الشبكة العنكبوتية','network']);this.connections=[[-2.3,0,2.3,0]];
 }else if(this.type==='permission'){
  box(-3.5,0,lift('owner'),2.1,1.5,2.25,C.mint,'owner',texture('person'));this.labels.push([-3.5,0,2.6,'مالك الصورة','owner']);
  box(0,0,lift('permission'),2.05,1.4,2.5,C.cream,'permission',texture('permission'));this.labels.push([0,0,2.85,'الإذن','permission']);
  box(3.5,0,lift('image'),2.5,1.7,1.7,C.orange,'image',texture('image'));this.labels.push([3.5,0,2.15,'الصورة','image']);this.connections=[[-2.3,0,2.1,0]];
 }else if(this.type==='cc'){
  box(-3.5,0,lift('creator'),2.05,1.5,2.15,C.mint,'creator',texture('person'));this.labels.push([-3.5,0,2.55,'المبدعون','creator']);
  box(0,0,lift('cc'),2.4,1.5,2.4,C.mint,'cc',texture('cc'));this.labels.push([0,0,2.8,'المشاع الإبداعي','cc']);
  box(3.6,0,lift('reuse'),2.4,1.7,1.8,C.blue,'reuse',texture('image'));this.labels.push([3.6,0,2.2,'إعادة الاستخدام','reuse']);this.connections=[[-2.3,0,2.3,0]];
 }else if(this.type==='sizes'){
  const o=[[-3.65,1.65,1.1,'small','صغيرة',2],[-.6,2.4,1.65,'medium','متوسطة',1],[3.3,3.05,2.1,'large','كبيرة',0]];o.forEach(([x,w,h,id,label,v])=>{box(x,sel===id?.5:0,lift(id),w,1.3,h,v===0?C.yellow:v===1?C.mint:C.blue,id,texture('image','',v));this.labels.push([x,0,h+.5,label,id]);});this.connections=[];
 }else if(this.type==='commercial'){
  box(-3.45,0,lift('free'),2.6,1.6,2.1,C.mint,'free',texture('coin','دون رسوم'));this.labels.push([-3.45,0,2.6,'المواقع المجانية','free']);
  box(0,-.15,lift('license'),1.6,1.5,1.5,C.cream,'license',texture('copyright'));this.labels.push([0,-.15,2.0,'الترخيص','license']);
  box(3.45,0,lift('paid'),2.6,1.6,2.1,C.yellow,'paid',texture('coin','رسوم'));this.labels.push([3.45,0,2.6,'المواقع التجارية','paid']);this.connections=[[-2.0,0,2,0]];
 }else if(this.type==='browser'){
  box(0,-.3,0,7.7,2.6,3.8,C.mint,'search',texture('browser'));this.labels.push([0,0,4.2,'البحث عن الوسائط','search']);this.connections=[];
 }else if(this.type==='video'){
  box(0,0,0,6,2.6,3.4,C.mint,'play',texture('video'));box(-3.7,0,0,1,1.5,1.7,C.yellow,'source',texture('coin','فيديو'));this.labels.push([0,0,3.9,'مقاطع الفيديو','play']);this.connections=[];
 }
 }
 project(p){let c=Math.cos(this.yaw),s=Math.sin(this.yaw),x=p[0]*c-p[1]*s,y=p[0]*s+p[1]*c,z=p[2]*mix(.055,1,this.t);let angle=mix(.08,1.02,this.t);let sy=y*Math.cos(angle)-z*Math.sin(angle);let dep=y*Math.sin(angle)+z*Math.cos(angle);let perspective=1/(1-dep*.027);let scale=Math.min(this.w/12.5,this.h/4.2);return [this.w/2+x*scale*perspective,this.h*mix(.52,.74,this.t)+sy*scale*perspective,dep];}
 drawTexture(img,p){const ctx=this.ctx;ctx.save();ctx.beginPath();p.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.clip();let q=p;
 // Normalize texture corners for the selected face winding.
 let leftTop=q[0],rightTop=q[3],leftBottom=q[1];
 ctx.transform((rightTop[0]-leftTop[0])/img.width,(rightTop[1]-leftTop[1])/img.width,(leftBottom[0]-leftTop[0])/img.height,(leftBottom[1]-leftTop[1])/img.height,leftTop[0],leftTop[1]);
 ctx.drawImage(img,0,0);ctx.restore();}
 draw(){if(this.disposed)return;const bounds=this.canvas.getBoundingClientRect();if(!bounds.width)return;this.w=bounds.width;this.h=bounds.height;let dpr=Math.min(window.devicePixelRatio||1,2);let rw=Math.round(this.w*dpr),rh=Math.round(this.h*dpr);if(this.canvas.width!==rw||this.canvas.height!==rh){this.canvas.width=rw;this.canvas.height=rh;}let ctx=this.ctx;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,this.w,this.h);this.make();this.hit=[];
 this.labels.forEach(([x,y,z,lab,id])=>{let p=this.project([x,y,.01]);ctx.save();ctx.translate(p[0],p[1]+8);ctx.scale(1,.28);ctx.fillStyle=this.selected===id?'#d8b76044':'#5f7f6230';ctx.beginPath();ctx.ellipse(0,0,Math.min(75,this.w/8),31,0,0,Math.PI*2);ctx.fill();ctx.restore();});
 if(this.connections?.length){const [a,b,c,d]=this.connections[0],p=this.project([a,b,.1]),q=this.project([c,d,.1]);ctx.save();ctx.strokeStyle='#b9b27a';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();ctx.restore();}
 let fs=this.geometry.map(f=>{let points=f.pts.map(p=>this.project(p));return {...f,points,depth:points.reduce((s,p)=>s+p[2],0)/points.length};}).sort((a,b)=>a.depth-b.depth);
 for(let f of fs){let p=f.points;ctx.save();ctx.beginPath();p.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.fillStyle=f.color;ctx.fill();if(f.texture){this.drawTexture(f.texture,p);ctx.setTransform(dpr,0,0,dpr,0,0);}ctx.strokeStyle=f.id===this.selected?'#946d37':'#345f5966';ctx.lineWidth=f.outline?1.15:.35;ctx.stroke();ctx.restore();this.hit.push({points:p,id:f.id});}
 for(let [x,y,z,label,id]of this.labels){
 let p=this.project([x,y,z+.15]);ctx.save();let font=Math.max(11.5,Math.min(15.5,this.w/45));ctx.font=`${font}px Lesson,Arial`;ctx.textAlign='center';ctx.direction='rtl';
 let maxWidth=Math.max(50,Math.min(190,this.w/this.labels.length-19)),lines=[],line='';
 for(const word of label.split(' ')){let next=line?line+' '+word:word;if(line&&ctx.measureText(next).width>maxWidth){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);
 let lineHeight=font*1.45,wid=Math.max(...lines.map(line=>ctx.measureText(line).width))+17,height=lines.length*lineHeight+9;
 let top=Math.max(3,p[1]-height-8),left=Math.max(2,Math.min(this.w-wid-2,p[0]-wid/2));
 ctx.fillStyle=id===this.selected?'#fff1ba':'#fffaf0e9';ctx.strokeStyle=id===this.selected?'#c6a353':'#bacbb4';ctx.lineWidth=1;round(ctx,left,top,wid,height,8);ctx.fill();ctx.stroke();ctx.fillStyle='#345b51';lines.forEach((line,i)=>ctx.fillText(line,left+wid/2,top+font+4+i*lineHeight));ctx.restore();}

 }
 dispose(){this.disposed=true;cancelAnimationFrame(this.frame);this.resize.disconnect();this.canvas.removeEventListener('pointerdown',this.down);this.canvas.removeEventListener('pointermove',this.move);this.canvas.removeEventListener('pointerup',this.up);}
}
window.Paper3D=Paper3D;
window.paperCitySVG=(variant=0)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" role="img" aria-label="رسم توضيحي للرياض"><rect width="400" height="250" fill="${['#c5e5df','#f0cdb8','#d9e4bc'][variant%3]}"/><circle cx="326" cy="55" r="29" fill="#f5cf70"/><path d="M0 190 Q70 170 143 190T400 183V250H0Z" fill="#c2cda7"/><g stroke="#47736e" stroke-width="2" stroke-linejoin="round"><rect x="22" y="109" width="54" height="107" rx="4" fill="#83b7a9"/><rect x="91" y="72" width="66" height="144" rx="5" fill="#639d95"/><path d="M185 216V100h53v116" fill="#a6c5aa"/><path d="M266 216V69l27-45 28 45v147Z" fill="#4f8a87"/><rect x="279" y="79" width="28" height="27" rx="6" fill="#c6e3d9"/><rect x="341" y="130" width="44" height="86" rx="4" fill="#7bafa0"/></g><g fill="#f9e4a8"><path d="M36 122h9v13h-9zm20 0h9v13h-9zm-20 26h9v13h-9zm20 0h9v13h-9zm-20 26h9v13h-9zm20 0h9v13h-9zM105 90h10v13h-10zm24 0h10v13h-10zm-24 28h10v13h-10zm24 0h10v13h-10zm-24 28h10v13h-10zm24 0h10v13h-10zm-24 28h10v13h-10zm24 0h10v13h-10zM196 118h9v13h-9zm20 0h9v13h-9zm-20 28h9v13h-9zm20 0h9v13h-9zM281 121h8v13h-8zm16 0h8v13h-8zm-16 27h8v13h-8zm16 0h8v13h-8zm-16 27h8v13h-8zm16 0h8v13h-8zM353 145h8v13h-8zm14 0h8v13h-8zm-14 26h8v13h-8zm14 0h8v13h-8z"/></g><path d="M0 216H400V250H0Z" fill="#e2cfa3"/><g fill="#4d8d6e"><path d="M61 200v32h5v-32zM235 194v38h5v-38z" fill="#9b8054"/><ellipse cx="62" cy="197" rx="22" ry="13"/><ellipse cx="236" cy="190" rx="24" ry="14"/></g></svg>`;
})();
