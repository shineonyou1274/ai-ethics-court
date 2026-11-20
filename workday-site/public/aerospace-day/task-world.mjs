import * as T from './vendor/three.module.min.js';
import {PARTS,polar} from './task-data.mjs';
import {dockingBench} from './docking-bench.mjs';
export function taskView(canvas,{flat=false,mode='drawing'}={}){
 let renderer=null,ctx=null;
 if(!flat)try{renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true}catch{return null}
 if(flat)ctx=canvas.getContext('2d');
 const scene=new T.Scene();scene.background=new T.Color('#dce5e6');const camera=new T.OrthographicCamera(-3,3,3,-3,.1,30);camera.position.set(.1,5,6);camera.lookAt(0,.9,.25);scene.add(new T.HemisphereLight(0xfff9ec,0x8ca6b5,2.4));const light=new T.DirectionalLight(0xffffff,2.1);light.position.set(-3,6,4);light.castShadow=true;light.shadow.normalBias=.04;scene.add(light);
 const bench=dockingBench({sensors:mode==='sensor'});scene.add(bench.root);
 const paper=document.createElement('canvas');paper.width=640;paper.height=720;const pen=paper.getContext('2d'),texture=new T.CanvasTexture(paper);
 const sheet=new T.Mesh(new T.PlaneGeometry(2.65,3),new T.MeshStandardMaterial({map:texture,roughness:1}));sheet.rotation.x=-Math.PI/2;sheet.position.set(-1.12,.85,.1);scene.add(sheet);sheet.visible=mode==='drawing';
 if(mode==='drawing'){bench.model.position.set(1.25,.5,0);bench.model.scale.setScalar(.57);bench.root.children.filter(o=>o!==bench.model).forEach(o=>o.visible=false);const table=new T.Mesh(new T.BoxGeometry(5.3,.2,4),new T.MeshStandardMaterial({color:0xd8c8a9}));table.position.y=.7;scene.add(table)}
 const pieces=PARTS.map((p,i)=>{const q=polar(i,p.clash?1.02:1.55),o=new T.Mesh(new T.BoxGeometry(.3,.22,p.clash?.95:.35),new T.MeshStandardMaterial({color:0x5965ac}));o.position.set(q.x,1.45,q.y);o.rotation.y=-p.angle*Math.PI/180;bench.model.add(o);o.visible=mode==='drawing';return o});
 let width=1,height=1,selected=new Set();const ray=new T.Raycaster();
 function project(v){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);const p=v.clone().project(camera);return{x:(p.x*.5+.5)*width,y:(-.5*p.y+.5)*height}}
 function point(i,radius=1.62){if(renderer){if(mode==='sensor')return project(bench.ports[i/2].getWorldPosition(new T.Vector3()).add(new T.Vector3(0,.16,0)));const q=polar(i,radius);return project(new T.Vector3(-1.12+q.x*.66,.88,.1+q.y*.66))}const q=polar(i,radius),scale=Math.min(width,height)/4.25;return{x:width/2+q.x*scale,y:height/2+q.y*scale}}
 function chipPoint(i){if(renderer)return project(new T.Vector3((i-1)*1.12,.96,1.7));return{x:width*(i+.5)/3,y:height-46}}
 function diagram(c,w,h,found){c.fillStyle='#f3f7f4';c.fillRect(0,0,w,h);const scale=Math.min(w,h)/4.05;c.save();c.translate(w/2,h/2);c.scale(scale,scale);c.strokeStyle='#c7d8dc';c.lineWidth=.012;for(let i=-2;i<2;i+=.25){c.beginPath();c.moveTo(i,-2);c.lineTo(i,2);c.moveTo(-2,i);c.lineTo(2,i);c.stroke()}c.strokeStyle='#6f8c9e';c.lineWidth=.16;c.beginPath();c.arc(0,0,1,0,Math.PI*2);c.stroke();PARTS.forEach((p,i)=>{const q=polar(i,p.clash?1.02:1.55);c.save();c.translate(q.x,q.y);c.rotate(p.angle*Math.PI/180);c.fillStyle=found.has(i)?'#b04f42':'#5965ac';c.fillRect(-.15,p.clash?-.475:-.175,.3,p.clash?.95:.35);c.restore()});c.restore()}
 function draw(found=selected){selected=found;if(renderer){if(mode==='drawing'){diagram(pen,640,720,found);texture.needsUpdate=true;pieces.forEach((p,i)=>p.material.color.set(found.has(i)?0xb04f42:0x5965ac))}else bench.setSensors(found);renderer.render(scene,camera);return}
  const d=devicePixelRatio;canvas.width=width*d;canvas.height=height*d;ctx.setTransform(d,0,0,d,0,0);if(mode==='drawing'){diagram(ctx,width,height,found);return}ctx.fillStyle='#dce5e6';ctx.fillRect(0,0,width,height);const scale=Math.min(width,height)/4.25;ctx.save();ctx.translate(width/2,height/2);ctx.scale(scale,scale);ctx.strokeStyle='#90a9b6';ctx.lineWidth=.24;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.stroke();[0,2,4].forEach((part,i)=>{const q=polar(part,1.08);ctx.strokeStyle='#3f806b';ctx.lineWidth=.04;ctx.beginPath();ctx.arc(q.x,q.y,.24,0,Math.PI*2);ctx.stroke();if(found.has(i)){ctx.fillStyle='#3f806b';ctx.fillRect(q.x-.16,q.y-.14,.32,.28)}});ctx.restore();
 }
 function moveChip(i,x,y){if(!renderer)return;ray.setFromCamera(new T.Vector2(x/width*2-1,1-y/height*2),camera);const p=ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-1.7),new T.Vector3());if(p){bench.chips[i].position.copy(p);renderer.render(scene,camera)}}
 function resize(){const b=canvas.getBoundingClientRect();width=b.width||1;height=b.height||1;const a=width/height,half=Math.max(mode==='drawing'?2.15:1.95,(mode==='drawing'?2.75:2.05)/a);camera.left=-half*a;camera.right=half*a;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();renderer?.setSize(width,height,false);draw()}
 resize();return{draw,point,chipPoint,moveChip,resize,dispose(){renderer?.dispose();texture.dispose();scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose()})}};
}
