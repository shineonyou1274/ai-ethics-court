import { Group } from 'three';
import { box, label } from './kit.js';
import { desks } from '../data/department-tasks.js';

function bench(task) {
  return { build(g) {
    box(g,0,.32,0,5.9,.64,3.7,'#dfc9ac');
    const n = task.objects.length;
    const x = i => (i-(n-1)/2)*1.8;
    const slots = task.destinations.map((name,i) => {
      box(g,x(i),.70,-.9,1.55,.12,.9,'#aec8c2');
      label(g,name,x(i),1.15,-1.45,1.55,.4);
      return {id:String(i),at:[x(i),-.9],y:.77,r:.68};
    });
    const movers = task.objects.map((name,i) => {
      const obj = new Group(); g.add(obj);
      box(obj,0,.07,0,1.3,.14,.75,'#fff7dc');
      label(obj,name,0,.36,0,1.38,.40);
      return {id:String(i),obj,from:[x(i),1],slot:String(task.route[i]),y:.67,restY:.78,lift:.28};
    });
    return {slots,movers,focus:[0,.7,0],zoom:3.9};
  }};
}
export const departmentBenches = Object.fromEntries(Object.entries(desks).map(([id,task])=>[id,bench(task)]));
