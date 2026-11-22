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
export function tvCamera(p,x,y,z,scale=1){
 const rig=group(p,x,y,z);rig.scale.setScalar(scale);
 for(let i=0;i<3;i++){const a=i*2*Math.PI/3;const leg=group(rig,0,0,0);leg.rotation.y=a;
 box(leg,.095,1.2,.095,0x8396a1,0,.52,.28).rotation.x=-.44;oval(leg,.12,.055,.12,0x253442,0,.02,.53)}
 box(rig,1.12,.62,.71,0x314459,0,1.4,0);
 const lens=solid(rig,new T.CylinderGeometry(.27,.34,.49,28),0x1c2d39,0,1.4,.51);lens.rotation.x=Math.PI/2;
 oval(rig,.23,.23,.065,0x5799b4,0,1.4,.77);box(rig,.51,.08,.18,0xc6d5d5,0,1.95,0);
 for(const dx of [-.21,.21])box(rig,.07,.22,.15,0x586778,dx,1.82,0);
 box(rig,.12,.12,.76,0xaab9b8,.42,1.05,-.34);return rig;
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
 this.host=host;this.scene=new T.Scene();this.camera=new T.OrthographicCamera(-5,5,3,-3,.1,90);this.camera.position.z=24;this.mapCamera=this.camera;
 this.benchCamera=new T.PerspectiveCamera(34,1,.1,90);
 this.ndc=new T.Vector2();this.plane=new T.Plane(new T.Vector3(0,0,1),0);
 this.scene.background=new T.Color(0xc5d1cd);this.scene.add(new T.HemisphereLight(0xfffae8,0xa59b88,2.0));
 const key=new T.DirectionalLight(0xffead1,2.1);key.position.set(-4,8,9);this.scene.add(key);
 try{if(new URLSearchParams(location.search).get('view')==='flat')throw Error('flat');this.renderer=new T.WebGLRenderer({antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.65))}
 catch{this.renderer=new SVGRenderer();this.flat=true;this.renderer.setClearColor(0xc5d1cd)}
 this.surface=this.renderer.domElement;host.append(this.surface);this.root=group(this.scene);
 this.motion=matchMedia('(prefers-reduced-motion: reduce)');this.ray=new T.Raycaster();
 this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);this.resize();
 }
 resize(){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;
 if(this.camera.isPerspectiveCamera){
 const cam=this.camera;cam.aspect=w/h;const distance=Math.max(3.05,4.98/cam.aspect)/Math.tan(cam.fov*Math.PI/360);
 cam.position.set(.045,.30,1).normalize().multiplyScalar(distance);cam.lookAt(0,0,0);cam.updateMatrixWorld();
 }else{const half=Math.max(2.85,5*h/w);this.camera.top=half;this.camera.bottom=-half;this.camera.left=-half*w/h;this.camera.right=-this.camera.left}this.camera.updateProjectionMatrix();this.renderer.setSize(w,h);this.draw()}
 draw(){this.renderer.render(this.scene,this.camera);this.labels?.()}
 reset(){cancelAnimationFrame(this.frame);this.labels=null;this.camera=this.mapCamera;this.host.querySelectorAll('.pin,.object-tag').forEach(n=>n.remove());this.root.traverse(n=>{n.geometry?.dispose();n.material?.dispose()});this.root.clear();this.root.rotation.set(0,0,0);this.root.position.set(0,0,0)}
 bench(){this.camera=this.benchCamera;this.resize()}
 tag(name,x,y,z=0){const n=document.createElement('span');n.className='object-tag';n.textContent=name;this.host.append(n);
 const prev=this.labels;const pos=new T.Vector3(x,y,z);this.labels=()=>{prev?.();const p=pos.clone().project(this.camera);n.style.left=(50+50*p.x)+'%';n.style.top=(50-50*p.y)+'%'};return n}
 point(e){const r=this.surface.getBoundingClientRect();this.ndc.set(2*(e.clientX-r.left)/r.width-1,1-2*(e.clientY-r.top)/r.height);
 this.ray.setFromCamera(this.ndc,this.camera);const v=this.ray.ray.intersectPlane(this.plane,new T.Vector3());return new T.Vector2(v.x,v.y)}
 hit(pt,list){this.scene.updateMatrixWorld(true);return this.ray.intersectObjects(list,true)[0]?.object}
 planePoint(world){const p=world.clone().project(this.camera);const ray=new T.Raycaster();ray.setFromCamera(p,this.camera);return ray.ray.intersectPlane(this.plane,new T.Vector3())}
 floor(at,goal,visit,arrive,alarm=false){
 this.reset();this.resize();const g=this.root;g.rotation.x=.53;g.rotation.y=-.07;
 const spots=rooms.map((_,i)=>[(i%3-1)*3.05,Math.floor(i/3)*3.7-1.85]);
 box(g,10.5,.13,8,0xd0ab84,0,-.14,0);
 const colors=[0x98b4b9,0xd2b3a7,0x8fa7b7,0x8faaa8,0xaca2b0,0xc2c5aa];
 const pins=[];
 spots.forEach(([x,z],i)=>{
 const r=group(g,x,0,z);box(r,2.93,.09,3.13,colors[i]);box(r,2.93,.85,.12,colors[i],0,.45,-1.49);
 const table=(dx,dz,c=0x996947)=>{box(r,1.65,.15,.61,c,dx,.64,dz);for(const k of [-.65,.65])box(r,.12,.62,.5,c,dx+k,.3,dz)};
 if(i===0){table(0,-.55);box(r,1.8,.73,.10,0x57899a,0,1.04,-1.34);for(let j=0;j<3;j++)box(r,.35,.04,.32,cream,(j-1)*.44,.75,-.51)}
 if(i===1){table(0,-.62);box(r,1.35,.72,.12,0xa7caca,0,1.12,-1.16);for(const x of [-.78,.78])for(let j=0;j<3;j++)oval(r,.06,.06,.06,cream,x,.91+j*.2,-1.05)}
 if(i===2){box(r,2.74,1.48,.10,0x396c83,0,.82,-1.30);table(.05,-.67);for(let j=0;j<3;j++)tvCamera(r,-.96+j*.83,.08,.12,.41);for(const x of [-1.12,1.12]){box(r,.06,1.9,.06,0x334456,x,1,-1);box(r,.46,.27,.24,cream,x,1.91,-.86)}}
 if(i===3){table(0,-.45);for(let j=0;j<6;j++)box(r,.60,.37,.14,[0x5192af,0xa9755e,0x659e99][j%3],(j%3-1)*.68,1.1+Math.floor(j/3)*.43,-1.22);for(let j=0;j<8;j++)box(r,.1,.04,.11,j%3===0?cream:teal,(j-3.5)*.18,.75,-.41)}
 if(i===4){table(0,-.55);box(r,1.32,.74,.14,0x283f50,0,1.13,-.8);for(let j=0;j<4;j++)box(r,.29,.09,.02,[cream,teal,clay,cream][j],(j-1.5)*.27,1.09,-.70)}
 if(i===5){box(r,1.9,.48,.68,teal,-.18,.28,-.62);box(r,1.9,.55,.18,teal,-.18,.68,-.91);oval(r,.27,.43,.24,0x618b72,1.05,.68,-.64)}
 const n=document.createElement('button');n.className='pin'+(goal===i?' goal':'');n.textContent=rooms[i];n.onclick=()=>walk(i);if(!visit){n.tabIndex=-1;n.style.pointerEvents='none'}this.host.append(n);pins.push(n);
 });
 const avatar=person(g,0,.05,0,0x148b9c,0x493128);const crowd=[person(g,-3.98,.05,1.87,0x658caa,0x42424b),person(g,.90,.05,-1.66,0xf4e7c5,0x48392d),person(g,.94,.05,2.3,0x9b7662,0x553a27)];
 ring(avatar,.48,.075,0xf9c94e,0,.08,0).rotation.x=Math.PI/2;box(avatar,.17,.20,.055,0xffeabb,.12,.82,.23);
 const crew=[person(g,2.15,.04,-1.2,0x435e75,0x38373c),person(g,-2.1,.04,-2.1,0xd0935f,0x493828)];
 crew[0].rotation.y=-.5;crew[0].children.at(-1).rotation.x=-.92;
 const guest=person(g,3.46,.04,-2.67,0xc47e71,0x4b3535);guest.rotation.y=-.3;
 const coord=i=>[spots[i][0]-.53,spots[i][1]+.82];
 const [sx,sz]=coord(at);avatar.position.set(sx,.05,sz);
 const tag=document.createElement('span');tag.className='object-tag name-tag';tag.textContent='나';this.host.append(tag);
 this.labels=()=>{const pos=avatar.localToWorld(new T.Vector3(-.42,.72,.29)).project(this.camera);tag.style.left=(50+50*pos.x)+'%';tag.style.top=(50-50*pos.y)+'%';pins.forEach((n,i)=>{const [x,z]=spots[i],pt=g.localToWorld(new T.Vector3(x,1.18,z-.82)).project(this.camera);n.style.left=((pt.x+1)*50)+'%';n.style.top=((1-pt.y)*50)+'%'});};
 let segment=null;
 const walk=i=>{if(!visit||segment)return;const [x,z]=coord(i),sx=avatar.position.x,sz=avatar.position.z;
 const aisle=sx+x>0?4.96:-4.96;
 const points=Math.abs(z-sz)<.1?[[sx,sz],[x,z]]:[[sx,sz],[aisle,sz],[aisle,z],[x,z]];
 segment={i,points,start:performance.now()};
 if(this.motion.matches){avatar.position.set(x,.05,z);segment=null;this.draw();arrive(i)}};
 this.walk=walk;
 const frame=t=>{if(segment){const s=segment,f=Math.min(1,(t-s.start)/(400*s.points.length)),u=f*(s.points.length-1),k=Math.min(Math.floor(u),s.points.length-2),a=s.points[k],b=s.points[k+1];avatar.position.set(a[0]+(b[0]-a[0])*(u-k),.05+.04*Math.abs(Math.sin(f*12)),a[1]+(b[1]-a[1])*(u-k));if(f===1){segment=null;arrive(s.i);if(this.root.children[0]!==floorMesh)return}}
 if(!this.flat&&!this.motion.matches){crowd[0].position.z=1.9+Math.sin(t/2350)*.3;crowd[2].rotation.y=.45*Math.sin(t/3200)}
 if(segment||(!this.flat&&!this.motion.matches)||!this.floorDrawn){this.draw();this.floorDrawn=true}
 this.frame=requestAnimationFrame(frame)};
 const floorMesh=g.children[0];this.draw();this.frame=requestAnimationFrame(frame);
 }
}
