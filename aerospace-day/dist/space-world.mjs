import * as T from './vendor/three.module.min.js';
export function createSpaceView(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(48,1,.1,120);scene.add(new T.HemisphereLight(0xffffff,0x647582,2.5));const light=new T.DirectionalLight(0xfff3d8,2.5);light.position.set(3,6,5);scene.add(light);
 const mesh=(geo,color,x,y,z,parent=scene)=>{const o=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:.55}));o.position.set(x,y,z);parent.add(o);return o};
 const box=(w,h,d,c,x,y,z,p)=>mesh(new T.BoxGeometry(w,h,d),c,x,y,z,p);
 const lab=new T.Group();scene.add(lab);box(18,.2,12,0xcad7d7,0,-1,0,lab);box(18,7,.2,0xece9df,0,2,-5,lab);
 const person=new T.Group();scene.add(person);box(.75,1,.45,0xf4f0e7,0,.65,0,person);for(const x of [-.25,.25]){mesh(new T.CapsuleGeometry(.16,.55,4,12),0xf4f0e7,x,-.15,0,person);box(.32,.2,.5,0x52657b,x,-.58,.08,person)}
 const face=mesh(new T.SphereGeometry(.28,20,16),0xe3b98d,0,1.5,0,person);const helmet=mesh(new T.SphereGeometry(.4,24,20),0xf5f0e6,0,1.5,0,person);const visor=mesh(new T.SphereGeometry(.32,24,16),0x806434,0,1.52,.22,person);visor.scale.set(1,.75,.7);
 const hands=[];for(const x of [-.55,.55]){mesh(new T.CapsuleGeometry(.14,.45,4,12),0xf4f0e7,x,.75,0,person);hands.push(mesh(new T.SphereGeometry(.18,12,10),0xe3b98d,x,.36,.06,person))}
 const hose=mesh(new T.TorusGeometry(.3,.05,8,24,Math.PI*1.5),0xe0b754,.4,.5,.3,person);box(.3,.35,.08,0x5965ac,0,.85,.27,person);
 const craft=new T.Group();scene.add(craft);const hull=mesh(new T.CylinderGeometry(.6,.8,1.5,32),0xf4f0e7,0,.5,0,craft);mesh(new T.ConeGeometry(.6,.8,32),0xd1d9e0,0,1.65,0,craft);const solar=[];for(const x of [-1.5,1.5]){solar.push(box(1.4,.07,1.4,0x5965ac,x,.6,0,craft));box(1.2,.08,.08,0x9ba8bb,x,.66,0,craft)}
 const engines=[];for(const x of [-.45,.45])engines.push(mesh(new T.CylinderGeometry(.18,.27,.45,20),0x4c5d70,x,-.4,0,craft));
 const board=new T.Group();scene.add(board);box(3,1.8,.18,0xcbd5df,0,.75,0,board);const bolts=[];for(const [i,x] of [[0,-.8],[1,.8]]){const washer=mesh(new T.CylinderGeometry(.28,.28,.06,24),0xd8ae49,x,.85,.15,board);washer.rotation.x=Math.PI/2;const bolt=mesh(new T.CylinderGeometry(.19,.19,.18,6),0x54657a,x,.85,i===0?.32:.22,board);bolt.rotation.x=Math.PI/2;bolt.userData.bolt=i;bolts.push(bolt)}
 const looseBand=box(.13,.34,.1,0xdf8552,-1,.85,.3,board);
 const cockpit=new T.Group();scene.add(cockpit);for(const x of [-.8,.8]){const frame=box(.1,1.7,.16,0x8895a7,x,0,-1.8,cockpit);frame.rotation.z=x>0?-.18:.18}box(1.8,.1,.16,0x8895a7,0,.7,-1.8,cockpit);box(2,.24,.35,0x526277,0,-.64,-1.7,cockpit);for(const x of [-.4,.4])box(.38,.14,.05,0x76aaa7,x,-.5,-1.48,cockpit);const stick=mesh(new T.CylinderGeometry(.05,.07,.45,12),0x9aa6b4,.5,-.52,-1.5,cockpit);mesh(new T.SphereGeometry(.1,12,10),0xf2ba63,.5,-.3,-1.5,cockpit);
 for(const x of [-.5,.5])mesh(new T.SphereGeometry(.11,12,10),0xf4f0e7,x,-.48,-1.4,cockpit);mesh(new T.TorusGeometry(.05,.006,6,24),0xf1dc9b,0,0,-2,cockpit);
 const target=new T.Group();scene.add(target);for(const r of [1,1.3])mesh(new T.TorusGeometry(r,.08,10,48),0x83cbb9,0,0,0,target);box(.12,3,.12,0xb5c6d4,0,0,-.2,target);box(3,.12,.12,0xb5c6d4,0,0,-.2,target);
 const planet=mesh(new T.SphereGeometry(6,40,24),0x477bac,-14,-10,-35);const positions=[];for(let i=0;i<100;i++)positions.push(Math.sin(i*17.1)*45,Math.cos(i*9.7)*30,-15-(i%17)*3);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));const stars=new T.Points(g,new T.PointsMaterial({color:0xe8edf7,size:.12}));scene.add(stars);
 const ray=new T.Raycaster(),pointer=new T.Vector2();let state=null;
 function resize(){const b=canvas.getBoundingClientRect();renderer.setSize(b.width,b.height,false);camera.aspect=b.width/b.height;camera.updateProjectionMatrix()}
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
 function project(point){camera.updateMatrixWorld(true);const b=canvas.getBoundingClientRect(),p=point.clone().project(camera);return {x:(p.x*.5+.5)*b.width,y:(-.5*p.y+.5)*b.height}}
 return {
  draw(work){state=work;const flight=['flight','result'].includes(work.phase);scene.background=new T.Color(flight?0x14223b:0xdce5e6);lab.visible=!flight;person.visible=work.phase==='suit';craft.visible=work.phase==='design';board.visible=work.phase==='inspect';cockpit.visible=target.visible=planet.visible=stars.visible=flight;
   if(flight){camera.position.set(0,0,0);camera.lookAt(0,0,-1);const t=work.trial;target.position.set(-(t?.x||0),-(t?.y||0),-Math.max(1.6,t?.distance||12));stick.rotation.z=-(t?.vx||0)*.3;}else{camera.position.set(0,1.2,Math.max(4.5,3/camera.aspect));camera.lookAt(0,.7,0)}
   helmet.visible=visor.visible=work.gear.has('helmet');face.visible=!helmet.visible;hands.forEach(h=>h.material.color.set(work.gear.has('gloves')?0xf4f0e7:0xe3b98d));hose.visible=work.gear.has('hose');hull.scale.y=.8+work.config.mass*.15;solar.forEach(s=>s.scale.x=.7+work.config.mass*.15);engines.forEach(e=>e.scale.setScalar(.7+work.config.power*.2));looseBand.visible=!work.repaired;bolts[0].position.z=work.repaired?.22:.32;bolts[0].rotation.z=work.repaired?0:.3-work.turn*Math.PI/180;renderer.render(scene,camera);
  },
  gearPoint(id){return project(new T.Vector3(...({helmet:[0,1.5,.3],gloves:[.55,.36,.1],hose:[.4,.5,.35]}[id])))},
  boltPoint(id){board.updateWorldMatrix(true,true);return project(bolts[id].getWorldPosition(new T.Vector3()))},
  hitBolt(e){const b=canvas.getBoundingClientRect();pointer.set((e.clientX-b.left)/b.width*2-1,1-(e.clientY-b.top)/b.height*2);camera.updateMatrixWorld(true);board.updateWorldMatrix(true,true);ray.setFromCamera(pointer,camera);return ray.intersectObjects(bolts)[0]?.object.userData.bolt??null},
  dispose(){observer.disconnect();renderer.dispose();scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose()})}
 };
}
