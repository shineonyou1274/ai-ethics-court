// 3D 가까이 보기: 일터 안의 물건을 손가락으로 직접 문질러 닦고, 집어서 옮긴다.
// 바리스타의 테이블 닦기처럼 3D 화면 위에서 바로 한다. 무엇을 지을지는 src/world/closeups.js 에 있다.
//
// 쓰는 쪽(src/hands/*.js)은 world.closeup(이름, 알림) 으로 시작하고, 돌려받은 handle.end() 로 끝낸다.
//   알림.onRub(무늬 id, 0~1)   문질러 지운 정도가 바뀔 때
//   알림.canRub(무늬 id)       지금 그 무늬를 문질러도 되는지 (false 면 안 지워지고 onBlocked 를 부른다)
//   알림.onDrop(물건 id)       물건을 목표 자리에 놓았을 때. false 를 돌려주면 제자리로 돌아간다
//   알림.onBlocked(무늬 id)    막힌 곳을 문질렀을 때
//   알림.onMiss(물건 id, 칸 id) 칸(slots)이 있는 물건을 다른 칸에 놓았을 때. 물건은 제자리로 돌아간다
//   알림.onTap(누를 곳 id)     무대가 준 누를 곳(taps)을 손가락으로 눌렀을 때. true 를 돌려주면 받아들인 것 (무대의 onTap 도 알게 된다)
// 누를 곳(taps): { id, obj } (그 물체를 손가락이 맞히면) 또는 { id, at: [x, z], y, w, d } (그 높이의 네모 안이면).
//   물건보다 나중에, 문지르기보다 먼저 본다. 누른 뒤 손가락을 움직여도 문지르지 않는다. off 를 켜 둔 곳은 지나친다.
// 칸(slots)이 있으면 끄는 동안 빈 칸 모두에 같은 원을 띄워서, 원만 보고는 정답을 알 수 없게 한다.
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
        mesh.position.set(blob.x + Math.cos(a) * d, pt.y + 0.006 + i * 0.0002, blob.z + Math.sin(a) * d * (blob.squash || 1));
        mesh.scale.setScalar(0.7 + rnd() * 0.6); mesh.renderOrder = 2; g.add(mesh); dots.push({ mesh, clean: false }); // 높이는 바닥 선보다 0.005 넘게 띄운다 (겹친 면이 지글거리지 않게)
      }
      return { ...pt, dots, progress: 0 };
    });
    const ringOf = (r, x, y, z) => {
      const ring = new T.Mesh(new T.RingGeometry(r * 0.82, r, 40), new T.MeshBasicMaterial({ color: '#3f9d7d', transparent: true, opacity: 0.85, side: T.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(x, y, z); ring.visible = false; ring.renderOrder = 3; g.add(ring); return ring;
    };
    const slots = (built.slots || []).map((sl) => ({ ...sl, ring: ringOf(sl.r, sl.at[0], sl.y + 0.01, sl.at[1]), filled: false }));
    // 칸이 있는 물건은 칸 높이에서 끈다. 그래야 선반 위를 겨누면 물건도 선반 위로 따라간다.
    for (const mv of built.movers || []) if (mv.slot) { const sl = slots.find((x) => x.id === mv.slot); mv.to = sl.at; mv.r = sl.r; mv.ringY = sl.y + 0.01; mv.dragY ??= sl.y; }
    // 얇은 물건도 손가락으로 잡기 쉽게, 보이지 않는 넉넉한 잡는 상자를 붙인다
    g.updateMatrixWorld(true); // 무대를 방금 지어서 아직 한 번도 그리지 않았다. 자리부터 계산해 두어야 상자가 물건 위에 생긴다
    for (const mv of built.movers || []) {
      mv.obj.updateMatrixWorld(true);
      const bb = new T.Box3().setFromObject(mv.obj), size = bb.getSize(new T.Vector3()), mid = bb.getCenter(new T.Vector3()).sub(mv.obj.getWorldPosition(new T.Vector3()));
      const hit = new T.Mesh(new T.BoxGeometry(Math.max(size.x, 0.5), Math.max(size.y, 0.35), Math.max(size.z, 0.5)), new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      hit.position.copy(mid); mv.obj.add(hit);
    }
    const movers = (built.movers || []).map((mv) => {
      const ring = new T.Mesh(new T.RingGeometry(mv.r * 0.82, mv.r, 40), new T.MeshBasicMaterial({ color: '#3f9d7d', transparent: true, opacity: 0.85, side: T.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(mv.to[0], mv.ringY ?? mv.y + 0.01, mv.to[1]); ring.visible = false; ring.renderOrder = 3; g.add(ring);
      mv.obj.position.set(mv.from[0], mv.y, mv.from[1]);
      return { ...mv, ring, placed: false };
    });
    cur = { g, on, built, patches, movers, slots, drag: null, t: 0, tool: built.tool || null };
    if (cur.tool) cur.tool.visible = false;
    hideWorld(true);
    // 무대(가로 5.8 × 깊이 4.2)를 칸에 꽉 차게 맞춘다. 무대가 frame 을 주면 그 크기로 맞춘다.
    // 칸이 세로로 길면(폰) 카메라가 더 위에서 내려다봐서, 바닥이 칸의 세로를 채운다.
    view({ cx: ORIGIN.x, cz: ORIGIN.z, w: 5.8, d: 4.2, top: 1.4, yaw: 0, tilt: [0.56, 0.9], ...(built.frame || {}) });
    canvas.style.touchAction = 'none';
    return { end, place: (id) => { const m = movers.find((x) => x.id === id); if (m) put(m); } };
  }

  function put(m) {
    m.placed = true; m.ring.visible = false;
    if (m.slot) { const sl = cur.slots.find((x) => x.id === m.slot); sl.filled = true; }
    m.obj.position.set(m.to[0], m.restY ?? m.y, m.to[1]);
    m.onPlaced?.(m.obj);
  }

  function end() {
    if (!cur) return;
    cur.built.stop?.(); // 무대가 따로 켜 둔 것(물 소리 등)을 끈다
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
        cur.built.onRub?.(pt.id, pt.progress, pt.dots); // 무대도 알게 한다 (예: 물이 닿은 자리의 불꽃만 작아진다)
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
      cur.drag = { kind: 'move', m }; m.obj.position.y = (m.dragY ?? m.y) + (m.lift ?? 0.25);
      if (m.slot) cur.slots.forEach((sl) => { sl.ring.visible = !sl.filled; }); else m.ring.visible = true;
    } else if (tapAt()) {
      cur.drag = { kind: 'tap' };
    } else {
      const p = onPlane(cur.built.rubY ?? 0); if (!p) return true;
      cur.drag = { kind: 'rub', last: p }; if (cur.tool) { cur.tool.visible = true; cur.tool.position.set(p.x, cur.built.rubY ?? 0, p.z); } rubAt(p);
    }
    return true;
  }
  // 누를 곳: 손가락 아래(그 높이의 평면)에 있는 누를 곳을 찾아 알린다. 꺼 둔 곳(off)은 지나친다
  function tapAt() {
    for (const tp of cur.built.taps || []) {
      if (tp.off) continue;
      let hit = false;
      if (tp.obj) hit = ray.intersectObject(tp.obj, true).length > 0;
      else { const p = onPlane(tp.y ?? 0); hit = !!p && Math.abs(p.x - tp.at[0]) <= tp.w / 2 && Math.abs(p.z - tp.at[1]) <= tp.d / 2; }
      if (hit) {
        const ok = cur.on.onTap?.(tp.id) === true; cur.built.onTap?.(tp.id, ok); return true;
      }
    }
    return false;
  }
  function move(e) {
    if (!cur?.drag || cur.drag.kind === 'tap') return;
    pointerRay(e);
    if (cur.drag.kind === 'move') {
      const m = cur.drag.m, p = onPlane(m.dragY ?? m.y); if (!p) return;
      m.obj.position.set(Math.max(-2.8, Math.min(2.8, p.x)), (m.dragY ?? m.y) + (m.lift ?? 0.25), Math.max(-2, Math.min(2, p.z)));
      if (m.slot) {
        const near = slotNear(p);
        for (const sl of cur.slots) { sl.ring.material.color.set(sl === near ? '#2f8f6c' : '#3f9d7d'); sl.ring.scale.setScalar(sl === near ? 1.15 : 1); }
      } else {
        const ok = Math.hypot(p.x - m.to[0], p.z - m.to[1]) < m.r;
        m.ring.material.color.set(ok ? '#2f8f6c' : '#3f9d7d'); m.ring.scale.setScalar(ok ? 1.15 : 1);
      }
    } else {
      const p = onPlane(cur.built.rubY ?? 0); if (!p) return;
      if (cur.tool) cur.tool.position.set(p.x, cur.built.rubY ?? 0, p.z);
      // 빠르게 문질러도 지나간 길의 얼룩이 다 지워지게, 앞 점과 이 점 사이를 촘촘히 훑는다
      const a = cur.drag.last || p, n = Math.max(1, Math.ceil(a.distanceTo(p) / 0.08));
      for (let i = 1; i <= n; i++) rubAt(a.clone().lerp(p, i / n));
      cur.drag.last = p;
    }
  }
  function up(cancel) {
    if (!cur?.drag) return;
    const d = cur.drag; cur.drag = null;
    if (cur.tool) cur.tool.visible = false;
    if (d.kind !== 'move') return;
    const m = d.m; m.ring.visible = false; m.ring.scale.setScalar(1);
    const at = m.obj.position, home = () => m.obj.position.set(m.from[0], m.y, m.from[1]);
    if (m.slot) {
      cur.slots.forEach((sl) => { sl.ring.visible = false; sl.ring.scale.setScalar(1); });
      const sl = cancel ? null : slotNear(at);
      if (!sl) return home();
      if (sl.id !== m.slot) { home(); cur.on.onMiss?.(m.id, sl.id); return; }
      if (cur.on.onDrop?.(m.id) !== false) put(m); else home();
      return;
    }
    if (!cancel && Math.hypot(at.x - m.to[0], at.z - m.to[1]) < m.r && cur.on.onDrop?.(m.id) !== false) put(m);
    else home();
  }

  function slotNear(p) {
    let best = null, bd = Infinity;
    for (const sl of cur.slots) { if (sl.filled) continue; const d = Math.hypot(p.x - sl.at[0], p.z - sl.at[1]); if (d < sl.r && d < bd) { best = sl; bd = d; } }
    return best;
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
