import { Group } from 'three';
import { box, label } from './kit.js';
import { desks } from '../data/department-tasks.js';

// 가까이 보는 작은 물건은 글씨 둘레의 여백을 줄이고 표찰을 위로 기울인다.
function placard(parent, text, x, y, z) {
  const sign = label(parent, text, x, y, z, 1.68, .48, '#243847', '#fffaf0');
  const texture = sign.material.map;
  const ctx = texture.image.getContext('2d');
  ctx.fillStyle = '#fffaf0';
  ctx.fillRect(0, 0, 640, 160);
  ctx.font = 'bold 112px sans-serif';
  ctx.fillStyle = '#243847';
  ctx.fillText(text, 320, 84, 610);
  texture.needsUpdate = true;
  sign.rotation.x = -.65;
}

function bench(task) {
  return { build(g) {
    box(g,0,.32,0,5.9,.64,3.7,'#dfc9ac');
    const n = task.objects.length;
    const x = i => (i-(n-1)/2)*1.8;
    const slots = task.destinations.map((name,i) => {
      box(g,x(i),.70,-.9,1.55,.12,.9,'#aec8c2');
      placard(g,name,x(i),1.15,-1.45);
      return {id:String(i),at:[x(i),-.9],y:.77,r:.68};
    });
    const movers = task.objects.map((name,i) => {
      const obj = new Group(); g.add(obj);
      box(obj,0,.07,0,1.3,.14,.75,'#fff7dc');
      placard(obj,name,0,.36,0);
      return {id:String(i),obj,from:[x(i),1],slot:String(task.route[i]),y:.67,restY:.78,lift:.28};
    });
    return {slots,movers,focus:[0,.7,0],zoom:3.9};
  }};
}
export const departmentBenches = Object.fromEntries(Object.entries(desks).map(([id,task])=>[id,bench(task)]));
