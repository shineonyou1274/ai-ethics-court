import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import * as contract from '../../shared/workday.js';
import {Day} from '../dist/model.mjs';
const root=new URL('../../',import.meta.url),html=readFileSync(new URL('workday-site/hub.html',root),'utf8');
const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
const nodes=new Map(),events={};const node=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',hidden:false,addEventListener(event,fn){this[event]=fn}});return nodes.get(id)};
runInNewContext(html.split('<script type="module">')[1].split('</script>')[0].replace(/^\s*import .*;$/m,''),{...contract,document:{getElementById:node},addEventListener:(e,fn)=>events[e]=fn,window:{scrollTo(){}},confirm:()=>false});
assert.ok(node('send').hidden);assert.match(node('stamps').innerHTML,/0 \/ 11/);assert.match(html,/\[hidden\].*display:\s*none\s*!important/);
const d=new Day();d.next();d.prepare();d.checkDrawing(0,true);d.next('compare');d.test(0);d.test(0);d.next();d.prepare();d.checkDrawing(0,true);d.next('rest');d.test(2);d.next();d.prepare();d.checkDrawing(0,true);d.reviewQuality(['left','right','battery'],'hold');d.checkReport(1,0);d.next('limits');d.next('handover');const r=d.make(0,2);contract.saveRecordSafe(r);events.pageshow();assert.match(node('stamps').innerHTML,/1 \/ 11/);assert.match(node('stamps').innerHTML,/slot on[^]*?항공우주공학기술자/);assert.match(node('bank').innerHTML,/8시간/);assert.ok(!node('send').hidden);assert.match(node('who').innerHTML,/누구의 기록/);
contract.startNewSession();events.storage();assert.equal(contract.loadRecords().length,1);assert.equal(node('bank').innerHTML,'');assert.match(node('stamps').innerHTML,/0 \/ 11/);assert.ok(node('send').hidden);
for(const app of ['career-day','barista-day','aerospace-day']){assert.ok(app==='career-day'?html.includes('href="career-day/#hospital"'):html.includes(`href="${app}/"`));assert.ok(existsSync(new URL(`workday-site/public/${app}/index.html`,root)))}
for(const f of ['workday.js','collect.js','design.css'])assert.deepEqual(readFileSync(new URL(`shared/${f}`,root)),readFileSync(new URL(`aerospace-day/dist/shared/${f}`,root)));
assert.match(readFileSync(new URL('../dist/app.mjs',import.meta.url),'utf8'),/href="\.\.\/"/);
assert.equal(JSON.parse(readFileSync(new URL('workday-site/vercel.json',root))).trailingSlash,true);
console.log('PASS: four workplace entries, eleven stamps, aerospace record on hub, return/storage refresh, current-user isolation, shared copies and route configuration.');

assert.ok(html.includes('href="career-day/#fire-station"'));assert.ok(!existsSync(new URL('workday-site/public/fire-station',root)));console.log('PASS: Claude firefighter route retained; retired standalone app excluded.');
