const {chromium}=require('playwright');
const {mkdirSync}=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const url=process.env.MUSEUM_URL||'http://127.0.0.1:8187/museum-day/dist/';
const review=process.env.MUSEUM_REVIEW||path.resolve(__dirname,'../review');
async function run(browser,name,w,h){
 const touch=name!=='desktop',messy=name==='se',shots=path.join(review,name);mkdirSync(shots,{recursive:true});
 const ctx=await browser.newContext({viewport:{width:w,height:h},hasTouch:touch,isMobile:touch,reducedMotion:touch?'no-preference':'reduce',recordVideo:{dir:process.env.MUSEUM_VIDEO||'/tmp/museum-videos',size:{width:w,height:h}}});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));p.on('response',r=>{if(r.status()>=400)errors.push(r.url())});
 const c=await ctx.newCDPSession(p);p.setDefaultTimeout(7000);
 const shot=async tag=>{assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:path.join(shots,tag+'.png')})};
 const action=async i=>{const b=p.locator('#actions button').nth(i);if(touch)await b.tap();else await b.click()};
 const message=()=>p.locator('#feedback').innerText();
 async function stroke(a,b=a,steps=1,arc=null){
 const box=await p.locator('#stage').boundingBox(),aspect=box.width/box.height;
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
 await action(0);await p.waitForFunction(()=>document.body.matches('.working,.choice'));
 if(i===1){await shot('03-carry-before');if(messy){await stroke([-1,-.6]);assert.match(await message(),/맨손/)}
 await stroke([-3.3,1.1,1]);if(messy){await stroke([.70,.37,.15]);assert.match(await message(),/손잡이/)}
 await stroke([-1,-.9],[2.4,-.9],18);await shot('04-carry-after')}
 else if(i===2){await shot('05-brush-before');if(messy){await stroke([-3.28,-1.21,1]);assert.match(await message(),/쇠솔/)}
 await stroke([-3.28,1.24,1]);if(messy){await stroke([-1.35,.12],[3.2,.12],1);assert.match(await message(),/너무 빨라/)}
 for(let sweep=0;sweep<4;sweep++){for(const y of [-.85,-.23,.46,1.01]){await stroke([-1.55,y],[3.66,y],32)}if(sweep===0){assert.match(await message(),/흙 털기/);await shot('brush-progress')}if((await message()).includes('100%'))break}
 assert.match(await message(),/100%/);await shot('06-brush-after')}
 else if(i===5){await shot('07-fit-before');
 if(messy){await stroke([-1.5,-.78]);assert.match(await message(),/기준/)}
 const angles=[-.32,1.55,3.88,Math.PI*2-.32],homes=[[-3.15,.92],[-1.5,-.78],[-3.51,-.98]];
 for(let j=0;j<3;j++){const a=homes[j],mid=(angles[j]+angles[j+1])/2;
 if(messy&&j===0){await stroke(a,[.2,1.9],10);assert.match(await message(),/방향/)}
 for(let k=0;k<(j===1?2:1);k++)await stroke(a);
 await stroke(a,[1.65+.87*Math.cos(mid),.12+.87*Math.sin(mid)],20);
 assert.match(await message(),/딸깍/)}await shot('08-fit-after')}
 else if(i===8){await shot('09-case-before');if(messy){await stroke([-2.05,-1.18]);assert.match(await message(),/경보/)}
 await stroke([3.25,1.22,.15]);
 if(messy){await stroke([2.82,-1.18]);assert.match(await message(),/바래요/)}
 for(const [x,a] of [[-2.05,1.4],[2.05,1.45]]){const arc=f=>[x+.82*Math.sin(a*(1-f)),-1.18+.82*Math.cos(a*(1-f))];await stroke(arc(0),arc(1),20,arc)}
 assert.match(await message(),/안정/);await shot('10-case-after')}
 else await action(messy&&i===7?2:messy&&i===4?1:0);
 await action(0);
 }
 if(await p.locator('#title').innerText()==='마감할 시간이에요')await action(messy?1:0);
 await shot('11-pay');await p.getByRole('button',{name:'오늘의 순간 돌아보기'}).click();await action(1);await action(2);await action(0);await shot('12-ending');
 assert.match(await message(),/도장/);assert.match(await p.locator('#title').innerText(),messy?/사진/:/함께/);assert.deepEqual(errors,[]);
 const video=p.video();await ctx.close();console.log(name,'PASS',await video.path());
 }catch(e){console.error(name,await p.locator('article').innerText());await shot('failure');await ctx.close();throw e}
}
(async()=>{const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=metal']});try{for(const [n,w,h] of [['phone',390,844],['se',375,667],['small',320,568],['desktop',1280,800]])if(!process.env.MUSEUM_DEVICE||process.env.MUSEUM_DEVICE===n)await run(browser,n,w,h)}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
