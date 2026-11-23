import * as T from './vendor/three.module.min.js';
// One tangible tabletop model shared by assembly, sensors, and the drawing preview.
export function dockingBench({sensors=false}={}){
 const root=new T.Group();
 const mesh=(g,c,x,y,z,p=root)=>{const o=new T.Mesh(g,new T.MeshStandardMaterial({color:c,roughness:.65,metalness:.15}));o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o};
 const box=(w,h,d,c,x,y,z,p)=>mesh(new T.BoxGeometry(w,h,d),c,x,y,z,p);
 box(4.7,.18,4.3,0xd8c8a9,0,.62,.2);box(4.35,.035,3.85,0x788f99,0,.73,.2);
 for(const x of [-1.9,1.9])for(const z of [-1.5,1.8])box(.16,.6,.16,0x576f7c,x,.23,z);
 const model=new T.Group();root.add(model);
 const annulus=(outer,inner,h,y,c)=>{const shape=new T.Shape();shape.absarc(0,0,outer,0,Math.PI*2,false);const hole=new T.Path();hole.absarc(0,0,inner,0,Math.PI*2,true);shape.holes.push(hole);const o=mesh(new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.025,bevelThickness:.025,curveSegments:48}),c,0,y,0,model);o.rotation.x=-Math.PI/2;return o};
 annulus(1.25,.83,.18,.95,0x7f98a5);annulus(1.26,.83,.13,1.17,0xc3d0d5);
 for(const x of [-.9,.9])box(.18,.22,.3,0x425e70,x,.84,0,model);
 const bolts=[],gaps=[],ports=[],chips=[];
 const at=(i,r=1.08)=>({x:Math.sin(i*Math.PI/3)*r,z:-Math.cos(i*Math.PI/3)*r});
 for(let i=0;i<6;i++){const q=at(i);mesh(new T.CylinderGeometry(.18,.18,.04,24),0xe0ba66,q.x,1.34,q.z,model);const bolt=mesh(new T.CylinderGeometry(.125,.125,.15,6),0x485e73,q.x,1.44,q.z,model);box(.13,.012,.025,0xe2e8e5,0,.078,0,bolt);bolts.push(bolt);const gap=box(.25,.05,.18,0xe6924a,q.x*1.18,1.145,q.z*1.18,model);gap.rotation.y=-i*Math.PI/3;gaps.push(gap)}
 // Identical landing sockets: no matching shape/color gives away the answer.
 for(const i of [0,2,4]){const q=at(i);const port=mesh(new T.CylinderGeometry(.25,.25,.075,24),0x387e69,q.x,1.4,q.z,model);mesh(new T.CylinderGeometry(.2,.2,.078,24),0x93bca7,0,.01,0,port);ports.push(port)}
 for(let i=0;i<3;i++){const g=new T.Group();root.add(g);box(.42,.22,.38,0x607991,0,0,0,g);box(.33,.025,.28,0xe3e9e8,0,.125,0,g);if(i===0){const lens=mesh(new T.CylinderGeometry(.11,.11,.09,16),0x253e53,0,.05,-.22,g);lens.rotation.x=Math.PI/2}else if(i===1){box(.1,.06,.1,0x6bb9ad,0,.17,0,g)}else{for(const x of [-.08,.08])box(.045,.07,.13,0xc5a564,x,.14,0,g)}chips.push(g)}
 // Tools and cable tray make the scale and working surface legible.
 box(.65,.07,.36,0x4d6575,1.6,.79,.3);box(.08,.05,.64,0xbac7cc,1.6,.85,.25);box(.14,.07,.24,0x5965ac,1.6,.86,.6);
 for(let i=0;i<3;i++)box(.65,.04,.65,0xe1e7df,(i-1)*1.12,.78,1.7);
 function setTurns(turns){bolts.forEach((b,i)=>{const done=turns[i]>=180;b.position.y=done?1.37:1.44+.09*Math.sin(turns[i]*Math.PI/180);b.rotation.y=-turns[i]*Math.PI/180;b.material.color.set(done?0x3f806b:0x485e73);gaps[i].visible=!done})}
 function setSensors(found){ports.forEach(p=>p.visible=sensors);chips.forEach((chip,i)=>{chip.visible=sensors;const p=ports[i].position;chip.position.set(found.has(i)?p.x:(i-1)*1.12,found.has(i)?1.58:.96,found.has(i)?p.z:1.7)});bolts.forEach(b=>b.visible=!sensors);gaps.forEach(g=>g.visible=!sensors)}
 setTurns(Array(6).fill(0));setSensors(new Set());
 return{root,model,bolts,ports,chips,setTurns,setSensors,at};
}
