import hospital from './hospital.js';
import { box, cyl, label, chair, cupboard, monitor } from '../world/kit.js';

export function department(id, stations) {
  const entries = [...stations, ['lounge','휴게실','seat'], ['locker','탈의실','shelf']];
  const rooms = entries.map(([id,name,fixture],i) => ({
    id, name, sign:name, fixture, x:(i%3-1)*4.5, z:i<3?-2.9:2.9, w:4.2, d:3.4, color:'#b8d4d4',
  }));
  const spots = { door:{x:0,z:0,name:'직원 출입구'} };
  const blocks = [];
  for (const room of rooms) {
    const {id,name,x,z} = room;
    spots[id] = {x,z:z-Math.sign(z)*1.1,name};
    blocks.push([x-1.6,x+1.6,z-.65,z+.65]);
  }
  return {
    ...hospital, floor:id, rooms, sets:{}, start:[0,0,0], exit:[6,0,0],
    nav:{ bounds:[-7,7,-5,5], blocks, spots, start:'door', depart:'door',
      frame:{cx:0,cz:0,w:15,d:11,top:2.6,yaw:.2,tilt:[.72,1.05]} },
    build(scene) {
      box(scene,0,-.12,0,15,.24,11,'#f3e9d9');
      for (const {name,x,z,fixture} of rooms) {
        box(scene,x,.01,z,4.2,.02,3.4,'#e2edeb');
        label(scene,name,x,1.8,z,2.2,.48);
        if (fixture==='seat') chair(scene,x,z);
        else if (fixture==='shelf') cupboard(scene,x,z);
        else if (fixture==='mat') box(scene,x,.1,z,2.3,.18,1.2,'#77a7aa');
        else if (fixture==='bars') {
          for (const dz of [-.42,.42]) {
            for (const dx of [-1,1]) cyl(scene,x+dx,.45,z+dz,.07,.9,'#b1bdc0');
            box(scene,x,.92,z+dz,2.3,.12,.12,'#9a7655');
          }
        } else {
          box(scene,x,.48,z,2.7,.96,1,'#d1bda3');
          monitor(scene,x,z);
        }
      }
      return {people:[]};
    },
  };
}
