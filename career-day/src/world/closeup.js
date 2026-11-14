// 3D 가까이 보기: 일터 안의 물건을 손가락으로 직접 문질러 닦고, 집어서 옮긴다.
// 바리스타의 테이블 닦기처럼 3D 화면 위에서 바로 한다. 무엇을 지을지는 src/world/closeups.js 에 있다.
//
// 쓰는 쪽(src/hands/*.js)은 world.closeup(이름, 알림) 으로 시작하고, 돌려받은 handle.end() 로 끝낸다.
//   알림.onRub(무늬 id, 0~1)   문질러 지운 정도가 바뀔 때
//   알림.canRub(무늬 id)       지금 그 무늬를 문질러도 되는지 (false 면 안 지워지고 onBlocked 를 부른다)
//   알림.onDrop(물건 id)       물건을 목표 자리에 놓았을 때. false 를 돌려주면 제자리로 돌아간다
//   알림.onBlocked(무늬 id)    막힌 곳을 문질렀을 때
import * as T from 'three';
import { CLOSEUPS } from './closeups.js';
import { dispose } from './kit.js';

const ORIGIN = new T.Vector3(0, 0, 26); // 병원 모형과 떨어진 곳에 무대를 세운다

function seeded(n) { let s = n * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

export function makeCloseup({ scene, camera, canvas, hideWorld, view }) {
  let cur = null;
  const ray = new T.Raycaster(), ndc = new T.Vector2();

  function pointerRay(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
  }
  function onPlane(y) {
    const p = new T.Vector3();
    return ray.ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), -(ORIGIN.y + y)), p) ? p.sub(ORIGIN) : null;
  }

  function start(name, on = {}) {
    end();
    const def = CLOSEUPS[name]; if (!def) throw new Error('없는 가까이 보기: ' + name);
    const g = new T.Group(); g.position.copy(ORIGIN); scene.add(g);
    const built = def.build(g);
    // 얼룩(무늬): 작은 점 여러 개. 문지르면 하나씩 사라진다.
    const patches = (built.patches || []).map((pt, k) => {
      const rnd = seeded(k + 3), dots = [];
      const geo = new T.CircleGeometry(pt.dot || 0.11, 14);
      const m = new T.MeshBasicMaterial({ color: pt.color, transparent: true, opacity: pt.opacity ?? 0.75, depthWrite: false });
      for (const blob of pt.blobs) for (let i = 0; i < blob.n; i++) {
        const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * blob.r;
        const mesh = new T.Mesh(geo, m); mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(blob.x + Math.cos(a) * d, pt.y + 0.004 + i * 0.0002, blob.z + Math.sin(a) * d * (blob.squash || 1));
        mesh.scale.setScalar(0.7 + rnd() * 0.6); mesh.renderOrder = 2; g.add(mesh); dots.push({ mesh, clean: false });
      }
      return { ...pt, dots, progress: 0 };
    });
    const movers = (built.movers || []).map((mv) => {
      const ring = new T.Mesh(new T.RingGeometry(mv.r * 0.82, mv.r, 40), new T.MeshBasicMaterial({ color: '#3f9d7d', transparent: true, opacity: 0.85, side: T.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(mv.to[0], mv.ringY ?? mv.y + 0.01, mv.to[1]); ring.visible = false; ring.renderOrder = 3; g.add(ring);
      mv.obj.position.set(mv.from[0], mv.y, mv.from[1]);
      return { ...mv, ring, placed: false };
    });
    cur = { g, on, built, patches, movers, drag: null, t: 0, tool: built.tool || null };
    if (cur.tool) cur.tool.visible = false;
    hideWorld(true);
    view({ focus: ORIGIN.clone().add(new T.Vector3(...(built.focus || [0, 0.4, 0]))), zoom: built.zoom || 3.2, yaw: built.yaw ?? 0, height: built.height ?? 15 });
    canvas.style.touchAction = 'none';
    return { end, place: (id) => { const m = movers.find((x) => x.id === id); if (m) put(m); } };
  }

  function put(m) {
    m.placed = true; m.ring.visible = false;
    m.obj.position.set(m.to[0], m.restY ?? m.y, m.to[1]);
    m.onPlaced?.(m.obj);
  }

  function end() {
    if (!cur) return;
    scene.remove(cur.g); dispose(cur.g); cur = null;
    hideWorld(false); canvas.style.touchAction = '';
  }

  function rubAt(p) {
    for (const pt of cur.patches) {
      if (pt.progress >= 1) continue;
      const near = pt.dots.some((d) => !d.clean && Math.hypot(d.mesh.position.x - p.x, d.mesh.position.z - p.z) < (pt.reach || 0.24));
      if (!near) continue;
      if (cur.on.canRub && !cur.on.canRub(pt.id)) { cur.on.onBlocked?.(pt.id); continue; }
      let changed = false;
      for (const d of pt.dots) if (!d.clean && Math.hypot(d.mesh.position.x - p.x, d.mesh.position.z - p.z) < (pt.reach || 0.24)) { d.clean = true; d.fade = 1; changed = true; }
      if (changed) {
        pt.progress = pt.dots.filter((d) => d.clean).length / pt.dots.length;
        if (pt.progress > 0.94) { pt.dots.forEach((d) => { if (!d.clean) { d.clean = true; d.fade = 1; } }); pt.progress = 1; }
        cur.on.onRub?.(pt.id, pt.progress);
      }
    }
  }

  // 손가락 하나로: 물건 위를 누르면 집어서 옮기고, 아니면 문지른다.
  function down(e) {
    if (!cur) return false;
    pointerRay(e);
    const free = cur.movers.filter((m) => !m.placed);
    const hit = ray.intersectObjects(free.map((m) => m.obj), true)[0];
    if (hit) {
      const m = free.find((x) => { let o = hit.object; while (o) { if (o === x.obj) return true; o = o.parent; } return false; });
      cur.drag = { kind: 'move', m }; m.ring.visible = true; m.obj.position.y = m.y + (m.lift ?? 0.25);
    } else {
      const p = onPlane(cur.built.rubY ?? 0); if (!p) return true;
      cur.drag = { kind: 'rub' }; if (cur.tool) { cur.tool.visible = true; cur.tool.position.set(p.x, cur.built.rubY ?? 0, p.z); } rubAt(p);
    }
    return true;
  }
  function move(e) {
    if (!cur?.drag) return;
    pointerRay(e);
    if (cur.drag.kind === 'move') {
      const m = cur.drag.m, p = onPlane(m.y); if (!p) return;
      m.obj.position.set(Math.max(-2.8, Math.min(2.8, p.x)), m.y + (m.lift ?? 0.25), Math.max(-2, Math.min(2, p.z)));
      const ok = Math.hypot(p.x - m.to[0], p.z - m.to[1]) < m.r;
      m.ring.material.color.set(ok ? '#2f8f6c' : '#3f9d7d'); m.ring.scale.setScalar(ok ? 1.15 : 1);
    } else {
      const p = onPlane(cur.built.rubY ?? 0); if (!p) return;
      if (cur.tool) cur.tool.position.set(p.x, cur.built.rubY ?? 0, p.z);
      rubAt(p);
    }
  }
  function up(cancel) {
    if (!cur?.drag) return;
    const d = cur.drag; cur.drag = null;
    if (cur.tool) cur.tool.visible = false;
    if (d.kind !== 'move') return;
    const m = d.m; m.ring.visible = false; m.ring.scale.setScalar(1);
    const at = m.obj.position;
    if (!cancel && Math.hypot(at.x - m.to[0], at.z - m.to[1]) < m.r && cur.on.onDrop?.(m.id) !== false) put(m);
    else m.obj.position.set(m.from[0], m.y, m.from[1]);
  }

  function tick(dt, t) {
    if (!cur) return;
    cur.t += dt;
    for (const pt of cur.patches) for (const d of pt.dots) if (d.fade > 0) {
      d.fade -= dt * 3; d.mesh.scale.multiplyScalar(0.9);
      if (d.fade <= 0) { d.mesh.visible = false; d.fade = 0; }
    }
    // 집을 수 있는 물건은 살짝 들썩여 눈에 띄게
    for (const m of cur.movers) if (!m.placed && cur.drag?.m !== m) m.obj.position.y = m.y + Math.max(0, Math.sin(t * 3 + m.from[0])) * 0.06;
    cur.built.tick?.(dt, t);
  }

  // 무대 좌표 → 화면 좌표 (실기 검사용)
  function project(x, y, z) {
    const v = new T.Vector3(x, y, z).add(ORIGIN).project(camera), r = canvas.getBoundingClientRect();
    return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
  }
  return { start, end, down, move, up, tick, project, get active() { return !!cur; } };
}
