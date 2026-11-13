// 3D 무대: 일터(place) 하나를 받아 장면, 카메라, 내 캐릭터, 반응 효과를 돌린다.
// 3D를 못 쓰는 기기에서는 null을 돌려주고, 화면은 글과 버튼만으로 그대로 돌아간다.
import * as T from 'three';
import { box, label, person, dispose, reduced } from './kit.js';

const BURST = { care: '🫶', team: '🤝', energy: '⚡', tired: '💤', coin: '🪙', star: '✨' };

function emojiTexture(ch) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); g.font = '96px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 64, 72);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}

export function createWorld(canvas, el, place) {
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
  const beacon = new T.Mesh(new T.RingGeometry(0.45, 0.55, 32), new T.MeshBasicMaterial({ color: '#db9273', transparent: true, opacity: 0.7, side: T.DoubleSide }));
  beacon.rotation.x = -Math.PI / 2; beacon.position.y = 0.05; scene.add(beacon);

  let yaw = 0.58, targetYaw = 0.58, zoom = 1, targetZoom = 1, night = 0, targetNight = 0;
  const focus = new T.Vector3(), targetFocus = new T.Vector3(0, 0, 1);
  let setGroup = null, setName = null, here = null, last = 0, visible = true;
  const crowd = []; const sprites = [];

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

  function resize() {
    const w = el.clientWidth || 1, h = el.clientHeight || 1; renderer.setSize(w, h, false);
    const aspect = w / h; let halfW = 12.8; if (aspect < 0.9) halfW = 11.7; const halfH = halfW / aspect;
    camera.left = -halfW; camera.right = halfW; camera.top = halfH; camera.bottom = -halfH; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(el); resize();

  function animate(now) {
    requestAnimationFrame(animate);
    if (!visible || now - last < 32) return;
    const dt = Math.min(0.25, (now - last) / 1000); last = now; const t = now / 1000;
    yaw += (targetYaw - yaw) * 0.08; zoom += (targetZoom - zoom) * 0.08; focus.lerp(targetFocus, 0.07); night += (targetNight - night) * 0.03;
    camera.position.set(focus.x + Math.sin(yaw) * 24, 23 + focus.y, focus.z + Math.cos(yaw) * 24);
    camera.lookAt(focus.x, focus.y, focus.z); camera.zoom = zoom; camera.updateProjectionMatrix();
    sun.color.setRGB(1, 1 - night * 0.22, 0.85 - night * 0.2); hemi.intensity = 2.4 - night * 0.75;
    player.update(t, false); for (const p of people) p.update(t, false); for (const p of crowd) p.update(t, false);
    beacon.position.x = player.root.position.x; beacon.position.z = player.root.position.z; beacon.scale.setScalar(1 + Math.sin(t * 2) * 0.08);
    for (let i = sprites.length - 1; i >= 0; i--) {
      const s = sprites[i]; s.life -= dt;
      s.obj.position.y += dt * s.vy; s.obj.position.x += dt * s.vx; s.obj.material.opacity = Math.min(1, s.life * 1.5);
      if (s.life <= 0) { scene.remove(s.obj); s.obj.material.dispose(); sprites.splice(i, 1); }
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; last = performance.now(); });

  let drag = null;
  canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, yaw: targetYaw }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => { if (drag) targetYaw = Math.max(-1.1, Math.min(1.25, drag.yaw + (e.clientX - drag.x) * 0.004)); });
  canvas.addEventListener('pointerup', () => { drag = null; }); canvas.addEventListener('pointercancel', () => { drag = null; });

  const texCache = {};
  return {
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
      targetNight = Math.max(0, (hour - 13) / 7);
      buildSet(overview ? null : rid); here = rid;
      const room = place.rooms.find((r) => r.id === rid), isSet = !!setGroup;
      const dest = room ? new T.Vector3(room.x - 0.65, 0, room.z + 0.8) : isSet ? new T.Vector3(1, 0, 12) : new T.Vector3(...(hour >= 15 ? place.exit : place.start));
      targetFocus.copy(overview ? new T.Vector3(0, 0, 1) : isSet ? new T.Vector3(0, 1, 11) : new T.Vector3(dest.x * 0.85, 0.7, dest.z * 0.85));
      targetZoom = overview ? 1 : isSet ? 2.3 : 1.7; targetYaw = isSet ? 0.35 : 0.3;
      if (reduced) { focus.copy(targetFocus); zoom = targetZoom; yaw = targetYaw; }
      player.root.position.copy(dest); player.root.rotation.y = 0.15;
      this.crowd(crowd.length);
    },
    action(kind) { player.act(kind); },
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
      for (let i = 0; i < Math.min(5, n); i++) {
        const p = person({ coat: ['#c9b6d6', '#a9c7b9', '#e3c39b', '#b5c4dc', '#e2b2a8'][i], seed: i + 4, hair: i % 3 });
        p.root.position.set(base.x + 1.1 + i * 0.75, 0, base.z + 0.9 + (i % 2) * 0.2); p.root.rotation.y = -1.9; p.root.scale.setScalar(0.92);
        scene.add(p.root); crowd.push(p);
      }
    },
    snapshot() { return canvas.toDataURL('image/png'); },
  };
}
