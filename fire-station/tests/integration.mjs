import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';import {runInNewContext} from 'node:vm';
import {loadRecords,walletTotal,manwon,makeRecord,saveRecordSafe} from '../dist/shared/workday.js';
import {encodeRecords,decodeCodes} from '../dist/shared/collect.js';
const root=new URL('../../',import.meta.url),html=readFileSync(new URL('workday-site/hub.html',root),'utf8');
let raw='[]';globalThis.localStorage={getItem:()=>raw,setItem:(_,v)=>raw=v};
const nodes=new Map(),listeners={};
const context={loadRecords,walletTotal,manwon,document:{getElementById(id){if(!nodes.has(id))nodes.set(id,{innerHTML:'',hidden:false});return nodes.get(id)}},addEventListener:(event,fn)=>listeners[event]=fn};
runInNewContext(html.split('<script type="module">')[1].split('</script>')[0].replace(/^\s*import .*;$/m,''),context);
assert.equal(nodes.get('send').hidden,true);assert.equal(nodes.get('bank').innerHTML,'');assert.match(html,/\[hidden\]\s*\{\s*display:\s*none\s*!important/);
const sample=(app,job)=>makeRecord({app,place:app,job:{id:job,name:job,careernet:app==='fire-station'?'385':'180'},annual:4000,wageYear:2021,wageBasis:'체험',shift:{start:'09:00',end:'18:00',breakMin:60},workedMin:480,shiftMin:480,ending:{name:'하루'},like:{label:'장비',type:'R'},hard:{label:'기록',type:'C'}});
saveRecordSafe(sample('career-day','nurse'));saveRecordSafe(sample('fire-station','firefighter'));listeners.pageshow();assert.equal(nodes.get('send').hidden,false);assert.match(nodes.get('fireJobs').innerHTML,/✓ 소방관/);assert.match(nodes.get('hospitalJobs').innerHTML,/✓ 간호사/);assert.ok(nodes.get('bank').innerHTML.includes(manwon(255200)));
saveRecordSafe(sample('barista-day','barista'));listeners.storage();assert.match(nodes.get('cafeJobs').innerHTML,/✓ 바리스타/);assert.ok(nodes.get('bank').innerHTML.includes(manwon(382800)));
const decoded=decodeCodes(encodeRecords(loadRecords(),'통합 테스트'));assert.equal(decoded.errors.length,0);assert.equal(decoded.students[0].records.length,3);
raw='[]';listeners.storage();assert.equal(nodes.get('send').hidden,true);assert.equal(nodes.get('bank').innerHTML,'');assert.ok(!nodes.get('fireJobs').innerHTML.includes('✓'));
for(const app of ['career-day','barista-day','fire-station']){assert.ok(html.includes(`href="${app}/"`));assert.ok(existsSync(new URL(`workday-site/public/${app}/index.html`,root)))}
const app=readFileSync(new URL('../dist/app.mjs',import.meta.url),'utf8');assert.match(app,/href="\.\.\/"/);assert.equal(JSON.parse(readFileSync(new URL('workday-site/vercel.json',root))).trailingSlash,true);
console.log('PASS: empty state, return/storage refresh, shared wallet across three apps, visited chips, teacher code, bundled entries and trailing slash configuration.');
