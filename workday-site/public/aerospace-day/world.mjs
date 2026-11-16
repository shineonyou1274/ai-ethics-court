import * as T from './vendor/three.module.min.js';
export function createWorld(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;
 const scene=new T.Scene();scene.background=new T.Color('#dbe6ec');const camera=new T.PerspectiveCamera(40,1,.1,100);camera.position.set(6,6,8);camera.lookAt(0,1,0);scene.add(new T.HemisphereLight(0xffffff,0xa0b3b5,2.5));const light=new T.DirectionalLight(0xfff0d9,3);light.position.set(3,8,4);light.castShadow=true;scene.add(light);
 const box=(w,h,d,c,x,y,z,parent=scene)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color:c,roughness:.6}));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m};
 box(12,.2,10,0xcbd9d7,0,-.1,0);box(12,4,.2,0xf6f0e4,0,2,-4);box(3,1.1,2.5,0xb5c6c7,0,.55,0);box(3.5,.12,3,0xe9e8d9,0,1.15,0);
 for(const x of [-4,4]){box(1.5,1.3,1,0xbac8cf,x,.65,-2);box(1.2,.8,.1,0x435971,x,1.8,-2);box(1,.6,.12,0xa3c5d1,x,1.8,-1.92)}
 const craft=new T.Group();craft.position.y=1.5;scene.add(craft);const body=box(.34,.27,2.4,0xfff9ea,0,0,0,craft);const wing=box(2.6,.08,.65,0x6673b4,0,.1,.1,craft);box(1,.07,.4,0x6673b4,0,.18,1,craft);box(.06,.5,.45,0x6673b4,0,.35,1,craft);const battery=box(.28,.15,.42,0xe5b85e,0,.24,0,craft);
 const person=new T.Group();scene.add(person);person.position.set(-2.5,0,1);box(.5,.8,.3,0x6673b4,0,1,0,person);const head=new T.Mesh(new T.SphereGeometry(.23,20,16),new T.MeshStandardMaterial({color:0xe5b893}));head.position.y=1.65;person.add(head);for(const x of [-.16,.16])box(.17,.6,.2,0x435971,x,.3,0,person);
 const particles=[];for(let i=0;i<24;i++)particles.push(box(.018,.018,.5,0xffffff,(i%6-2.5)*.65,1.8+Math.floor(i/6)*.18,(i*.67)%6-3));
 let run=null,raf=0,last=performance.now(),phase=0;let result={stability:70,lift:60,drag:40};
 const resize=()=>{const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()};const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
 function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;phase+=dt;const flying=!!run;particles.forEach((p,i)=>{p.visible=flying;p.position.z=((phase*(3-result.drag/50)+i*.67)%6)-3});craft.position.y=1.5+(flying?Math.sin(phase*3)*.1+result.lift/180:0);craft.rotation.z=flying?Math.sin(phase*7)*(100-result.stability)/200:0;craft.rotation.x=flying?(result.lift-65)/300:0;if(run&&now-run.start>3600){const done=run.done;run=null;done()}renderer.render(scene,camera);raf=requestAnimationFrame(loop)}raf=requestAnimationFrame(loop);
 return {set(d){wing.scale.x=d.span/100;wing.rotation.x=d.angle*Math.PI/180;battery.position.z=d.balance/40*.9},test(r,done){result=r;run={start:performance.now(),done}},dispose(){cancelAnimationFrame(raf);observer.disconnect();renderer.dispose();scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose()})}};
}
