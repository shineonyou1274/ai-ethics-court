import { Group, CanvasTexture, SRGBColorSpace, Mesh, MeshBasicMaterial, PlaneGeometry, RingGeometry, DoubleSide } from 'three';
import { box, cyl } from '../world/kit.js';
import { mountBench } from '../world/department-benches.js';

// 작업대에 인쇄된 글을 바꿀 때 같은 텍스처를 다시 사용한다.
export function print(parent,x,y,z,w,d,lines,bg='#fffaf0',ink='#24394a') {
  const c=document.createElement('canvas'); c.width=640;c.height=Math.max(90,Math.round(640*d/w));
  const ctx=c.getContext('2d'), map=new CanvasTexture(c);map.colorSpace=SRGBColorSpace;
  const mesh=new Mesh(new PlaneGeometry(w,d),new MeshBasicMaterial({map}));
  mesh.position.set(x,y,z);mesh.rotation.x=-Math.PI/2;parent.add(mesh);
  function write(rows, background=bg) {
    ctx.fillStyle=background;ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle=ink;
    const row=c.height/rows.length;ctx.font='bold '+Math.min(128,row*.77)+'px sans-serif';ctx.textBaseline='middle';ctx.textAlign='center';
    rows.forEach((v,i)=>ctx.fillText(v,320,(i+.5)*row,612));map.needsUpdate=true;
  }
  write(lines);return write;
}
export function unit(parent,x,y,z) {
  const g=new Group();g.position.set(x,y,z);parent.add(g);return g;
}
export function workbench(el,sc,{world,sfx,done},model) {
  const listeners=new AbortController(), targets=[], items=[];
  el.innerHTML='<p class="handsMsg" id="cuMsg" role="status"></p><div class="benchControls"></div>';
  const msg=el.querySelector('#cuMsg'), controls=el.querySelector('.benchControls');
  let errors=0,completed=false,held=null;
  const api={
    say(text){msg.textContent=text;msg.classList.remove('bad');},
    wrong(text){errors++;sfx('bad');msg.textContent=text;msg.classList.add('bad');return false;},
    finish(){if(completed)return;completed=true;sfx('good');done(Object.keys(sc.grades)[errors?1:0],{mistakes:errors});},
    button(text,fn){const b=document.createElement('button');b.className='btn ghost';b.textContent=text;controls.append(b);b.onclick=()=>{if(!completed)fn();};return b;},
    area(name,x,y,z,w,d,fn){const area={name,x,y,z,w,d,fn};targets.push(area);return area;},
    drag(g,w,d,drop){items.push({g,w,d,drop,home:g.position.clone()});},
  };
  const surface=document.querySelector('canvas');
  let fallback;
  // 물건을 집으면 놓을 수 있는 자리(누르는 단추가 아닌 칸) 모두에 같은 초록 원을 띄운다 (shared/DESIGN.md §5)
  const rings=[];
  const build=g=>{model(g,api,sc);for(const a of targets){if(a.fn)continue;const r=Math.min(a.w,a.d)*.45;
    const ring=new Mesh(new RingGeometry(r*.82,r,40),new MeshBasicMaterial({color:'#3f9d7d',transparent:true,opacity:.85,side:DoubleSide,depthWrite:false,depthTest:false}));
    ring.rotation.x=-Math.PI/2;ring.position.set(a.x,a.y+.03,a.z);ring.visible=false;ring.renderOrder=3;g.add(ring);rings.push(ring);}return {};};
  const showRings=on=>rings.forEach(r=>{r.visible=on;});
  const handle=world ? mountBench(world,sc.game,build) : null;
  if(!world){
    fallback=new Group();model(fallback,api,sc);
    for(const item of items)api.button(item.g.name,()=>{if(item.g.userData.fixed||!item.g.visible)return;held=item;api.say(item.g.name+' · 놓을 곳을 고르세요.');});
    for(const a of targets)api.button(a.name,()=>{if(held){held.drop(a.name);held=null;}else a.fn?.();});
  }
  // 평행 투영된 작업대 위에서 포인터를 물체 높이의 x,z로 되돌린다.
  function local(e,y){
    const o=world.closeProject(0,y,0),a=world.closeProject(1,y,0),b=world.closeProject(0,y,1);
    const dx=e.clientX-o.x,dy=e.clientY-o.y,ax=a.x-o.x,ay=a.y-o.y,bx=b.x-o.x,by=b.y-o.y,det=ax*by-ay*bx;
    return {x:(dx*by-dy*bx)/det,z:(ax*dy-ay*dx)/det};
  }
  function hit(e,x,y,z,w,d){const p=local(e,y);return Math.abs(p.x-x)<=w/2&&Math.abs(p.z-z)<=d/2;}
  let pressed=null,pointer=null;
  if(world)for(const type of ['pointerdown','pointermove','pointerup','pointercancel']){
    surface.addEventListener(type,e=>{
      if(completed||(!e.isPrimary)||pointer!==null&&pointer!==e.pointerId)return;
      e.preventDefault();e.stopImmediatePropagation();
      if(type==='pointerdown'){
        pointer=e.pointerId;surface.setPointerCapture(pointer);
        held=items.find(it=>it.g.visible&&!it.g.userData.fixed&&hit(e,it.g.position.x,it.g.position.y,it.g.position.z,it.w,it.d));
        pressed=targets.find(a=>hit(e,a.x,a.y,a.z,a.w,a.d));showRings(!!held);
      }else if(type==='pointermove'&&held){
        const p=local(e,held.home.y);held.g.position.set(p.x,held.home.y+.1,p.z);
      }else if(type==='pointerup'||type==='pointercancel'){
        const a=targets.find(a=>hit(e,a.x,a.y,a.z,a.w,a.d));
        if(held){held.g.position.copy(held.home);if(type==='pointerup'&&a)held.drop(a.name);}
        else if(type==='pointerup'&&a&&a===pressed)a.fn?.();
        held=null;pressed=null;pointer=null;showRings(false);
      }
    },{capture:true,signal:listeners.signal});
  }
  return ()=>{listeners.abort();handle?.end();fallback?.traverse(o=>{o.geometry?.dispose();o.material?.map?.dispose();o.material?.dispose();});};
}
export function table(g){box(g,0,.25,0,5.9,.5,4.2,'#bb926b');box(g,0,.51,0,5.95,.09,4.25,'#eedfc4');}
export function tray(g,x,z,w,d,color){box(g,x,.6,z,w,.10,d,color);for(const side of [-1,1])box(g,x+side*w/2,.72,z,.07,.23,d,color);box(g,x,.72,z-d/2,w,.23,.07,color);}
export function seal(g,x,y,z){cyl(g,x,y,z,.17,.10,'#dd794c');}
