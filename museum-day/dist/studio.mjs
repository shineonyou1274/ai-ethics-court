import * as T from './vendor/three.module.min.js';
import {SVGRenderer} from './vendor/SVGRenderer.js';
import {rooms} from './day.mjs';
export const clay=0xb26842,cream=0xf5cf92,teal=0x27665e,green=0x4bb687;
export function group(parent,x=0,y=0,z=0){
 const g=new T.Group(); parent.add(g);g.position.set(x,y,z);return g;
}
export function solid(parent,geo,color,x=0,y=0,z=0){
 const m=new T.Mesh(geo,new T.MeshLambertMaterial({color,side:T.DoubleSide}));parent.add(m);m.position.set(x,y,z);return m;
}
export const box=(p,w,h,d,c,x=0,y=0,z=0)=>solid(p,new T.BoxGeometry(w,h,d),c,x,y,z);
export function oval(p,w,h,d,c,x=0,y=0,z=0){
 const m=solid(p,new T.SphereGeometry(1,16,10),c,x,y,z);m.scale.set(w,h,d);return m;
}
export function ring(p,r,t,c,x,y,z){
 return solid(p,new T.TorusGeometry(r,t,8,40),c,x,y,z);
}
export function vessel(p,x,y,z,s=1){
 const g=group(p,x,y,z);g.scale.setScalar(s);
 const profile=[[0,-.9],[.52,-.85],[.78,-.59],[.97,-.10],[.94,.24],[.75,.55],[.49,.63],[.49,.78],[.58,.83],[.56,.91],[.43,.89],[.41,.72],[.67,.47],[.82,.13],[.77,-.35],[.4,-.68],[0,-.7]];
 solid(g,new T.LatheGeometry(profile.map(a=>new T.Vector2(...a)),48),clay);
 for(const [height,r] of [[.25,.94],[-.16,.96]])ring(g,r,.024,cream,0,height,0).rotation.x=Math.PI/2;
 for(let i=0;i<30;i++){
 const a=i*Math.PI/15, m=box(g,.038,.26,.045,cream,.974*Math.sin(a),.045,.974*Math.cos(a));m.rotation.order='YXZ';m.rotation.y=a;m.rotateZ(-.48);
 }
 const h=ring(g,.30,.085,clay,.91,.22,0);h.name='handle';
 return g;
}
function person(p,x,y,z,color,hair){
 const g=group(p,x,y,z);
 box(g,.23,.41,.24,0x3d4d50,-.14,.22);box(g,.23,.41,.24,0x3d4d50,.14,.22);
 oval(g,.36,.41,.24,color,0,.72);oval(g,.22,.25,.22,0xe9b896,0,1.27);
 oval(g,.23,.14,.23,hair,0,1.44);for(const side of [-1,1])oval(g,.095,.27,.10,color,side*.34,.75);
 return g;
}
export class Studio{
 constructor(host){
 this.host=host;this.scene=new T.Scene();this.camera=new T.OrthographicCamera(-5,5,3,-3,.1,90);this.camera.position.z=24;
 this.scene.background=new T.Color(0xded6bc);this.scene.add(new T.HemisphereLight(0xfffae8,0xa59b88,2.0));
 const key=new T.DirectionalLight(0xffead1,2.1);key.position.set(-4,8,9);this.scene.add(key);
 try{if(new URLSearchParams(location.search).get('view')==='flat')throw Error('flat');this.renderer=new T.WebGLRenderer({antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.65))}
 catch{this.renderer=new SVGRenderer();this.flat=true;this.renderer.setClearColor(0xded6bc)}
 this.surface=this.renderer.domElement;host.append(this.surface);this.root=group(this.scene);
 this.motion=matchMedia('(prefers-reduced-motion: reduce)');this.ray=new T.Raycaster();
 this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);this.resize();
 }
 resize(){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;
 const half=Math.max(2.85,5*h/w);this.camera.top=half;this.camera.bottom=-half;this.camera.left=-half*w/h;this.camera.right=-this.camera.left;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h);this.draw()}
 draw(){this.renderer.render(this.scene,this.camera);this.labels?.()}
 reset(){cancelAnimationFrame(this.frame);this.labels=null;this.host.querySelectorAll('.pin').forEach(n=>n.remove());this.root.traverse(n=>{n.geometry?.dispose();n.material?.dispose()});this.root.clear();this.root.rotation.set(0,0,0);this.root.position.set(0,0,0)}
 point(e){const r=this.surface.getBoundingClientRect();return new T.Vector2(((e.clientX-r.left)/r.width-.5)*(this.camera.right*2),(.5-(e.clientY-r.top)/r.height)*this.camera.top*2)}
 hit(pt,list){this.scene.updateMatrixWorld(true);this.ray.setFromCamera({x:pt.x/this.camera.right,y:pt.y/this.camera.top},this.camera);return this.ray.intersectObjects(list,true)[0]?.object}
 floor(at,goal,visit,arrive){
 this.reset();const g=this.root;g.rotation.x=.53;g.rotation.y=-.07;
 const spots=rooms.map((_,i)=>[(i%3-1)*3.05,Math.floor(i/3)*3.7-1.85]);
 box(g,9.3,.13,8,0xd0ab84,0,-.14,0);
 const colors=[0xe5c999,0xb0c2a8,0xa5bec0,0xd4b78d,0xc7b7a8,0xabbcb0];
 const pins=[];
 spots.forEach(([x,z],i)=>{
 const r=group(g,x,0,z);box(r,2.93,.09,3.13,colors[i]);box(r,2.93,.85,.12,colors[i],0,.45,-1.49);
 const table=(dx,dz,c=0x996947)=>{box(r,1.65,.15,.61,c,dx,.64,dz);for(const k of [-.65,.65])box(r,.12,.62,.5,c,dx+k,.3,dz)};
 if(i===0){table(0,-.55);box(r,.64,.42,.08,0x385056,-.2,.91,-.55);box(r,.55,.05,.35,cream,.55,.75,-.5)}
 if(i===1){for(const y of [.3,.95]){box(r,2.1,.11,.68,0x886e58,0,y,-.9);for(const a of [-.65,0,.65])box(r,.48,.36,.49,0xc79564,a,y+.24,-.9)}}
 if(i===2){table(0,-.6);vessel(r,.36,.97,-.65,.27);box(r,.16,.57,.2,teal,-.52,1,-.65);oval(r,.17,.12,.22,0x435658,-.46,1.24,-.55)}
 if(i===3){box(r,1.74,.62,.9,teal,0,.31,-.45);vessel(r,0,1.07,-.46,.48);for(const x of [-.83,.83])box(r,.038,.93,.04,0x82a6a4,x,1.08,-.02);box(r,1.74,.05,.93,0xbfc8b7,0,1.57,-.46)}
 if(i===4){table(0,-.65);for(const a of [-.58,.53])box(r,.44,.37,.42,teal,a,.19,.01);box(r,1.38,.69,.08,0x416558,0,1.1,-1.35)}
 if(i===5){box(r,1.8,.48,.65,teal,-.1,.26,-.65);box(r,1.8,.52,.17,teal,-.1,.61,-.93);oval(r,.28,.45,.23,0x63875b,1.13,.65,-.55)}
 const n=document.createElement('button');n.className='pin'+(goal===i?' goal':'');n.textContent=rooms[i];n.onclick=()=>walk(i);if(!visit){n.tabIndex=-1;n.style.pointerEvents='none'}this.host.append(n);pins.push(n);
 });
 const avatar=person(g,0,.05,0,0xa33f28,0x493128);const crowd=[person(g,-3.98,.05,1.87,0x658caa,0x42424b),person(g,.90,.05,-1.66,0xf4e7c5,0x48392d),person(g,.94,.05,2.3,0x9b7662,0x553a27)];
 const donorRoom=goal===3?3:0;const [donorX,donorZ]=spots[donorRoom];
 const donor=person(g,donorX+.78,.05,donorZ+.56,0xb97579,0x493d37);oval(donor,.12,.13,.12,0x493d37,.17,1.43,-.14);
 const coord=i=>[spots[i][0]-.53,spots[i][1]+.82];
 const [sx,sz]=coord(at);avatar.position.set(sx,.05,sz);
 this.labels=()=>pins.forEach((n,i)=>{const [x,z]=spots[i],pt=g.localToWorld(new T.Vector3(x,.05,z+1.42)).project(this.camera);n.style.left=((pt.x+1)*50)+'%';n.style.top=((1-pt.y)*50)+'%'});
 let segment=null;const walk=i=>{if(!visit)return;const [x,z]=coord(i);segment={i,x,z,sx:avatar.position.x,sz:avatar.position.z,start:performance.now()};if(this.motion.matches){avatar.position.set(x,.05,z);segment=null;this.draw();arrive(i)}};
 this.walk=walk;
 const frame=t=>{if(segment){const s=segment,f=Math.min(1,(t-s.start)/650);avatar.position.set(s.sx+(s.x-s.sx)*f,.05+.04*Math.abs(Math.sin(f*12)),s.sz+(s.z-s.sz)*f);if(f===1){segment=null;arrive(s.i);if(this.root.children[0]!==floorMesh)return}}
 if(!this.flat&&!this.motion.matches){crowd[0].position.z=1.9+Math.sin(t/2350)*.3;crowd[2].rotation.y=.45*Math.sin(t/3200)}
 if(segment||(!this.flat&&!this.motion.matches)||!this.floorDrawn){this.draw();this.floorDrawn=true}
 this.frame=requestAnimationFrame(frame)};
 const floorMesh=g.children[0];this.draw();this.frame=requestAnimationFrame(frame);
 }
}
