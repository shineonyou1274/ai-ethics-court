const {chromium}=require('playwright');
const {mkdirSync}=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const url=process.env.BROADCAST_URL||'http://127.0.0.1:8198/broadcast/broadcast-day/dist/';
const review=process.env.BROADCAST_REVIEW||path.resolve(__dirname,'../review');
async function run(browser,name,w,h){
 const touch=name!=='desktop',messy=name==='se',shots=path.join(review,name);mkdirSync(shots,{recursive:true});
 const ctx=await browser.newContext({viewport:{width:w,height:h},hasTouch:touch,isMobile:touch,reducedMotion:touch?'no-preference':'reduce',recordVideo:{dir:process.env.BROADCAST_VIDEO||'/tmp/broadcast-qa-videos',size:{width:w,height:h}}});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));p.on('response',r=>{if(r.status()>=400)errors.push(r.url())});
 const c=await ctx.newCDPSession(p);p.setDefaultTimeout(7000);
 const shot=async tag=>{assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:path.join(shots,tag+'.png')})};
 const action=async i=>{const b=p.locator('#actions button').nth(i);if(touch)await b.tap();else await b.click()};
 const message=()=>p.locator('#feedback').innerText();
 async function stroke(a,b=a,steps=1,arc=null){
 const stage=p.locator('#stage');await stage.scrollIntoViewIfNeeded();const box=await stage.boundingBox(),aspect=box.width/box.height;
 const T=await import('../dist/vendor/three.module.min.js');
 const cam=new T.PerspectiveCamera(34,aspect,.1,90);cam.position.set(.045,.30,1).normalize().multiplyScalar(Math.max(3.05,4.98/aspect)/Math.tan(17*Math.PI/180));cam.lookAt(0,0,0);cam.updateMatrixWorld();
 const px=([x,y,z=0])=>{const v=new T.Vector3(x,y,z).project(cam);return {x:box.x+(1+v.x)*box.width/2,y:box.y+(1-v.y)*box.height/2}};
 const start=px(a),end=px(b);
 const dispatch=(type,pt)=>c.send('Input.dispatchTouchEvent',{type,touchPoints:pt?[{...pt,radiusX:4,radiusY:4,id:1}]:[]});
 if(touch)await dispatch('touchStart',start);else{await p.mouse.move(start.x,start.y);await p.mouse.down()}
 for(let n=1;n<=steps;n++){const pt=arc?px(arc(n/steps)):{x:start.x+(end.x-start.x)*n/steps,y:start.y+(end.y-start.y)*n/steps};if(touch)await dispatch('touchMove',pt);else await p.mouse.move(pt.x,pt.y);if(steps>2)await p.waitForTimeout(19)}
 if(touch)await dispatch('touchEnd');else await p.mouse.up();
 }
 try{
 await p.goto(url);await p.locator('#actions button').first().waitFor();await shot('01-badge');await action(0);await action(0);await shot('02-floor');
 for(let i=0;i<10;i++){
 const walk=p.getByRole('button',{name:/로 걸어가기$/});await walk.waitFor();if(touch)await walk.tap();else await walk.click();await p.waitForFunction(()=>document.body.matches('.working,.choice'));
 if(i===1){await shot('03-camera-before');const check=p.getByRole('button',{name:'촬영 화면 확인'});
 if(messy){await check.click();assert.match(await message(),/얼굴/)}
 await stroke([-2.18,-.72],[-3.98,-.72],18);
 const arc=f=>[2.02+.81*Math.sin(-1.34+1.34*f),-1.26+.81*Math.cos(-1.34+1.34*f)];
 await stroke(arc(0),arc(1),18,arc);await check.click();assert.match(await message(),/또렷/);await shot('04-camera-after')}
 else if(i===2){await shot('05-mix-before');await p.getByRole('button',{name:'소리 듣기'}).click();
 for(const [x,v,target] of [[-2.65,.18,.62],[0,.15,.62],[2.65,.84,.18]]){await stroke([x,-1.5+v*2.9,.17],[x,-1.5+target*2.9],17)}
 assert.match(await message(),/두 목소리/);await shot('06-mix-after')}
 else if(i===7){await shot('07-switch-before');
 for(let n=0;n<4;n++){await p.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('지금 큐'));if(messy&&n===0){await p.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('기다렸어요'));await stroke([2.1,-.95,.23]);assert.match(await message(),/큐시트/)}if(n<3){await stroke([-3.2+1.55*n,-.96,.23]);await stroke([2.10,-.95,.23])}else await stroke([2.1,-2.11,.23])}
 assert.match(await message(),/이름/);await shot('08-switch-after')}
 else if(i===8){await shot('09-edit-before');if(messy){await stroke([-2.9,-2.14,.22]);assert.match(await message(),/먼저/)}
 for(const [x,target] of [[0,-2.65],[2.65,0],[-2.65,2.65]])await stroke([x,1.28,.22],[target,-.55],15);
 await stroke([-2.90,-2.14,.22]);if(messy){await stroke([1.48,-2.12]);assert.match(await message(),/넘겨요/)}await stroke([2.22,-2.12],[0,-2.12],18);assert.match(await message(),/빈 6초/);await shot('10-edit-after')}
 else await action(messy&&(i===4||i===6)?1:0);
 const next=p.getByRole('button',{name:/^(작업 기록하고 다음 연락 받기|다음 연락 받기|일당 확인하기)$/});await next.waitFor();if(touch)await next.tap();else await next.click();
 }
 if(await p.locator('#title').innerText()==='마감할 시간이에요')await action(messy?1:0);
 await shot('11-pay');await p.getByRole('button',{name:'오늘의 순간 돌아보기'}).click();await action(1);await action(2);await action(0);await shot('12-ending');
 assert.match(await message(),/도장/);assert.match(await p.locator('#title').innerText(),messy?/동료/:/손 신호/);assert.deepEqual(errors,[]);
 const video=p.video();await ctx.close();console.log(name,'PASS',await video.path());
 }catch(e){console.error(name,errors,await p.locator('article').innerText());await shot('failure');await ctx.close();throw e}
}
(async()=>{const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=metal']});try{for(const [n,w,h] of [['phone',390,844],['se',375,667],['small',320,568],['desktop',1280,800]])if(!process.env.BROADCAST_DEVICE||process.env.BROADCAST_DEVICE===n)await run(browser,n,w,h)}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
