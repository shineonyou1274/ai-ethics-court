import { tidy } from './tidy.js';
import { desks } from '../data/department-tasks.js';

export const departmentHands = Object.fromEntries(Object.entries(desks).map(([id,task]) => {
  const items = task.objects.map((label,i) => ({id:String(i),label,kind:'move',done:label+'을 놓았어요.'}));
  return [id,tidy({stage:id,title:task.title,hint:task.hint,start:'단순화한 직업 체험이에요.',
    items,order:task.ordered ? items.map(item=>item.id) : undefined,
    miss:()=>task.hint, good:task.good || 'neat',bad:task.bad || 'redo'})];
}));
