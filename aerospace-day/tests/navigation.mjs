import assert from 'node:assert/strict';
import {findPath} from '../dist/navigation.mjs';
import {STATIONS,blocked} from '../dist/world.mjs';
const positions=[{x:0,z:2.4},...STATIONS.map(s=>({x:s.ax,z:s.az}))];
for(const start of positions)for(const end of positions){
 const path=findPath(start,end,blocked);assert.ok(path.length,'station is reachable');
 let previous=start;
 for(const p of path){
  for(let i=1;i<=20;i++){const t=i/20;assert.ok(!blocked(previous.x+(p.x-previous.x)*t,previous.z+(p.z-previous.z)*t),'segment stays clear of furniture');}
  previous=p;
 }
 assert.deepEqual(path.at(-1),end);
}
assert.deepEqual(findPath(positions[0],{x:3.4,z:-2.5},blocked),[]);
console.log('PASS: every station pair is reachable; path segments avoid furniture and blocked destinations.');
