/* Juego "Separa tus residuos" (PROSEREM · Agenda Ambiental UASLP). Compartido por index.html (RA) y visor.html (sin cámara).
   Unidades locales: 1 = ancho del marcador. Botes 3D (models/*.gltf), residuos = tarjetas planas con icono PROSEREM. */
(function(){
/* iOS < 16: CanvasRenderingContext2D.roundRect no existe */
if(!CanvasRenderingContext2D.prototype.roundRect)CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){r=Math.min(r,w/2,h/2);this.moveTo(x+r,y);this.arcTo(x+w,y,x+w,y+h,r);this.arcTo(x+w,y+h,x,y+h,r);this.arcTo(x,y+h,x,y,r);this.arcTo(x,y,x+w,y,r);this.closePath();};
const T=()=>AFRAME.THREE;const $=s=>document.querySelector(s);
const NIVELES=[ // velocidad de caída (u/s), intervalo de aparición (s), máximo simultáneo
 {v:.0825,int:6.4,max:1},{v:.1125,int:5.07,max:1},{v:.15,int:4.0,max:2},{v:.195,int:3.2,max:2},{v:.2475,int:2.53,max:3},{v:.315,int:1.93,max:4}];
const POR_NIVEL=6,VIDAS=3,TIEMPO=120,XB=[-0.56,0,0.56],HB=0.52,Y0=2.21,ZJ=0.25;
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
function anim(d,fn,done){const t0=performance.now();(function f(){const k=Math.min(1,(performance.now()-t0)/d);fn(k);k<1?requestAnimationFrame(f):done&&done();})();}
const imgs={};function img(id){if(!imgs[id]){imgs[id]=new Image();imgs[id].src=ICONOS[id];}return imgs[id];}
function lienzo(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function plano(cv,ancho){const th=T(),t=new th.CanvasTexture(cv);t.colorSpace=th.SRGBColorSpace;t.anisotropy=4;
 return new th.Mesh(new th.PlaneGeometry(ancho,ancho*cv.height/cv.width),new th.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));}
// Residuo plano: icono a color natural (contorno blanco + sombra, sin fondo) y etiqueta con su nombre
function tarjeta(it){const W=600,H=720,cv=lienzo(W,H),c=cv.getContext('2d');
 const i=img(it[0]),dib=()=>{c.clearRect(0,0,W,H);const s=Math.min(560/i.width,560/i.height);c.drawImage(i,W/2-i.width*s/2,290-i.height*s/2,i.width*s,i.height*s);
  c.textAlign='center';let fs=54;c.font=`800 ${fs}px Arial`;while(c.measureText(it[1]).width>W-60&&fs>30){fs-=2;c.font=`800 ${fs}px Arial`;}
  const tw=Math.min(W-10,c.measureText(it[1]).width+50);c.beginPath();c.roundRect(W/2-tw/2,600,tw,fs+30,(fs+30)/2);c.fillStyle='rgba(14,34,64,.82)';c.fill();c.lineWidth=4;c.strokeStyle='rgba(255,255,255,.9)';c.stroke();
  c.fillStyle='#fff';c.fillText(it[1],W/2,600+fs+6);if(mesh.material.map)mesh.material.map.needsUpdate=true;};
 const mesh=plano(cv,0.6);i.complete&&i.naturalWidth?dib():i.addEventListener('load',dib);return mesh;}
window._tarjeta=tarjeta;
function radial(col,a){const cv=lienzo(128,128),c=cv.getContext('2d'),g=c.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');c.globalAlpha=a;c.fillStyle=g;c.fillRect(0,0,128,128);
 const t=new (T().CanvasTexture)(cv);t.colorSpace=T().SRGBColorSpace;return t;}
function entorno(r){const th=T(),s=new th.Scene(),pm=new th.PMREMGenerator(r);
 const cv=lienzo(4,256),c=cv.getContext('2d'),g=c.createLinearGradient(0,0,0,256);g.addColorStop(0,'#ffffff');g.addColorStop(.45,'#9fc6e8');g.addColorStop(.55,'#2b4a6b');g.addColorStop(1,'#10151c');c.fillStyle=g;c.fillRect(0,0,4,256);
 const t=new th.CanvasTexture(cv);s.add(new th.Mesh(new th.SphereGeometry(10,32,16),new th.MeshBasicMaterial({map:t,side:th.BackSide})));
 const l=new th.Mesh(new th.PlaneGeometry(6,2),new th.MeshBasicMaterial({color:0xffffff}));l.position.set(3,4,4);l.lookAt(0,0,0);s.add(l);
 const e=pm.fromScene(s,0.04).texture;pm.dispose();return e;}

AFRAME.registerComponent('juego',{
 init(){const th=T();this.root=this.el.object3D;this.items=[];this.botes=[];this.part=[];this.jugando=false;this.pausa=false;
  this.el.sceneEl.addEventListener('renderstart',()=>{this.el.sceneEl.object3D.environment=entorno(this.el.sceneEl.renderer);});
  PROSEREM.cats.forEach((cat,i)=>{const e=document.createElement('a-entity');e.setAttribute('gltf-model',`models/bote_${cat.id}.gltf`);
   e.object3D.position.set(XB[i],0,ZJ);this.el.appendChild(e);const b={cat,e,i,glow:null};this.botes.push(b);
   e.addEventListener('model-loaded',()=>{const m=e.getObject3D('mesh');b.tapa=m.getObjectByName('Tapa');m.traverse(o=>{if(o.isMesh){o.userData.bote=i;if(o.material.name==='Cuerpo')b.mat=o.material;}});});
   const sh=new th.Mesh(new th.PlaneGeometry(0.62,0.62),new th.MeshBasicMaterial({map:radial('rgba(0,0,0,1)',.55),transparent:true,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.set(XB[i],0.003,ZJ);this.root.add(sh);
   const gl=new th.Mesh(new th.PlaneGeometry(0.75,0.75),new th.MeshBasicMaterial({map:radial(cat.color,1),transparent:true,depthWrite:false,blending:th.AdditiveBlending,opacity:0}));gl.position.set(XB[i],HB*.55,ZJ-0.22);this.root.add(gl);b.glow=gl;
   // zona de toque invisible grande por bote
   const z=new th.Mesh(new th.BoxGeometry(0.5,0.8,0.5),new th.MeshBasicMaterial({visible:false}));z.position.set(XB[i],0.35,ZJ);z.userData.bote=i;this.root.add(z);b.zona=z;});
  // flecha guía (bote correcto tras error)
  const fc=lienzo(256,256),c=fc.getContext('2d');c.fillStyle='#fff';c.strokeStyle='#E53E3E';c.lineWidth=18;c.beginPath();c.moveTo(128,236);c.lineTo(30,110);c.lineTo(88,110);c.lineTo(88,20);c.lineTo(168,20);c.lineTo(168,110);c.lineTo(226,110);c.closePath();c.stroke();c.fill();
  this.flecha=plano(fc,0.2);this.flecha.visible=false;this.root.add(this.flecha);
  // suelo/zona de juego sutil
  const ar=new th.Mesh(new th.RingGeometry(0.98,1.0,96),new th.MeshBasicMaterial({color:0x5AE0F0,transparent:true,opacity:.5,depthWrite:false}));ar.rotation.x=-Math.PI/2;ar.scale.set(1,.42,1);ar.position.set(0,0.002,ZJ);this.root.add(ar);
  this.gestos();window.JUEGO=this;},
 nuevo(nivel){this.items.forEach(x=>this.root.remove(x.m));this.items=[];this.nivel=nivel;this.nivel0=nivel;Object.assign(this,{puntos:0,racha:0,mejor:0,vidas:VIDAS,tiempo:TIEMPO,ok:0,mal:0,okNivel:0,errores:[],tSig:0.6,jugando:true});
  this.bolsa=[];hud(this);},
 sacar(){if(!this.bolsa.length)this.bolsa=PROSEREM.items.slice().sort(()=>Math.random()-.5);return this.bolsa.pop();},
 aparecer(){const it=this.sacar(),m=tarjeta(it),x=XB[Math.floor(Math.random()*3)]*0.6+(Math.random()-.5)*0.3;m.position.set(x,Y0,ZJ+0.12);this.root.add(m);
  this.items.push({it,m,x,y:Y0,vivo:true,t:0,tiro:null});},
 activo(){let a=null;this.items.forEach(o=>{if(o.vivo&&!o.tiro&&(!a||o.y<a.y))a=o;});return a;},
 tick(t,dt){if(!dt)return;dt=Math.min(dt,50)/1000;this.part.forEach(p=>p.u(dt));this.part=this.part.filter(p=>p.vivo);
  if(!this.jugando||this.pausa)return;const N=NIVELES[this.nivel-1];
  this.tiempo-=dt;if(this.tiempo<=0){this.tiempo=0;return this.fin();}
  this.tSig-=dt;if(this.tSig<=0&&this.items.filter(o=>o.vivo).length<N.max){this.aparecer();this.tSig=N.int;}
  const act=this.activo();
  this.items.forEach(o=>{if(!o.vivo||o.tiro)return;o.t+=dt;o.y-=N.v*dt;o.m.position.set(o.x,o.y+Math.sin(o.t*3)*0.01,ZJ+0.12);o.m.rotation.z=Math.sin(o.t*2)*0.06;
   o.m.scale.setScalar(o===act?1.08:0.9);o.m.material.opacity=o===act?1:.8;
   if(o.y<HB+0.12){const i=XB.findIndex(x=>Math.abs(x-o.x)<0.22);if(i>=0)this.resolver(o,i);else if(o.y<0.12)this.suelo(o);}});
  this.botes.forEach(b=>{if(b.glow.material.opacity>0)b.glow.material.opacity=Math.max(0,b.glow.material.opacity-dt*0.9);});
  hud(this);},
 enviar(i){const o=this.activo();if(o)this.resolver(o,i,true);},
 resolver(o,i,volar){o.tiro=i;const b=this.botes[i],x0=o.x,y0=o.y,frac=Math.max(0,Math.min(1,(y0-HB)/(Y0-HB)));
  this.abrir(b);anim(volar?380:220,k=>{const e=ease(k);o.m.position.set(x0+(XB[i]-x0)*e,y0+(HB+0.05-y0)*e+Math.sin(k*Math.PI)*0.18*(volar?1:0),ZJ+0.12-0.12*e);o.m.scale.setScalar(0.9*(1-0.75*e));},()=>{
   this.root.remove(o.m);o.vivo=false;this.items=this.items.filter(x=>x!==o);if(!this.jugando)return;
   if(o.it[2]===b.cat.id){this.racha++;this.mejor=Math.max(this.mejor,this.racha);const mult=Math.min(3,1+0.5*Math.floor(this.racha/3));
    const pts=Math.round((100+100*frac)*mult);this.puntos+=pts;this.ok++;this.okNivel++;
    b.glow.material.opacity=1;this.chispas(b,b.cat.color,40);aviso('ok',`¡Correcto! +${pts}`,mult>1?`Racha ×${mult}`:o.it[1]+' → '+b.cat.sub.toLowerCase());
    if(this.okNivel>=POR_NIVEL&&this.nivel<NIVELES.length){this.nivel++;this.okNivel=0;setTimeout(()=>aviso('nivel',`¡Nivel ${this.nivel}!`,'Caen más rápido y más seguido'),900);}}
   else{const c=PROSEREM.cats.find(x=>x.id===o.it[2]),ic=PROSEREM.cats.indexOf(c);this.error(o,ic,`${o.it[1]} va en ${c.titulo} ${c.sub}`,c.tip);this.sacudir(b);}
   hud(this);});},
 suelo(o){o.vivo=false;o.tiro=-1;const c=PROSEREM.cats.find(x=>x.id===o.it[2]),ic=PROSEREM.cats.indexOf(c);
  anim(300,k=>{o.m.material.opacity=1-k;o.m.position.y=o.y-0.05*k;},()=>{this.root.remove(o.m);this.items=this.items.filter(x=>x!==o);});
  this.error(o,ic,`¡Cayó al suelo! ${o.it[1]} va en ${c.sub.toLowerCase()}`,c.tip);},
 error(o,ic,txt,tip){this.mal++;this.racha=0;this.vidas--;this.errores.push([o.it[1],PROSEREM.cats[ic]]);const b=this.botes[ic];
  b.glow.material.opacity=1.4;this.flecha.visible=true;this.flecha.position.set(XB[ic],HB+0.28,ZJ+0.1);anim(2200,k=>{this.flecha.position.y=HB+0.28+Math.abs(Math.sin(k*12))*0.05;b.glow.material.opacity=Math.max(b.glow.material.opacity,0.8);},()=>this.flecha.visible=false);
  this.chispas(this.botes[ic],'#ffffff',20);aviso('mal',txt,tip,ic);if(this.vidas<=0)setTimeout(()=>this.fin(),1400);},
 abrir(b){if(!b.tapa)return;anim(700,k=>{b.tapa.rotation.x=-1.25*Math.sin(Math.PI*Math.min(1,k*1.3));});},
 sacudir(b){const m=b.mat,c0=m&&m.emissive.clone();anim(500,k=>{b.e.object3D.position.x=XB[b.i]+Math.sin(k*40)*0.02*(1-k);if(m)m.emissive.setRGB(0.6*(1-k),0,0);},()=>{if(m)m.emissive.copy(c0);});},
 chispas(b,col,n){const th=T(),g=new th.BufferGeometry(),P=new Float32Array(n*3),V=[];for(let i=0;i<n;i++){P.set([XB[b.i],HB,ZJ],i*3);V.push([(Math.random()-.5)*0.9,0.6+Math.random()*0.9,(Math.random()-.5)*0.6]);}
  g.setAttribute('position',new th.BufferAttribute(P,3));const m=new th.PointsMaterial({color:col,size:0.035,map:radial('#fff',1),transparent:true,depthWrite:false,blending:th.AdditiveBlending});
  const pt=new th.Points(g,m);this.root.add(pt);let t=0;const p={vivo:true,u:dt=>{t+=dt;for(let i=0;i<n;i++){P[i*3]+=V[i][0]*dt;P[i*3+1]+=V[i][1]*dt;P[i*3+2]+=V[i][2]*dt;V[i][1]-=2.2*dt;}
   g.attributes.position.needsUpdate=true;m.opacity=Math.max(0,1-t/0.9);if(t>0.9){p.vivo=false;this.root.remove(pt);g.dispose();}}};this.part.push(p);},
 fin(){if(!this.jugando)return;this.jugando=false;this.items.forEach(x=>this.root.remove(x.m));this.items=[];resumen(this);},
 // Gestos: arrastrar mueve el residuo activo; lanzar (flick) lo envía; tocar un bote lo envía a ese bote.
 pxPorU(){const th=T(),cam=this.el.sceneEl.camera;if(!cam)return 300;this.root.updateMatrixWorld();
  const a=new th.Vector3(0,0.8,ZJ).applyMatrix4(this.root.matrixWorld).project(cam),b=new th.Vector3(1,0.8,ZJ).applyMatrix4(this.root.matrixWorld).project(cam);
  return Math.max(30,Math.hypot((b.x-a.x)*innerWidth/2,(b.y-a.y)*innerHeight/2))*Math.sign(b.x-a.x||1);},
 tocar(cx,cy){const th=T(),cam=this.el.sceneEl.camera;if(!cam)return;cam.updateMatrixWorld();cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
  const r=new th.Raycaster();r.far=100000;r.setFromCamera(new th.Vector2(cx/innerWidth*2-1,-cy/innerHeight*2+1),cam);
  const h=r.intersectObjects(this.botes.map(b=>b.zona),false)[0];if(h)this.enviar(h.object.userData.bote);},
 gestos(){const el=this.el.sceneEl.canvas||document.body;let p=null;
  const abajo=e=>{if(!this.jugando||e.target.closest&&e.target.closest('button,.panelj'))return;const o=this.activo();p={x:e.clientX,y:e.clientY,t:performance.now(),o,x0:o&&o.x,k:this.pxPorU(),hist:[[e.clientX,performance.now()]]};};
  const mover=e=>{if(!p||!p.o||!p.o.vivo||p.o.tiro)return;p.hist.push([e.clientX,performance.now()]);if(p.hist.length>6)p.hist.shift();p.o.x=Math.max(-0.85,Math.min(0.85,p.x0+(e.clientX-p.x)/p.k));};
  const arriba=e=>{if(!p)return;const d=Math.hypot(e.clientX-p.x,e.clientY-p.y),h=p.hist,v=h.length>1?(h[h.length-1][0]-h[0][0])/Math.max(1,h[h.length-1][1]-h[0][1]):0;
   if(d<14)this.tocar(e.clientX,e.clientY);
   else if(p.o&&p.o.vivo&&!p.o.tiro){const cerca=XB.reduce((bi,x,j)=>Math.abs(x-p.o.x)<Math.abs(XB[bi]-p.o.x)?j:bi,0);
    if(Math.abs(v)>0.8){const s=Math.sign(v)*Math.sign(p.k);let i=cerca;if(s>0&&XB[cerca]<p.o.x+0.05)i=Math.min(2,cerca+1);if(s<0&&XB[cerca]>p.o.x-0.05)i=Math.max(0,cerca-1);this.resolver(p.o,i,true);}
    else if(e.clientY-p.y>80)this.resolver(p.o,cerca,true);}
   p=null;};
  document.addEventListener('pointerdown',abajo);document.addEventListener('pointermove',mover);document.addEventListener('pointerup',arriba);
  ['gesturestart','gesturechange'].forEach(t=>document.addEventListener(t,e=>e.preventDefault()));
  // pellizco: escala el juego completo
  let d0=0,s0=1;document.addEventListener('touchstart',e=>{if(e.touches.length==2){d0=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);s0=this.root.scale.x;p=null;}},{passive:true});
  document.addEventListener('touchmove',e=>{if(e.touches.length==2&&d0){e.preventDefault();const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);this.root.scale.setScalar(Math.min(this.base*2.5,Math.max(this.base*.5,s0*d/d0)));}},{passive:false});
  document.addEventListener('touchend',()=>d0=0);
  this.base=this.root.scale.x;
  document.addEventListener('wheel',e=>{e.preventDefault();this.root.scale.setScalar(Math.min(this.base*2.5,Math.max(this.base*.5,this.root.scale.x*Math.exp(-e.deltaY*0.0015))));},{passive:false});}
});

/* ---------- Interfaz HTML (HUD, avisos, menú, resumen) ---------- */
function hud(j){const h=$('#hud');if(!h)return;h.innerHTML=`<div><small>Puntos</small><b>${j.puntos}</b></div><div><small>Nivel</small><b>${j.nivel}</b></div>
 <div><small>Racha</small><b>${j.racha}${j.racha>=3?' <i>×'+Math.min(3,1+0.5*Math.floor(j.racha/3))+'</i>':''}</b></div><div><small>Vidas</small><b class="vidas">${'♥'.repeat(Math.max(0,j.vidas))}<span>${'♥'.repeat(VIDAS-Math.max(0,j.vidas))}</span></b></div>
 <div><small>Tiempo</small><b>${Math.floor(j.tiempo/60)}:${String(Math.ceil(j.tiempo%60)%60).padStart(2,'0')}</b></div>`;}
let tAv;function aviso(tipo,t1,t2,ic){const a=$('#aviso');a.className='aviso-j '+tipo;const c=ic!=null?PROSEREM.cats[ic]:null;
 a.innerHTML=`<b>${tipo==='ok'?'✔ ':tipo==='mal'?'✖ ':'★ '}${t1}</b>${t2?`<span>${tipo==='mal'?'💡 ':''}${t2}</span>`:''}${c?`<em style="background:${c.color}">→ ${c.titulo} ${c.sub}</em>`:''}`;
 clearTimeout(tAv);tAv=setTimeout(()=>a.className='aviso-j oculto',tipo==='mal'?2600:1300);}
function resumen(j){const r=$('#resumen');r.classList.remove('oculto');const tot=j.ok+j.mal;
 r.querySelector('.cont').innerHTML=`<div class="logos"><span class="idlogos"><img src="assets/logos/logo_uaslp_blanco.svg" alt="UASLP"><img src="assets/logos/logo_aa_blanco.svg" alt="Agenda Ambiental UASLP"></span></div><h2>¡Fin del juego!</h2><div class="gran">${j.puntos}<small>puntos</small></div>
 <div class="stats"><div><b>${j.ok}</b>correctos</div><div><b>${j.mal}</b>errores</div><div><b>${tot?Math.round(100*j.ok/tot):0}%</b>precisión</div><div><b>${j.mejor}</b>mejor racha</div><div><b>${j.nivel}</b>nivel alcanzado</div></div>
 ${j.errores.length?`<h4>Para repasar</h4><ul>${j.errores.slice(0,6).map(([n,c])=>`<li><span style="background:${c.color}"></span>${n} → <b>${c.titulo} ${c.sub}</b></li>`).join('')}</ul>`:'<p>¡Separación perfecta! 🌱</p>'}
 <button class="grande" onclick="UI.menu()">Jugar otra vez</button>`;}
window.UI={nivel:1,
 menu(){$('#resumen').classList.add('oculto');$('#menu').classList.remove('oculto');$('#juegoUI').classList.add('oculto');},
 iniciar(){if(!window.JUEGO){setTimeout(UI.iniciar,200);return;}$('#menu').classList.add('oculto');$('#juegoUI').classList.remove('oculto');JUEGO.nuevo(UI.nivel);},
 elegir(n){UI.nivel=n;document.querySelectorAll('#niveles button').forEach((b,i)=>b.classList.toggle('sel',i+1===n));}};
document.addEventListener('DOMContentLoaded',()=>{
 const bb=$('#botesUI');if(bb)PROSEREM.cats.forEach((c,i)=>{const b=document.createElement('button');b.style.background=c.color;b.innerHTML=`<small>${c.titulo}</small>${c.sub}`;b.onclick=()=>JUEGO.enviar(i);bb.appendChild(b);});
 const nv=$('#niveles');if(nv)['1 · Fácil','2','3 · Medio','4','5 · Difícil','6 · Experto'].forEach((t,i)=>{const b=document.createElement('button');b.textContent=t;b.onclick=()=>UI.elegir(i+1);nv.appendChild(b);});UI.elegir(1);
 const lc=$('#leyenda');if(lc)lc.innerHTML=PROSEREM.cats.map(c=>`<img src="${PANELES[c.id]}" alt="${c.titulo} ${c.sub}">`).join('');});
})();
