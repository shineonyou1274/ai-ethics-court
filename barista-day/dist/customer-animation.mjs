import * as T from './vendor/three.module.min.js';
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
export function sipPose(t,flavor){
 const lift=t<2?smooth((t-.7)/1.3):t<3.1?1:1-smooth((t-3.1)/.9);
 return {lift,tilt:t<3.1?smooth((t-2)/.45):1-smooth((t-3.1)/.6),reaction:t>=4,done:t>=8.5,expression:t<4?'neutral':flavor.match?'happy':flavor.tip?'thoughtful':'surprised'};
}
export function addFace(n){
 n.faces={};for(const name of ['neutral','happy','thoughtful','surprised']){
  const g=new T.Group();n.g.add(g);g.visible=name==='neutral';n.faces[name]=g;
  const points=[];for(let i=0;i<=16;i++){const x=-.063+i*.126/16;const y=name==='happy'?1.455+(.032*(x/.063)**2):name==='thoughtful'?1.46+x*.2:1.47;points.push(new T.Vector3(x,y,.202))}
  const material=new T.MeshBasicMaterial({color:0x54352c});
  if(name==='surprised'){const m=new T.Mesh(new T.TorusGeometry(.029,.009,8,24),material);m.position.set(0,1.46,.204);g.add(m)}else g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),20,.009,6,false),material));
  for(const side of [-1,1]){const b=new T.Mesh(new T.BoxGeometry(.065,.012,.012),material);b.position.set(side*.075,name==='surprised'?1.635:1.62,.184);b.rotation.z=name==='thoughtful'?side*.3:name==='happy'?-side*.15:0;g.add(b)}
 }
}
export function animateSip(n,t,flavor){
 const p=sipPose(t,flavor);n.cup.visible=true;
 n.cup.position.set(.32*(1-p.lift)+.045*p.lift,.82+.48*p.lift,.23+.08*p.lift);
 n.cup.rotation.x=-p.tilt*.48;
 const hand=n.cup.position.clone().add(new T.Vector3(.13,.12,0));n.hands[1].position.copy(hand);
 const shoulder=new T.Vector3(.32,1.27,0),delta=hand.clone().sub(shoulder);
 n.arms[1].position.copy(shoulder).add(hand).multiplyScalar(.5);n.arms[1].scale.y=delta.length()/.55;n.arms[1].quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
 n.legs.forEach(m=>m.rotation.x=0);n.arms[0].rotation.x=0;
 for(const [key,g] of Object.entries(n.faces))g.visible=key===p.expression;
 n.g.rotation.y=p.reaction?(flavor.match?Math.sin((t-4)*4)*.045:Math.sin((t-4)*3)*.1):0;
 return p;
}
