import * as T from './vendor/three.module.min.js';
import {PARTS,polar} from './task-data.mjs';
export function taskView(canvas,{flat=false}={}){
 let renderer=null,ctx=null;
 if(!flat)try{renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5))}catch{return null}
 if(flat)ctx=canvas.getContext('2d');
 const scene=new T.Scene();scene.background=new T.Color('#dce5e6');const camera=new T.OrthographicCamera(-2.2,2.2,2.2,-2.2,.1,30);camera.position.set(0,0,8);camera.lookAt(0,0,0);scene.add(new T.HemisphereLight(0xfff9ec,0x8ca6b5,2.8));const light=new T.DirectionalLight(0xffffff,2);light.position.set(3,4,7);scene.add(light);
 const ring=new T.Mesh(new T.TorusGeometry(1,.12,12,64),new T.MeshStandardMaterial({color:0x90a9b6,roughness:.7}));scene.add(ring);
 const pieces=PARTS.map((p,i)=>{const q=polar(i,p.clash?1.02:1.55),o=new T.Mesh(new T.BoxGeometry(.3,p.clash?.95:.35,.22),new T.MeshStandardMaterial({color:0x5965ac}));o.position.set(q.x,-q.y,.15);o.rotation.z=-p.angle*Math.PI/180;scene.add(o);return o});
 let width=1,height=1,selected=new Set();
 function point(i){const q=polar(i,1.62),scale=Math.min(width,height)/4.25;return{x:width/2+q.x*scale,y:height/2+q.y*scale}}
 function draw(found=selected){selected=found;if(renderer){pieces.forEach((p,i)=>p.material.color.set(found.has(i)?0xb04f42:0x5965ac));renderer.render(scene,camera);return}
  const d=devicePixelRatio;canvas.width=width*d;canvas.height=height*d;ctx.setTransform(d,0,0,d,0,0);ctx.fillStyle='#dce5e6';ctx.fillRect(0,0,width,height);const scale=Math.min(width,height)/4.25;ctx.save();ctx.translate(width/2,height/2);ctx.scale(scale,scale);ctx.strokeStyle='#90a9b6';ctx.lineWidth=.24;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.stroke();PARTS.forEach((p,i)=>{const q=polar(i,p.clash?1.02:1.55);ctx.save();ctx.translate(q.x,q.y);ctx.rotate(p.angle*Math.PI/180);ctx.fillStyle=found.has(i)?'#b04f42':'#5965ac';ctx.fillRect(-.15,p.clash?-.475:-.175,.3,p.clash?.95:.35);ctx.restore()});ctx.restore();
 }
 function resize(){const b=canvas.getBoundingClientRect();width=b.width||1;height=b.height||1;const a=width/height,half=2.125*Math.max(1,1/a);camera.left=-half*a;camera.right=half*a;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();renderer?.setSize(width,height,false);draw()}
 resize();return{draw,point,resize,dispose(){renderer?.dispose();scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose()})}};
}
