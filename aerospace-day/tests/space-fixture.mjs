import {SpaceTrial} from '../dist/space-model.mjs';
export function completeSpace(day){const results=[false,true].map(repaired=>{const t=new SpaceTrial({mass:2,power:2,assist:true},repaired);for(let i=0;i<100;i++)t.step(.05,{throttle:.4});t.stop();return t.result()});return day.completeSpace({results,repaired:true})}
