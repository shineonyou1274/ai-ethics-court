export class WashCup{
 constructor(id,cupId){this.id=id;this.cupId=cupId;this.shelved=false;this.rinsing=0;this.dry=false;this.points=[];for(let i=0;i<60;i++){const a=i*Math.PI/30;this.points.push({x:Math.cos(a)*.23,z:Math.sin(a)*.23,clean:false})}for(let i=0;i<16;i++)this.points.push({x:(i%4-1.5)*.055,z:(Math.floor(i/4)-1.5)*.055,clean:false})}
 get progress(){return this.points.filter(p=>p.clean).length/this.points.length}
 get rinsed(){return this.rinsing>=1.5}
 rub(a,b,water){if(!water||this.dry)return;const dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz;if(l<1e-10)return;for(const p of this.points){const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/l));if(Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz)<.12)p.clean=true}}
 rinse(dt,water,under){if(this.progress===1&&water&&under&&!this.dry)this.rinsing=Math.min(1.5,this.rinsing+Math.max(0,Math.min(dt,.1)))}
 rack(){if(!this.rinsed||this.dry)return false;this.dry=true;return true}
}
