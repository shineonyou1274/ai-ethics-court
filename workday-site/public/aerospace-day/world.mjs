import {person as makePerson} from './person.mjs';
import {reducedMotion} from './motion.mjs';
import {findPath} from './navigation.mjs';
import * as T from './vendor/three.module.min.js';
export const STATIONS=[{id:'drawing',name:'도면 책상',x:-3.4,z:-2.5,ax:-1.65,az:-2.5},{id:'assembly',name:'조립대',x:3.4,z:-2.5,ax:1.65,az:-2.5},{id:'sensor',name:'센서 작업대',x:-3.4,z:1,ax:-1.65,az:1},{id:'cockpit',name:'조종석',x:3.4,z:1,ax:1.65,az:1},{id:'meeting',name:'회의실 · 관제 창',x:0,z:4,ax:0,az:2.7}];
export const blocked=(x,z)=>Math.abs(x)>5.25||z< -4.5||z>5||STATIONS.some(s=>Math.abs(x-s.x)<1.4&&Math.abs(z-s.z)<.95);
export function createWorld(canvas,{flat=false,position={x:0,z:2.4},onArrive=()=>{},onMove=()=>{},onPins=()=>{}}={}){
 let renderer=null,ctx=null;if(flat)ctx=canvas.getContext('2d');else{renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;}
 const scene=new T.Scene();scene.background=new T.Color('#dbe6ec');const camera=new T.OrthographicCamera(-8,8,8,-8,.1,70);camera.position.set(0,15,12);camera.lookAt(0,0,.2);scene.add(new T.HemisphereLight(0xfff9eb,0x8caaa6,2.5));const light=new T.DirectionalLight(0xfff0d9,3);light.position.set(-3,8,4);light.castShadow=true;light.shadow.normalBias=.035;scene.add(light);
 const box=(w,h,d,c,x,y,z,parent=scene)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color:c,roughness:.8}));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m};
 const sphere=(r,c,x,y,z,p)=>{const m=new T.Mesh(new T.SphereGeometry(r,16,12),new T.MeshStandardMaterial({color:c}));m.position.set(x,y,z);p.add(m);return m};
 box(11,.15,10.5,0xcbd9d7,0,-.1,.2);box(11,2.8,.12,0xf6f0e4,0,1.4,-4.9);
 // Control-room window stays part of the same building throughout the day.
 box(3.3,1.6,.16,0x577281,0,1.8,-4.78);box(3,1.35,.04,0xb9d6dd,0,1.8,-4.67);box(.07,1.35,.07,0x577281,0,1.8,-4.61);
 const props=new Map();for(const s of STATIONS){const g=new T.Group();g.position.set(s.x,0,s.z);scene.add(g);props.set(s.id,g);box(2.25,.12,1.15,0xe6d7b7,0,.9,0,g);for(const x of [-.9,.9])box(.1,.9,.8,0x718995,x,.43,0,g);
  if(s.id==='drawing'){box(1.3,.015,.8,0xe6f0f3,-.25,.98,0,g);for(const x of [-.6,-.25,.1])box(.018,.008,.65,0x839ea9,x,.993,0,g);box(.45,.3,.14,0x5965ac,.72,1.1,-.2,g)}
  if(s.id==='assembly'){box(1.2,.28,.7,0xa3b5c5,0,1.1,0,g);for(const x of [-.4,.4])box(.12,.05,.12,0xe5b45b,x,1.27,0,g)}
  if(s.id==='sensor'){for(const x of [-.6,0,.6]){box(.35,.22,.32,0x5965ac,x,1.07,0,g);sphere(.045,0x79baa1,x,1.2,.17,g)}}
  if(s.id==='cockpit'){box(1.3,.65,.12,0x3d536d,0,1.35,-.35,g);box(1.1,.45,.03,0x8ab9c2,0,1.35,-.27,g);box(.08,.3,.08,0x44546d,.5,1.05,.3,g);sphere(.12,0x5965ac,.5,1.23,.3,g)}
  if(s.id==='meeting'){box(1.3,.02,.55,0xfaf1db,0,.98,0,g);box(.6,.45,.08,0x3d536d,.65,1.25,-.25,g)}
  g.traverse(o=>o.userData.station=s.id);
 }
 const avatar=makePerson({coat:'#b7ccdc',hair:1,seed:1}),actor=avatar.root;scene.add(actor);actor.position.set(position.x,0,position.z);
 const ring=new T.Mesh(new T.RingGeometry(.3,.36,32),new T.MeshBasicMaterial({color:0xe8b85b,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.015;scene.add(ring);ring.visible=false;
 let route=[],destination=null,task=null,paused=false,raf=0,last=performance.now(),width=1,height=1,phase=0,needsDraw=true;
 const screen=(x,y,z)=>{if(flat)return {x:width/2+x*width/12,y:height*.48+z*height/11};const p=new T.Vector3(x,y,z).project(camera);return{x:(p.x*.5+.5)*width,y:(-p.y*.5+.5)*height}};
 const resize=()=>{const b=canvas.getBoundingClientRect();width=b.width||1;height=b.height||1;if(renderer)renderer.setSize(width,height,false);else{canvas.width=width*devicePixelRatio;canvas.height=height*devicePixelRatio}const a=width/height,half=Math.max(4.9,5.65/a);camera.left=-half*a;camera.right=half*a;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();camera.updateMatrixWorld();needsDraw=true;pins()};
 function pins(){
  const bounds=points=>{const p=points.map(v=>screen(...v)),x=Math.min(...p.map(v=>v.x)),y=Math.min(...p.map(v=>v.y));return{x:x-5,y:y-5,w:Math.max(...p.map(v=>v.x))-x+10,h:Math.max(...p.map(v=>v.y))-y+10}};
  const obstacles=STATIONS.map(s=>bounds([[-1.13,-.58],[-1.13,.58],[1.13,-.58],[1.13,.58]].map(([x,z])=>[s.x+x,1,s.z+z])));
  const a=actor.position;obstacles.push(bounds([[a.x-.36,0,a.z],[a.x+.36,2.15,a.z]]));
  onPins(STATIONS.map(s=>({...s,...screen(s.x,1.4,s.z)})),obstacles)
 }
 function go(id){const s=STATIONS.find(x=>x.id===id);if(!s)return;route=findPath(actor.position,{x:s.ax,z:s.az},blocked);if(!route.length)return;destination=id;ring.position.set(s.ax,.015,s.az);ring.visible=true;onMove(s.name)}
 const ray=new T.Raycaster(),pointer=new T.Vector2();let down=null;
 const press=e=>{down={x:e.clientX,y:e.clientY}};
 const release=e=>{if(paused||!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>15){down=null;return}down=null;const b=canvas.getBoundingClientRect();if(flat){const x=(e.clientX-b.left-width/2)*12/width,z=(e.clientY-b.top-height*.48)*11/height;const s=STATIONS.find(s=>Math.abs(s.x-x)<1.4&&Math.abs(s.z-z)<1);if(s){go(s.id);return}walk(x,z)}else{pointer.set((e.clientX-b.left)/width*2-1,1-(e.clientY-b.top)/height*2);ray.setFromCamera(pointer,camera);const hits=ray.intersectObjects([...props.values()],true);if(hits.length){go(hits[0].object.userData.station);return}const p=ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),new T.Vector3());if(p)walk(p.x,p.z)}};
 function walk(x,z){if(blocked(x,z))return;route=findPath(actor.position,{x,z},blocked);destination=null;ring.position.set(x,.015,z);ring.visible=!!route.length;if(route.length)onMove('시험동 바닥')}
 canvas.addEventListener('pointerdown',press);canvas.addEventListener('pointerup',release);
 function drawFlat(){ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);ctx.fillStyle='#dbe6ec';ctx.fillRect(0,0,width,height);ctx.fillStyle='#f7f2e9';ctx.fillRect(width*.025,height*.03,width*.95,height*.94);for(const s of STATIONS){const p=screen(s.x,0,s.z);ctx.fillStyle=s.id===task?'#bbc3e0':'#c5d3cc';ctx.fillRect(p.x-width*.1,p.y-height*.05,width*.2,height*.1)}const p=screen(actor.position.x,0,actor.position.z);ctx.fillStyle='#5965ac';ctx.beginPath();ctx.arc(p.x,p.y,10,0,Math.PI*2);ctx.fill();ctx.fillStyle='#263c52';ctx.font='14px sans-serif';ctx.textAlign='center';ctx.fillText('나',p.x,p.y+27)}
 function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(!paused){phase+=dt;if(route.length){needsDraw=true;const p=route[0],dx=p.x-actor.position.x,dz=p.z-actor.position.z,d=Math.hypot(dx,dz);if(d<.035){route.shift();if(!route.length){ring.visible=false;avatar.update(phase,false);const id=destination;destination=null;onArrive(id)}}else{const step=Math.min(d,dt*2.8);actor.position.x+=dx/d*step;actor.position.z+=dz/d*step;actor.rotation.y=Math.atan2(dx,dz);avatar.update(phase,true)}}if(needsDraw){if(now-(loop.pinTime||0)>100||!route.length){pins();loop.pinTime=now}if(renderer)renderer.render(scene,camera);else drawFlat();needsDraw=false;}}raf=requestAnimationFrame(loop)}
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();raf=requestAnimationFrame(loop);
 return{go,setTask(id){task=id;needsDraw=true;pins()},getPosition(){return{x:actor.position.x,z:actor.position.z}},pause(v){paused=v;needsDraw=true;last=performance.now()},dispose(){cancelAnimationFrame(raf);observer.disconnect();canvas.removeEventListener('pointerdown',press);canvas.removeEventListener('pointerup',release);renderer?.dispose();scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose()})}};
}
