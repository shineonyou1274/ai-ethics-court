import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.min.js';
import {Cleanup} from '../dist/cleanup.mjs';
import {Washbench} from '../dist/washbench.mjs';
import {Workbench} from '../dist/workbench.mjs';
import {Checkout} from '../dist/payment.mjs';
// Deliberately disagree with window size to catch full-window projection regressions.
globalThis.innerWidth=1600;globalThis.innerHeight=1000;
for(const [width,height] of [[390,472.64],[768,800],[320,358.4]]){
 const canvas={getBoundingClientRect:()=>({width,height,left:0,top:0})};
 for(const Class of [Cleanup,Washbench,Checkout]){
  const target={canvas,camera:new T.OrthographicCamera(),pointer:new T.Vector2(),ray:new T.Raycaster()};
  Class.prototype.resize.call(target);
  assert.ok(Math.abs((target.camera.right-target.camera.left)/(target.camera.top-target.camera.bottom)-width/height)<1e-9);
 }
 const target={canvas,camera:new T.PerspectiveCamera()};Workbench.prototype.resize.call(target);assert.equal(target.camera.aspect,width/height);
}
console.log('PASS: all four hands-on cameras use the split canvas at mobile, desktop and small-phone sizes.');
