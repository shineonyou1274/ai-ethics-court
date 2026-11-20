import {person as makePerson} from './person.mjs';
import * as T from './vendor/three.module.min.js';
export function createSpaceView(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(48,1,.1,120);scene.add(new T.HemisphereLight(0xffffff,0x647582,2.5));const light=new T.DirectionalLight(0xfff3d8,2.5);light.position.set(3,6,5);scene.add(light);
 const mesh=(geo,color,x,y,z,parent=scene)=>{const o=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:.55}));o.position.set(x,y,z);parent.add(o);return o};
 const box=(w,h,d,c,x,y,z,p)=>mesh(new T.BoxGeometry(w,h,d),c,x,y,z,p);
 const lab=new T.Group();scene.add(lab);box(18,.2,12,0xcad7d7,0,-1,0,lab);box(18,7,.2,0xece9df,0,2,-5,lab);
 const avatar=makePerson({coat:'#eee4d6',hair:1,seed:1}),person=avatar.root;scene.add(person);person.position.y=-.55;const workwear=mesh(new T.CapsuleGeometry(.3,.4,5,12),0xb7ccdc,0,1.14,0,person);workwear.scale.z=.68;const badge=box(.12,.18,.025,0xfffdf5,.18,1.24,.25,person);const wrist=mesh(new T.TorusGeometry(.09,.025,8,24),0x63a68d,.36,.93,.015,person);wrist.rotation.x=Math.PI/2;
 const craft=new T.Group();scene.add(craft);const hull=mesh(new T.CylinderGeometry(.6,.8,1.5,32),0xf4f0e7,0,.5,0,craft);mesh(new T.ConeGeometry(.6,.8,32),0xd1d9e0,0,1.65,0,craft);const solar=[];for(const x of [-1.5,1.5]){solar.push(box(1.4,.07,1.4,0x5965ac,x,.6,0,craft));box(1.2,.08,.08,0x9ba8bb,x,.66,0,craft)}
 const engines=[];for(const x of [-.45,.45])engines.push(mesh(new T.CylinderGeometry(.18,.27,.45,20),0x4c5d70,x,-.4,0,craft));
 const board=new T.Group();scene.add(board);mesh(new T.TorusGeometry(1.08,.15,12,48),0xa3b5c5,0,.75,0,board);const bolts=[],looseBands=[];for(let i=0;i<6;i++){const a=i*Math.PI/3,x=Math.sin(a)*1.08,y=.75+Math.cos(a)*1.08;const washer=mesh(new T.CylinderGeometry(.23,.23,.06,24),0xd8ae49,x,y,.15,board);washer.rotation.x=Math.PI/2;const bolt=mesh(new T.CylinderGeometry(.16,.16,.18,6),0x54657a,x,y,.32,board);bolt.rotation.x=Math.PI/2;bolt.userData.bolt=i;bolts.push(bolt);looseBands.push(box(.19,.3,.13,0xdf8552,x-.18,y,.3,board))}
 const cockpit=new T.Group();scene.add(cockpit);for(const x of [-.8,.8]){const frame=box(.1,1.7,.16,0x8895a7,x,0,-1.8,cockpit);frame.rotation.z=x>0?-.18:.18}box(1.8,.1,.16,0x8895a7,0,.7,-1.8,cockpit);box(2,.24,.35,0x526277,0,-.64,-1.7,cockpit);for(const x of [-.4,.4])box(.38,.14,.05,0x76aaa7,x,-.5,-1.48,cockpit);const stick=mesh(new T.CylinderGeometry(.05,.07,.45,12),0x9aa6b4,.5,-.52,-1.5,cockpit);mesh(new T.SphereGeometry(.1,12,10),0xf2ba63,.5,-.3,-1.5,cockpit);
 for(const x of [-.5,.5])mesh(new T.SphereGeometry(.11,12,10),0xf4f0e7,x,-.48,-1.4,cockpit);mesh(new T.TorusGeometry(.05,.006,6,24),0xf1dc9b,0,0,-2,cockpit);
 const target=new T.Group();scene.add(target);for(const r of [1,1.3])mesh(new T.TorusGeometry(r,.08,10,48),0x83cbb9,0,0,0,target);box(.12,3,.12,0xb5c6d4,0,0,-.2,target);box(3,.12,.12,0xb5c6d4,0,0,-.2,target);
 const planet=mesh(new T.SphereGeometry(6,40,24),0x477bac,-14,-10,-35);const positions=[];for(let i=0;i<100;i++)positions.push(Math.sin(i*17.1)*45,Math.cos(i*9.7)*30,-15-(i%17)*3);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));const stars=new T.Points(g,new T.PointsMaterial({color:0xe8edf7,size:.12}));scene.add(stars);
 const ray=new T.Raycaster(),pointer=new T.Vector2();let state=null;
 function resize(){const b=canvas.getBoundingClientRect();renderer.setSize(b.width,b.height,false);camera.aspect=b.width/b.height;camera.updateProjectionMatrix()}
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
 function project(point){camera.updateMatrixWorld(true);const b=canvas.getBoundingClientRect(),p=point.clone().project(camera);return {x:(p.x*.5+.5)*b.width,y:(-.5*p.y+.5)*b.height}}
 return {
  resize,
  draw(work){state=work;const flight=['flight','result'].includes(work.phase);scene.background=new T.Color(flight?0x14223b:0xdce5e6);lab.visible=!flight;person.visible=work.phase==='suit';craft.visible=work.phase==='design';board.visible=work.phase==='inspect';cockpit.visible=target.visible=planet.visible=stars.visible=flight;
   if(flight){camera.position.set(0,0,0);camera.lookAt(0,0,-1);const t=work.trial;target.position.set(-(t?.x||0),-(t?.y||0),-Math.max(1.6,t?.distance||12));stick.rotation.z=-(t?.vx||0)*.3;}else{camera.position.set(0,1.2,Math.max(4.5,3/camera.aspect));camera.lookAt(0,.7,0)}
   workwear.visible=work.gear.has('workwear');badge.visible=work.gear.has('badge');wrist.visible=work.gear.has('wrist');hull.scale.y=.8+work.config.mass*.15;solar.forEach(s=>s.scale.x=.7+work.config.mass*.15);engines.forEach(e=>e.scale.setScalar(.7+work.config.power*.2));bolts.forEach((b,i)=>{const done=work.turns[i]>=180;looseBands[i].visible=!done;b.position.z=done?.22:.32;b.rotation.z=.3-work.turns[i]*Math.PI/180;b.material.color.set(done?0x3f806b:0x54657a)});renderer.render(scene,camera);
  },
  gearPoint(id){return project(new T.Vector3(...({workwear:[-.15,.59,.25],badge:[.18,.69,.28],wrist:[.36,.38,.08]}[id])))},
  boltPoint(id){board.updateWorldMatrix(true,true);return project(bolts[id].getWorldPosition(new T.Vector3()))},
  hitBolt(e){const b=canvas.getBoundingClientRect();pointer.set((e.clientX-b.left)/b.width*2-1,1-(e.clientY-b.top)/b.height*2);camera.updateMatrixWorld(true);board.updateWorldMatrix(true,true);ray.setFromCamera(pointer,camera);return ray.intersectObjects(bolts)[0]?.object.userData.bolt??null},
  dispose(){observer.disconnect();renderer.dispose();scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose()})}
 };
}
