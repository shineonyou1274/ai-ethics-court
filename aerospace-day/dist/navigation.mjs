// Deterministic grid paths keep tap-to-walk movement outside furniture.
export function findPath(start,end,blocked){
 const step=.32,minX=-5.44,minZ=-6.4,nx=35,nz=41;
 const point=(i,j)=>({x:minX+i*step,z:minZ+j*step});
 const cell=p=>[Math.max(0,Math.min(nx-1,Math.round((p.x-minX)/step))),Math.max(0,Math.min(nz-1,Math.round((p.z-minZ)/step)))];
 const key=(i,j)=>j*nx+i;let [sx,sz]=cell(start),[tx,tz]=cell(end);
 if(blocked(end.x,end.z))return [];
 let startKey=key(sx,sz),endKey=key(tx,tz),queue=[startKey],prev=new Map([[startKey,null]]);
 while(queue.length){let k=queue.shift();if(k===endKey)break;let i=k%nx,j=Math.floor(k/nx);for(let [di,dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){let a=i+di,b=j+dj;if(a<0||b<0||a>=nx||b>=nz)continue;let nk=key(a,b),p=point(a,b);if(prev.has(nk)||blocked(p.x,p.z))continue;if(di&&dj){let p1=point(a,j),p2=point(i,b);if(blocked(p1.x,p1.z)||blocked(p2.x,p2.z))continue}prev.set(nk,k);queue.push(nk)}}
 if(!prev.has(endKey))return [];let path=[],k=endKey;while(k!==startKey){path.push(point(k%nx,Math.floor(k/nx)));k=prev.get(k)}path.reverse();path.push({x:end.x,z:end.z});return path;
}
