import assert from 'node:assert/strict';
import {SpaceTrial,SpaceWork} from '../dist/space-model.mjs';
const a=new SpaceTrial({mass:1,power:3},false),b=new SpaceTrial({mass:3,power:1},true);
for(let i=0;i<60;i++){a.step(.05,{throttle:.5});b.step(.05,{throttle:.5})}assert.ok(a.speed>b.speed);assert.ok(a.fuel<b.fuel);
const loose=new SpaceTrial({},false),fixed=new SpaceTrial({},true);for(let i=0;i<200;i++){loose.step(.05,{});fixed.step(.05,{})}assert.ok(loose.x>fixed.x);assert.equal(fixed.x,1.8);
const work=new SpaceWork();assert.equal(work.prepare(),false);for(const id of ['helmet','gloves','hose'])work.equip(id);assert.equal(work.prepare(),true);work.phase='inspect';work.tighten(-90);assert.equal(work.turn,0);work.tighten(90);assert.equal(work.repaired,false);work.tighten(90);assert.equal(work.repaired,true);assert.ok(work.start());assert.equal(work.finish(),false);work.trial.stop();assert.ok(work.finish());work.phase='inspect';work.config.mass=3;work.start();work.trial.stop();work.finish();assert.ok(work.comparable);
// A successful docking is possible with feedback steering and conservative forward speed.
const dock=new SpaceTrial({mass:2,power:2,assist:true,gloves:true},true);for(let i=0;i<1800&&dock.status==='running';i++){const steering={x:Math.max(-1,Math.min(1,-dock.x*2-dock.vx)),y:Math.max(-1,Math.min(1,-dock.y*2-dock.vy)),throttle:dock.speed<.45?.2:0,brake:dock.speed>.5};dock.step(.05,steering)}assert.equal(dock.status,'docked');assert.ok(dock.result().offset<.55);console.log('PASS: suit gate, physical turn progression, design tradeoffs, loose-fastener drift, comparison and reachable docking.');

const multi=new SpaceWork();for(const id of ['helmet','gloves','hose'])multi.equip(id);multi.prepare();multi.phase='inspect';multi.start();multi.trial.stop();multi.finish();multi.phase='inspect';multi.config.mass=3;multi.config.power=3;assert.equal(multi.start(),false);multi.config.power=2;assert.equal(multi.start(),true);
const glove=new SpaceTrial({gloves:true},false),bare=new SpaceTrial({gloves:false},false),opposite=new SpaceTrial({gloves:true},false);
for(let i=0;i<100;i++){glove.step(.05,{x:1});bare.step(.05,{x:1});opposite.step(.05,{x:-1})}assert.ok(glove.x<bare.x);assert.equal(glove.result().drift,opposite.result().drift);assert.equal(glove.result().drift,.12);assert.equal(fixed.result().drift,0);
console.log('PASS: one-condition trial gate, glove sensitivity, and fastener bias independent of steering.');
