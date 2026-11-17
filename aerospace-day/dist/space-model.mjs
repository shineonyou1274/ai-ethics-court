// Educational relative dynamics, not real flight or spacecraft maintenance procedures.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const changedConditions=(a,b)=>['mass','power','assist','gloves'].filter(k=>(a.config[k]??false)!==(b.config[k]??false)).length+Number(a.repaired!==b.repaired);
export const comparableTrials=results=>results.some((a,i)=>results.slice(i+1).some(b=>changedConditions(a,b)===1));
export class SpaceTrial {
 constructor(config={},repaired=false){this.config={mass:clamp(Number(config.mass)||2,1,3),power:clamp(Number(config.power)||2,1,3),assist:config.assist!==false,gloves:config.gloves===true};this.repaired=!!repaired;this.x=1.8;this.y=.9;this.distance=12;this.vx=0;this.vy=0;this.speed=0;this.fuel=100;this.elapsed=0;this.drift=0;this.status='running'}
 step(dt,input={}){if(this.status!=='running')return;dt=clamp(Number(dt)||0,0,.05);const x=clamp(Number(input.x)||0,-1,1),y=clamp(Number(input.y)||0,-1,1),throttle=clamp(Number(input.throttle)||0,0,1);const a=this.config.power/this.config.mass;
  const disturbance=this.repaired?0:.12;
  const sensitivity=this.config.gloves?.65:1;this.vx+=(x*a*sensitivity+disturbance)*dt;this.vy+=y*a*sensitivity*dt;
  const damping=this.config.assist?1.6:.25;this.vx*=Math.exp(-damping*dt);this.vy*=Math.exp(-damping*dt);
  if(input.brake){this.speed=Math.max(0,this.speed-2*dt);this.vx*=Math.exp(-5*dt);this.vy*=Math.exp(-5*dt)}else this.speed=clamp(this.speed+throttle*a*.65*dt,0,2.4);
  this.x=clamp(this.x+this.vx*dt,-5,5);this.y=clamp(this.y+this.vy*dt,-3,3);this.distance=Math.max(0,this.distance-this.speed*dt);this.elapsed+=dt;this.drift+=disturbance*dt;
  this.fuel=Math.max(0,this.fuel-(throttle*this.config.power*.45+(Math.abs(x)+Math.abs(y))*.25+(input.brake?.15:0))*dt);
  if(this.distance<=.4)this.status=Math.hypot(this.x,this.y)<.55&&this.speed<=.65?'docked':this.speed>.65?'fast':'offset';else if(this.fuel<=0)this.status='fuel';else if(this.elapsed>=90)this.status='timeout';
 }
 stop(){if(this.status==='running')this.status='stopped'}
 result(){return {status:this.status,config:{...this.config},repaired:this.repaired,fuelUsed:Math.round((100-this.fuel)*10)/10,offset:Math.round(Math.hypot(this.x,this.y)*100)/100,speed:Math.round(this.speed*100)/100,seconds:Math.round(this.elapsed),drift:this.elapsed?Math.round(this.drift/this.elapsed*100)/100:0}}
}
export class SpaceWork {
 constructor(){this.phase='suit';this.gear=new Set();this.config={mass:2,power:2,assist:true,gloves:true};this.turn=0;this.results=[];this.trial=null;this.paused=false}
 get repaired(){return this.turn>=180}
 equip(id){if(this.phase!=='suit'||!['helmet','gloves','hose'].includes(id))return false;this.gear.add(id);return true}
 prepare(){if(this.gear.size!==3)return false;this.config.gloves=this.gear.has('gloves');this.phase='design';return true}
 tighten(degrees){if(this.phase!=='inspect'||!Number.isFinite(degrees))return;this.turn=clamp(this.turn+Math.max(0,degrees),0,180)}
 get changes(){return this.results.length?changedConditions(this.results.at(-1),{config:this.config,repaired:this.repaired}):0}
 start(){if(!['inspect','result'].includes(this.phase)||this.changes>1)return false;this.trial=new SpaceTrial(this.config,this.repaired);this.phase='flight';this.paused=false;return true}
 finish(){if(!this.trial||this.trial.status==='running')return false;this.results.push(this.trial.result());if(this.results.length>4)this.results.shift();this.phase='result';return true}
 get comparable(){return comparableTrials(this.results)}
}
