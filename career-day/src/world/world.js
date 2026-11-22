// 3D 무대: 일터(place) 하나를 받아 장면, 카메라, 내 캐릭터, 반응 효과를 돌린다.
// 3D를 못 쓰는 기기에서는 null을 돌려주고, 화면은 글과 버튼만으로 그대로 돌아간다.
import * as T from 'three';
import { box, label, person, dispose, reduced } from './kit.js';
import { makeCloseup } from './closeup.js';
import { makeNav } from './nav.js';
// 받침이 있으면 '이에요', 없으면 '예요' (703호예요, 대기실이에요)
const copula = (w) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c < 11172 && c % 28 === 0 ? '예요' : '이에요'; };

const BURST = { care: '🫶', team: '🤝', energy: '⚡', tired: '💤', coin: '🪙', star: '✨' };

function emojiTexture(ch) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); g.font = '96px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 64, 72);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}

export function createWorld(canvas, el, place) {
  // 3D를 못 쓰는 기기인지 먼저 조용히 확인한다 (그대로 만들면 three 가 콘솔에 오류를 남긴다)
  const probe = document.createElement('canvas');
  if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return null;
  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true }); }
  catch (e) { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
  renderer.outputColorSpace = T.SRGBColorSpace; renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.setClearColor('#f7f2e9', 0);

  const scene = new T.Scene();
  const camera = new T.OrthographicCamera(-12, 12, 12, -12, 0.1, 120);
  const hemi = new T.HemisphereLight('#fff7e5', '#b5b7b7', 2.4); scene.add(hemi);
  const sun = new T.DirectionalLight('#fff1d1', 3); sun.position.set(-8, 18, 12); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15 }); sun.shadow.normalBias = 0.035; scene.add(sun);

  const { people } = place.build(scene);
  const architecture = scene.children.filter((o) => !o.isLight);
  let player = person({ coat: '#e0a58b', seed: 2 }); player.root.position.set(...place.start); scene.add(player.root);
  const beacon = new T.Mesh(new T.RingGeometry(0.45, 0.55, 32), new T.MeshBasicMaterial({ color: place.color || '#db9273', transparent: true, opacity: 0.7, side: T.DoubleSide })); // 내 자리 표시는 일터 색
  beacon.rotation.x = -Math.PI / 2; beacon.position.y = 0.05; scene.add(beacon);

  // 걸어 다니기 (place.nav 가 있는 일터만, src/flow.js). 갈 곳 표시(바닥 고리 + 3D 위의 이름표)와 누른 곳 표시를 둔다.
  const nav = place.nav ? makeNav(place.nav) : null;
  const ringMesh = (r0, r1, color, opacity) => { const m = new T.Mesh(new T.RingGeometry(r0, r1, 40), new T.MeshBasicMaterial({ color, transparent: true, opacity, side: T.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = 0.06; m.visible = false; m.renderOrder = 3; scene.add(m); return m; };
  const goalRing = ringMesh(0.62, 0.8, '#f2b84b', 0.95), goalDot = ringMesh(0, 0.5, '#f2b84b', 0.28), tapRing = ringMesh(0.22, 0.32, '#263c52', 0.6);
  goalDot.position.y = 0.055;
  const marks = document.createElement('div'); marks.className = 'marks'; marks.hidden = true;
  marks.innerHTML = '<button type="button" class="mark goal"></button><span class="mark me" aria-hidden="true">나</span>';
  el.append(marks);
  const goalChip = marks.querySelector('.goal'), meChip = marks.querySelector('.me');
  let walking = null; // { target: { id, x, z, text }, route: [], arrive: id|null, onArrive, onNote, note }

  let yaw = 0.58, targetYaw = 0.58, zoom = 1, targetZoom = 1, night = 0, targetNight = 0, height = 23, targetHeight = 23;
  const focus = new T.Vector3(), targetFocus = new T.Vector3(0, 0, 1);
  let setGroup = null, setName = null, here = null, last = 0, visible = true, dead = false;
  const crowd = []; const sprites = [];
  // 가까이 보기(문질러 닦기, 집어 옮기기) 동안에는 병원 모형과 사람들을 감춘다
  const close = makeCloseup({
    scene, camera, canvas,
    hideWorld(on) {
      for (const o of architecture) o.visible = on ? false : !place.sets[setName];
      if (setGroup) setGroup.visible = !on;
      player.root.visible = !on; beacon.visible = !on; for (const p of crowd) p.root.visible = !on;
    },
    // 가까이 보기 무대를 칸에 맞춰 바로 옮긴다 (끄는 도중 화면이 움직이지 않게)
    view(frame) { applyFit(frame, true); },
  });

  function buildSet(name) {
    const isSet = !!place.sets[name];
    for (const o of architecture) o.visible = !isSet;
    if (name === setName) return;
    if (setGroup) { scene.remove(setGroup); dispose(setGroup); }
    setName = name; setGroup = null;
    if (!isSet) return;
    const g = new T.Group(); g.position.set(0, 0, 11); scene.add(g); setGroup = g;
    box(g, 0, -0.18, 0, 5.8, 0.3, 4.8, '#d7c8b3'); box(g, 0, 0, 0, 5.7, 0.06, 4.7, '#fbf5e8');
    box(g, 0, 1.2, -2.3, 5.7, 2.4, 0.12, '#eee3d2'); box(g, -2.8, 0.6, 0, 0.12, 1.2, 4.6, '#e4d6c2');
    label(g, place.sets[name].title, 0, 1.9, -2.21, 3.6, 0.48);
    place.sets[name].build(g);
  }

  // 무대를 칸에 꽉 차게 맞춘다 (shared/DESIGN.md §2-1). frame = { cx, cz, w, d, top, yaw, tilt: [가장 낮은 각, 가장 높은 각] }
  //   가로는 무대의 폭에, 세로는 위쪽 띠(일당) 아래부터 칸 바닥까지에 맞춘다.
  //   칸이 세로로 길어 아래가 비면, 정해 준 범위 안에서 카메라를 더 위에서 내려다보게 해 바닥이 세로를 채우게 한다.
  let lastFit = null;
  function fit(frame) {
    const { cx = 0, cz = 0, w, d, top, yaw: y = 0, tilt = [0.76, 0.76] } = frame;
    const H = el.clientHeight || 1, halfW = camera.right, halfH = camera.top;
    const box = el.getBoundingClientRect(), hud = el.querySelector('#hud'), ctrl = el.querySelector('.ctrl')?.getBoundingClientRect();
    let hudPx = hud && !hud.hidden ? hud.getBoundingClientRect().bottom - box.top + 6 : 0;
    if (ctrl && ctrl.height && ctrl.top - box.top < H / 2) hudPx = Math.max(hudPx, ctrl.bottom - box.top + 6); // 둥근 버튼이 위쪽에 올라와 있으면 그 아래부터 쓴다
    const free = 1 - Math.min(0.34, Math.max(0, hudPx / H)); // 위쪽 띠를 뺀 세로 몫
    const we = w * Math.cos(y) + d * Math.abs(Math.sin(y)), de = d * Math.cos(y) + w * Math.abs(Math.sin(y)); // 돌려 본 무대의 가로와 깊이
    const zoomW = halfW / (we / 2 + 0.12);
    const span = (e) => de * Math.sin(e) + top * Math.cos(e) + 0.2, zoomH = (e) => 2 * halfH * free / span(e);
    let e = tilt[0]; while (e < tilt[1] && zoomH(e) > zoomW) e = Math.min(tilt[1], e + 0.035);
    const z = Math.min(zoomW, zoomH(e)), shown = 2 * halfH / z;
    const back = (top * Math.cos(e) / 2 + (1 - free) * shown / 2) / Math.sin(e); // 무대가 위쪽 띠 아래 가운데에 오도록 보는 곳을 뒤로 민다
    return { focus: new T.Vector3(cx - Math.sin(y) * back, 0, cz - Math.cos(y) * back), zoom: z, yaw: y, height: 24 * Math.tan(e) };
  }
  function applyFit(frame, snap) {
    lastFit = frame; const f = fit(frame);
    targetFocus.copy(f.focus); targetZoom = f.zoom; targetYaw = f.yaw; targetHeight = f.height;
    if (snap) { focus.copy(f.focus); zoom = f.zoom; yaw = f.yaw; height = f.height; }
  }

  function resize() {
    const w = el.clientWidth || 1, h = el.clientHeight || 1; renderer.setSize(w, h, false);
    const aspect = w / h; let halfW = 12.8; if (aspect < 0.9) halfW = 11.7; const halfH = halfW / aspect;
    camera.left = -halfW; camera.right = halfW; camera.top = halfH; camera.bottom = -halfH; camera.updateProjectionMatrix();
    if (ready && lastFit) applyFit(lastFit, true); // 칸 크기가 바뀌면 무대도 다시 맞춘다
    if (ready) { place3d(); renderer.render(scene, camera); } // 크기를 바꾸면 그림이 지워진다. 바로 다시 그려서 빈 화면이 보이지 않게 한다
  }
  let ready = false; const ro = new ResizeObserver(resize); ro.observe(el); resize(); ready = true;

  function place3d() {
    camera.position.set(focus.x + Math.sin(yaw) * 24, height + focus.y, focus.z + Math.cos(yaw) * 24);
    camera.lookAt(focus.x, focus.y, focus.z); camera.zoom = zoom; camera.updateProjectionMatrix();
  }
  function animate(now) {
    if (dead) return;
    requestAnimationFrame(animate);
    if (!visible || now - last < 32) return;
    const dt = Math.min(0.25, (now - last) / 1000); last = now; const t = now / 1000;
    yaw += (targetYaw - yaw) * 0.08; zoom += (targetZoom - zoom) * 0.08; focus.lerp(targetFocus, 0.07); night += (targetNight - night) * 0.03; height += (targetHeight - height) * 0.08;
    place3d();
    sun.color.setRGB(1, 1 - night * 0.22, 0.85 - night * 0.2); hemi.intensity = 2.4 - night * 0.75;
    const moving = !!walking?.route.length;
    if (moving) stepWalk(dt);
    player.update(t, moving); for (const p of people) p.update(t, false); for (const p of crowd) p.update(t, false);
    if (walking) { const k = reduced ? 1 : 1 + Math.sin(t * Math.PI) * 0.06; goalRing.scale.setScalar(k); } // 2초에 한 번 부드럽게
    beacon.position.x = player.root.position.x; beacon.position.z = player.root.position.z; beacon.scale.setScalar(1 + Math.sin(t * 2) * 0.08);
    for (let i = sprites.length - 1; i >= 0; i--) {
      const s = sprites[i]; s.life -= dt;
      s.obj.position.y += dt * s.vy; s.obj.position.x += dt * s.vx; s.obj.material.opacity = Math.min(1, s.life * 1.5);
      if (s.life <= 0) { scene.remove(s.obj); s.obj.material.dispose(); sprites.splice(i, 1); }
    }
    close.tick(dt, t);
    renderer.render(scene, camera);
    if (walking) placeMarks();
  }

  // ── 걸어 다니기 ──
  const SPEED = 4.2; // 초당 걷는 거리 (일터 한쪽 끝에서 다른 쪽 끝까지 4초쯤)
  function stepWalk(dt) {
    let left = SPEED * dt;
    while (left > 0 && walking.route.length) {
      const p = walking.route[0], pos = player.root.position, dx = p.x - pos.x, dz = p.z - pos.z, d = Math.hypot(dx, dz);
      if (d > 0.001) player.root.rotation.y = Math.atan2(dx, dz);
      if (d <= left) { pos.x = p.x; pos.z = p.z; walking.route.shift(); left -= d; } else { pos.x += dx / d * left; pos.z += dz / d * left; left = 0; }
    }
    if (!walking.route.length) arrived();
  }
  function arrived() {
    tapRing.visible = false;
    const w = walking, pos = player.root.position; w.onMove?.(false);
    if (w.target && (w.arrive === w.target.id || Math.hypot(pos.x - w.target.x, pos.z - w.target.z) < 1.0)) {
      player.root.rotation.y = 0.15; w.onArrive?.(w.target.id); return;
    }
    if (w.note) { w.onNote?.(w.note); w.note = null; }
  }
  function walkTo(pt, arrive = null, note = null) {
    if (!walking || !nav) return false;
    const from = player.root.position, route = nav.path({ x: from.x, z: from.z }, pt);
    if (!route) { walking.onNote?.('그곳으로는 갈 수 없어요. 가까운 바닥을 눌러 보세요.'); return false; }
    walking.route = route; walking.arrive = arrive; walking.note = note;
    const end = route[route.length - 1] || pt;
    tapRing.position.set(end.x, 0.065, end.z); tapRing.visible = !arrive; // 갈 곳 고리가 이미 있으면 누른 곳 표시는 따로 두지 않는다
    walking.onMove?.(true);
    if (!route.length) arrived();
    return true;
  }
  const goTarget = () => { if (walking?.target) walkTo(walking.target, walking.target.id); };
  goalChip.addEventListener('click', goTarget);
  // 바닥을 누르면: 갈 곳 가까이면 그곳으로, 다른 방이면 그 방 앞으로("여기는 ○○이에요"), 빈 바닥이면 그 자리로 걸어간다
  const ray = new T.Raycaster(), ndc = new T.Vector2();
  function tap(e) {
    const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera); const p = new T.Vector3();
    if (!ray.ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), 0), p)) return;
    const tg = walking.target;
    if (tg && Math.hypot(p.x - tg.x, p.z - tg.z) < 1.7) return goTarget();
    const room = place.rooms.find((rm) => Math.abs(p.x - rm.x) < rm.w / 2 && Math.abs(p.z - rm.z) < rm.d / 2);
    if (tg && room && tg.room === room.id) return goTarget();
    const spot = room && place.nav.spots[room.id];
    if (spot) return walkTo(spot, null, `여기는 ${room.name}${copula(room.name)}.${tg ? ` 지금 할 일은 ${tg.name}에 있어요.` : ''}`);
    walkTo({ x: p.x, z: p.z });
  }
  // 이름표를 3D 자리 위에 붙인다. 칸 밖이나 위쪽 띠 밑으로 숨지 않게 안쪽으로 당긴다
  function placeMarks() {
    const box = el.getBoundingClientRect(), W = box.width, H = box.height;
    const hud = el.querySelector('#hud'), top = hud && !hud.hidden ? hud.getBoundingClientRect().bottom - box.top + 6 : 6;
    const at = (x, y, z, chip) => {
      const v = new T.Vector3(x, y, z).project(camera), cw = chip.offsetWidth, ch = chip.offsetHeight;
      const sx = Math.max(cw / 2 + 6, Math.min(W - cw / 2 - 6, (v.x + 1) / 2 * W)), sy = Math.max(top + ch, Math.min(H - 6, (1 - v.y) / 2 * H));
      chip.style.transform = `translate(${Math.round(sx - cw / 2)}px, ${Math.round(sy - ch)}px)`;
      return { l: sx - cw / 2, r: sx + cw / 2, t: sy - ch, b: sy };
    };
    const g = walking.target ? at(walking.target.x, 2.3, walking.target.z, goalChip) : null;
    // '나' 이름표는 늘 보이게: 머리 위가 갈 곳 이름표와 겹치면 발밑으로, 그래도 겹치면 갈 곳 이름표의 옆으로 옮긴다
    const pp = player.root.position, hit = (m) => g && m.l < g.r + 4 && m.r > g.l - 4 && m.t < g.b + 4 && m.b > g.t - 4;
    let m = at(pp.x, 2.45, pp.z, meChip);
    if (hit(m)) { // 발밑 바로 아래에 (이름표 위쪽 끝을 발에 맞춘다)
      const v = new T.Vector3(pp.x, 0, pp.z).project(camera), cw = meChip.offsetWidth, ch = meChip.offsetHeight;
      const sx = Math.max(cw / 2 + 6, Math.min(W - cw / 2 - 6, (v.x + 1) / 2 * W)), sy = Math.min(H - ch - 6, (1 - v.y) / 2 * H + 3);
      meChip.style.transform = `translate(${Math.round(sx - cw / 2)}px, ${Math.round(sy)}px)`; m = { l: sx - cw / 2, r: sx + cw / 2, t: sy, b: sy + ch };
    }
    if (hit(m)) { const cw = meChip.offsetWidth, ch = meChip.offsetHeight, left = g.l - cw - 8 >= 6, sx = left ? g.l - cw - 8 : Math.min(W - cw - 6, g.r + 8), sy = Math.max(top, Math.min(H - ch - 6, m.t)); meChip.style.transform = `translate(${Math.round(sx)}px, ${Math.round(sy)}px)`; }
  }
  function endWalk() {
    if (!walking) return;
    walking = null; marks.hidden = true; goalRing.visible = goalDot.visible = tapRing.visible = false;
  }
  requestAnimationFrame(animate);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; last = performance.now(); });

  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (drag) return;
    canvas.setPointerCapture(e.pointerId);
    if (close.active) { if (close.down(e)) { e.preventDefault(); drag = { id: e.pointerId, close: true }; } return; }
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, yaw: targetYaw, moved: false };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    if (drag.close) close.move(e);
    else {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 10) drag.moved = true;
      if (drag.moved || !walking) targetYaw = Math.max(-1.1, Math.min(1.25, drag.yaw + (e.clientX - drag.x) * 0.004)); // 걷는 동안에는 살짝 누른 손떨림으로 화면이 돌지 않게
    }
  });
  const release = (e, cancel) => {
    if (!drag || drag.id !== e.pointerId) return;
    if (drag.close) close.up(cancel);
    else if (!cancel && walking && !drag.moved) tap(e); // 끌지 않고 누르기만 했으면 그곳으로 걸어간다
    drag = null;
  };
  canvas.addEventListener('pointerup', (e) => release(e, false)); canvas.addEventListener('pointercancel', (e) => release(e, true));

  const texCache = {};
  return {
    resize, // 칸 크기가 바뀐 직후 바로 맞춰 그릴 때 (보통은 저절로 맞춘다)
    rotate(d) { targetYaw = Math.max(-1.1, Math.min(1.25, targetYaw + d * 0.25)); },
    zoom(d) { targetZoom = Math.max(0.75, Math.min(2.6, targetZoom + d * 0.15)); },
    // 내 캐릭터 옷 바꾸기. dress: casual 이면 사복, 아니면 직업의 근무복
    dress(look, dress = 'work') {
      const pos = player.root.position.clone(), rot = player.root.rotation.y;
      scene.remove(player.root); dispose(player.root);
      player = person(dress === 'casual' ? { coat: '#e0a58b', seed: 2, hair: look?.hair || 0 } : { coat: look.coat, hair: look.hair || 0, outfit: look.outfit, seed: 2 });
      player.root.position.copy(pos); player.root.rotation.y = rot; scene.add(player.root);
    },
    // 장면 바꾸기: 어느 방에서, 몇 시에. overview 면 일터 전체를 보여 준다.
    stage({ place: rid = 'outside', hour = 8, overview = false }) {
      // 무대가 다른 곳으로 바뀔 때(가까이 보기에서 나올 때, 따로 지은 방과 일터 사이를 오갈 때, 처음 띄울 때)는 카메라를 바로 옮긴다.
      // 멀리 떨어진 두 곳 사이를 미끄러지면 그 사이의 빈 곳이 잠깐 화면에 보이기 때문이다. 같은 일터 안에서 방을 옮길 때만 부드럽게 움직인다.
      const wasClose = close.active, wasSet = !!setGroup, first = here === null;
      close.end(); endWalk(); targetHeight = 23;
      targetNight = Math.max(0, (hour - 13) / 7);
      buildSet(overview ? null : rid); here = rid;
      const room = place.rooms.find((r) => r.id === rid), isSet = !!setGroup;
      const spot = room && place.nav?.spots[room.id]; // 걸어 다니는 일터는 걸어 도착한 자리에 그대로 선다
      const dest = spot ? new T.Vector3(spot.x, 0, spot.z) : room ? new T.Vector3(room.x - 0.65, 0, room.z + 0.8) : isSet ? new T.Vector3(1, 0, 12) : new T.Vector3(...(hour >= 15 ? place.exit : place.start));
      targetFocus.copy(overview ? new T.Vector3(0, 0, 1) : isSet ? new T.Vector3(0, 1, 11) : new T.Vector3(dest.x * 0.85, 0.7, dest.z * 0.85));
      targetZoom = overview ? 1 : isSet ? 2.3 : 1.7; targetYaw = isSet ? 0.35 : 0.3; lastFit = null;
      // 일터 전체와 따로 지은 방은 칸에 꽉 차게 맞춘다. 일터 안의 방은 그 방 쪽으로 다가가 보여 준다(맞추지 않는다).
      // 출입구 앞(명찰, 명세서, 돌아보기)도 일터 전체를 칸에 맞춰 보여 준다. 한쪽 구석으로 다가가면 칸 아래가 빈다.
      if (overview || (!room && !isSet)) applyFit({ cx: 0, cz: 0.6, w: 18.4, d: 13.6, top: 3, yaw: targetYaw }, false);
      else if (isSet) applyFit({ cx: 0, cz: 11, w: 6.1, d: 5, top: 2.5, yaw: 0.35 }, false);
      if (reduced || first || wasClose || wasSet !== isSet) { focus.copy(targetFocus); zoom = targetZoom; yaw = targetYaw; height = targetHeight; if (first) night = targetNight; }
      player.root.position.copy(dest); player.root.rotation.y = 0.15;
      this.crowd(crowd.length);
      place3d(); renderer.render(scene, camera); // 바꾼 그 자리에서 바로 한 번 그린다 (다음 차례까지 앞 장면이나 빈 화면이 남지 않게)
    },
    action(kind) { player.act(kind); },
    // 걸어 다니기 시작: 일터 전체를 보여 주고, 내 캐릭터를 from 에 세우고, 갈 곳(target)에 표시를 띄운다.
    //   target = { id, x, z, name, what, room }  name 은 장소 이름, what 은 그곳에서 할 일(이름표 둘째 줄), room 은 그 자리가 있는 방
    //   onArrive(id) 갈 곳에 닿았을 때, onNote(글) 다른 곳에 닿았거나 못 갈 때의 한마디, onMove(걷는 중인지) 걷기 시작·멈춤
    // 돌려주는 go() 는 갈 곳으로 걸어가게 한다(아래 칸의 큰 버튼). 이미 가까우면 바로 닿는다.
    walk({ hour = 9, from, target = null, onArrive, onNote, onMove }) {
      if (!nav) return null;
      const wasClose = close.active, wasSet = !!setGroup, first = here === null;
      close.end(); endWalk(); buildSet(null); here = 'walk';
      targetNight = Math.max(0, (hour - 13) / 7);
      this.crowd(0);
      if (from) { player.root.position.set(from.x, 0, from.z); player.root.rotation.y = 0.15; }
      targetHeight = 23; applyFit(place.nav.frame || { cx: 0, cz: 0.6, w: 18.4, d: 13.6, top: 3, yaw: 0.3 }, false);
      if (reduced || first || wasClose || wasSet) { focus.copy(targetFocus); zoom = targetZoom; yaw = targetYaw; height = targetHeight; if (first) night = targetNight; }
      walking = { target, route: [], arrive: null, onArrive, onNote, onMove, note: null };
      marks.hidden = false; goalChip.hidden = !target;
      if (target) { const b = document.createElement('b'), sm = document.createElement('small'); b.textContent = '📍 ' + target.name; sm.textContent = target.what || ''; goalChip.replaceChildren(b, sm); sm.hidden = !target.what; goalChip.setAttribute('aria-label', `${target.name}${target.what ? ' · ' + target.what : ''} · 누르면 걸어가요`); goalRing.position.set(target.x, 0.06, target.z); goalDot.position.set(target.x, 0.055, target.z); }
      goalRing.visible = goalDot.visible = !!target;
      place3d(); renderer.render(scene, camera); placeMarks();
      return { go: goTarget, walking: () => !!walking?.route.length };
    },
    // 3D 자리 → 화면 좌표 (실기 검사용: 바닥을 누를 곳을 찾는다)
    project(x, y, z) { const v = new T.Vector3(x, y, z).project(camera), r = canvas.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; },
    where() { const p = player.root.position; return { x: p.x, z: p.z }; },
    // 반응 효과: 내 캐릭터 머리 위로 그림 글자가 떠오른다.
    burst(kind, n = 4) {
      if (reduced) n = Math.min(n, 1);
      const ch = BURST[kind] || kind; texCache[ch] ||= emojiTexture(ch);
      for (let i = 0; i < n; i++) {
        const obj = new T.Sprite(new T.SpriteMaterial({ map: texCache[ch], transparent: true }));
        obj.scale.setScalar(0.7); obj.position.copy(player.root.position).add(new T.Vector3((Math.random() - 0.5) * 1.2, 2.4 + Math.random() * 0.4, (Math.random() - 0.5) * 0.6));
        scene.add(obj); sprites.push({ obj, life: 1.6 + Math.random() * 0.6, vy: 0.8 + Math.random() * 0.5, vx: (Math.random() - 0.5) * 0.3 });
      }
    },
    // 기다리는 사람: 일이 밀리면 내 곁에 줄이 생긴다.
    crowd(n) {
      while (crowd.length) { const p = crowd.pop(); scene.remove(p.root); dispose(p.root); }
      const base = player.root.position;
      // 걸어 다니는 일터에서는 벽이나 가구를 뚫고 서지 않게, 막히지 않고 나와 사이에 벽이 없는 자리에만 세운다.
      // 내 캐릭터를 가리지 않게 한 걸음 넘게 떨어져 서고, 카메라와 나 사이(바로 앞)에는 세우지 않는다. 가까운 자리부터 채운다.
      const spots = [], inStation = !!nav && !setGroup;
      if (inStation) {
        const seen = (x, z) => { for (let k = 1; k <= 8; k++) { const t = k / 8; if (nav.blocked(base.x + (x - base.x) * t, base.z + (z - base.z) * t)) return false; } return true; };
        for (let r = 1.5; r <= 4.3 && spots.length < 5; r += 0.4) for (let a = 0; a < 18 && spots.length < 5; a++) {
          const th = a / 18 * Math.PI * 2, x = base.x + Math.cos(th) * r, z = base.z - Math.sin(th) * r * 0.75;
          if (z - base.z > 0.3 && Math.abs(x - base.x) < 1.4) continue;
          if (!seen(x, z) || spots.some(([sx, sz]) => Math.hypot(sx - x, sz - z) < 0.85)) continue;
          spots.push([x, z, Math.atan2(base.x - x, base.z - z)]); // 나를 바라보고 선다
        }
      }
      for (let i = 0; i < Math.min(5, n); i++) {
        if (inStation && !spots[i]) break;
        const p = person({ coat: ['#c9b6d6', '#a9c7b9', '#e3c39b', '#b5c4dc', '#e2b2a8'][i], seed: i + 4, hair: i % 3 });
        const [x, z, ry] = inStation ? spots[i] : [base.x + 1.1 + i * 0.75, base.z + 0.9 + (i % 2) * 0.2, -1.9];
        p.root.position.set(x, 0, z); p.root.rotation.y = ry; p.root.scale.setScalar(0.92);
        scene.add(p.root); crowd.push(p);
      }
    },
    snapshot() { return canvas.toDataURL('image/png'); },
    // 가까이 보기 시작. 돌려받은 handle.end() 로 끝내고 원래 장면으로 돌아간다.
    closeup(name, on) { return close.start(name, on); },
    closeEnd() { close.end(); },
    closeProject(x, y, z) { return close.project(x, y, z); },
    // 다른 일터로 옮길 때: 그리기를 멈추고 3D 자원을 돌려준다 (일터마다 무대를 새로 짓기 때문)
    destroy() { dead = true; close.end(); endWalk(); marks.remove(); ro.disconnect(); dispose(scene); renderer.dispose(); renderer.forceContextLoss?.(); },
  };
}
