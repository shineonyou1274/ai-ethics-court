// Geometry/state regression tests. These supplement, not replace, visual pointer checks.
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.min.js';
import {Checkout} from '../dist/payment.mjs';
import {Washbench} from '../dist/washbench.mjs';
import {Payment} from '../dist/payment-state.mjs';
import {Shift} from '../dist/shift.mjs';
import {WashCup} from '../dist/wash-state.mjs';
const els=new Map();
globalThis.document={body:{insertAdjacentHTML(){},classList:{add(){},remove(){}}},createElement(){return{getContext(){return{fillText(){}}}}},querySelectorAll(){return[]},getElementById(id){if(!els.has(id))els.set(id,{style:{},setAttribute(){},getBoundingClientRect(){return{left:20,right:160,top:60,bottom:100}},querySelector(){return{scrollTo(){}}}});return els.get(id)},addEventListener(){}};
globalThis.window={addEventListener(){},matchMedia(){return{matches:false}}};
const canvas=(width,height)=>({addEventListener(){},setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width,height})});
const state=new Shift();state.order={name:'지우',drink:'아메리카노'};state.payment=new Payment(4000,'cash',10000);state.payment.receive();
const pay=new Checkout({state,canvas:canvas(390,472),onChange(){},onClose(){},sound(){}});pay.open();
for(const value of [5000,1000,500,100,1000,500,100,5000]){
 state.payment.add(value);pay.rebuildChange();
 const bounds=pay.change.children.map(g=>new T.Box3().setFromObject(g));
 for(let i=0;i<bounds.length;i++)for(let j=i+1;j<bounds.length;j++)assert.equal(bounds[i].intersectsBox(bounds[j]),false,'denomination labels must not overlap');
}
assert.equal(pay.change.children.length,4,'duplicates are counted in four separate denominations');
const before=pay.change.children.map(g=>g.position.toArray());pay.close();pay.open();assert.deepEqual(pay.change.children.map(g=>g.position.toArray()),before,'reopening cannot change layout');
for(const [width,height]of [[390,472],[768,800]]){
 const s=new Shift();s.cleanCups=[];const cup=new WashCup(0,'cup-1');cup.points.forEach(p=>p.clean=true);cup.rinsing=1.5;cup.dry=true;s.washCups=[cup];
 const w=new Washbench({state:s,canvas:canvas(width,height),onChange(){},onClose(){},sound(){}});w.open();w.camera.updateMatrixWorld(true);
 const screen=v=>{const p=v.clone().project(w.camera);return{clientX:(p.x*.5+.5)*width,clientY:(-p.y*.5+.5)*height,pointerId:1,preventDefault(){}}};
 const tap=screen(w.tapHandle.position);w.down(tap);w.up(tap);assert.equal(w.water,true);w.down(tap);w.up(tap);assert.equal(w.water,false);w.down(tap);w.up(tap,true);assert.equal(w.water,false,'cancelled tap must not toggle');
 assert.equal(w.overShelf({clientX:width-1,clientY:height-1}),false);
 const edge=screen(w.shelfPoint.clone().add(new T.Vector3(.5,0,.3)));assert.equal(w.overShelf(edge),true,'visible shelf edge accepts cup on both sizes');
 w.drag={id:1,kind:'move',start:w.cup.position.clone(),offset:{x:0,z:0}};w.up(edge);assert.equal(cup.shelved,true);assert.deepEqual(s.cleanCups,['cup-1']);assert.ok(w.cup.position.y>=.575,'stored cup rests above shelf top');
}
console.log('PASS: separate denomination bundles/reopen, faucet on/off/cancel, generous shelf edges and visible stored cup on phone/PC.');
const {Workbench}=await import('../dist/workbench.mjs');
for(const [width,height]of [[390,472],[768,800]]){
 const s=new Shift();s.order={name:'민준',drink:'라테',preferred:.75,preference:'진하게'};s.cup='에스프레소';
 const b=new Workbench({state:s,canvas:canvas(width,height),onChange(){},onClose(){},sound(){}});b.active=true;b.cup.position.copy(b.target);b.resize();b.camera.updateMatrixWorld(true);b.cup.updateMatrixWorld(true);
 const top=b.cup.localToWorld(new T.Vector3(0,.47,0)).project(b.camera),e={pointerId:1,clientX:(top.x*.5+.5)*width,clientY:(-top.y*.5+.5)*height};b.drag={id:1,kind:'pour'};b.move(e);assert.equal(b.pouring,true);
 const cupBounds=new T.Box3();for(const part of b.cup.children)if(part!==b.fillVolume)cupBounds.union(new T.Box3().setFromObject(part)); // fillVolume starts as an unscaled placeholder before update().
 const vessel=new T.Box3().setFromObject(b.vessel),machine=new T.Box3(new T.Vector3(-1.55,.2,-1),new T.Vector3(.85,1.6,-.14));
 assert.equal(vessel.intersectsBox(cupBounds),false,'pouring vessel must clear cup');assert.equal(vessel.intersectsBox(machine),false,'pouring vessel must clear machine');
 b.up(e);assert.equal(b.pouring,false);assert.deepEqual(b.vessel.position.toArray(),[1.55,.2,.85]);
}
console.log('PASS: pouring vessel clears cup and machine, then returns home on release at phone/PC sizes.');
