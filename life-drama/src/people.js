// 사람과 반려동물. 도형 몇 개로 빚고, 나이에 따라 키·머리 비율·머리색이 달라진다.
import * as THREE from 'three';

const SKIN = '#f8d5bd';
const HAIR = '#3f3545';
const GRAY = '#ecebf2';
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (x, a, b) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

function heightOf(age) {
  if (age < 3) return lerp(0.42, 0.55, age / 3);
  if (age < 8) return lerp(0.55, 0.72, (age - 3) / 5);
  if (age < 13) return lerp(0.72, 0.88, (age - 8) / 5);
  if (age < 18) return lerp(0.88, 1, (age - 13) / 5);
  if (age < 65) return 1;
  return lerp(1, 0.93, smooth(age, 65, 90));
}

export { heightOf };

export function makeLabel(text) {
  const c = document.createElement('canvas');
  c.height = 80;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
  sprite.renderOrder = 5;
  const FONT = '700 34px "Gowun Dodum", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  const draw = (t) => {
    // 글이 길면 이름표도 길어진다. 열여섯 자를 넘으면 줄임표를 붙인다.
    let str = String(t);
    if (str.length > 16) str = str.slice(0, 15) + '…';
    let x = c.getContext('2d');
    x.font = FONT;
    const w = Math.ceil(x.measureText(str).width) + 48;
    c.width = w + 8; // 크기를 바꾸면 그림판이 비워진다
    x = c.getContext('2d');
    x.font = FONT;
    x.fillStyle = 'rgba(255,253,248,.93)';
    x.beginPath(); x.roundRect(4, 10, w, 60, 30); x.fill();
    x.fillStyle = '#4a4458'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(str, c.width / 2, 42);
    tex.dispose(); // 크기가 달라졌으니 새로 올린다
    tex.needsUpdate = true;
    sprite.scale.set(0.45 * (c.width / 80), 0.45, 1);
  };
  draw(text);
  return { sprite, draw, dispose: () => { tex.dispose(); sprite.material.dispose(); } };
}

const SHADOW_GEO = new THREE.CircleGeometry(0.5, 16).rotateX(-Math.PI / 2);

export function makePerson({ color = '#ff9f8a', hair = 0, label = '' } = {}) {
  const root = new THREE.Group(); // 위치·방향
  const body = new THREE.Group(); // 키·기울기
  root.add(body);
  const mats = [];
  const mat = (c) => { const m = new THREE.MeshLambertMaterial({ color: c }); mats.push(m); return m; };
  const mOutfit = mat(color), mSkin = mat(SKIN), mHair = mat(HAIR), mPants = mat('#66739a'), mDark = mat('#3b3340'), mCheek = mat('#ffb0a8');
  const add = (geo, m, x, y, z, parent = body) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); parent.add(o); return o; };

  const legGeo = new THREE.CapsuleGeometry(0.11, 0.5, 3, 8);
  const armGeo = new THREE.CapsuleGeometry(0.085, 0.42, 3, 8);
  const limb = (geo, m, x, y, len) => { const p = new THREE.Group(); p.position.set(x, y, 0); body.add(p); add(geo, m, 0, -len / 2, 0, p); return p; };
  const legL = limb(legGeo, mPants, -0.14, 0.78, 0.66);
  const legR = limb(legGeo, mPants, 0.14, 0.78, 0.66);
  add(new THREE.CapsuleGeometry(0.27, 0.42, 4, 12), mOutfit, 0, 1.1, 0);
  const armL = limb(armGeo, mOutfit, -0.36, 1.4, 0.56);
  const armR = limb(armGeo, mOutfit, 0.36, 1.4, 0.56);
  add(new THREE.SphereGeometry(0.07, 8, 6), mSkin, 0, -0.56, 0, armL);
  add(new THREE.SphereGeometry(0.07, 8, 6), mSkin, 0, -0.56, 0, armR);

  const head = new THREE.Group();
  head.position.set(0, 1.84, 0);
  body.add(head);
  add(new THREE.SphereGeometry(0.31, 18, 14), mSkin, 0, 0, 0, head);
  add(new THREE.SphereGeometry(0.036, 8, 6), mDark, -0.11, 0.0, -0.29, head);
  add(new THREE.SphereGeometry(0.036, 8, 6), mDark, 0.11, 0.0, -0.29, head);
  add(new THREE.SphereGeometry(0.05, 8, 6), mCheek, -0.19, -0.09, -0.24, head).scale.set(1, 0.6, 0.5);
  add(new THREE.SphereGeometry(0.05, 8, 6), mCheek, 0.19, -0.09, -0.24, head).scale.set(1, 0.6, 0.5);
  const hairG = new THREE.Group();
  head.add(hairG);
  const setHair = (style) => {
    hairG.clear();
    const cap = add(new THREE.SphereGeometry(0.335, 16, 12), mHair, 0, 0.07, 0.06, hairG);
    cap.scale.set(1, 0.92, 1);
    if (style === 1) { add(new THREE.SphereGeometry(0.33, 14, 10), mHair, 0, -0.1, 0.13, hairG).scale.set(1.08, 0.95, 0.85); }
    if (style === 2) { add(new THREE.SphereGeometry(0.14, 10, 8), mHair, 0, 0.12, 0.4, hairG); add(new THREE.SphereGeometry(0.1, 8, 6), mHair, 0, -0.08, 0.48, hairG); }
    if (style === 3) { add(new THREE.SphereGeometry(0.13, 10, 8), mHair, -0.3, 0.22, 0.05, hairG); add(new THREE.SphereGeometry(0.13, 10, 8), mHair, 0.3, 0.22, 0.05, hairG); }
  };
  setHair(hair);

  const cane = add(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 5), mat('#9c7a5b'), 0.02, -0.72, -0.12, armR);
  cane.visible = false;

  // 우산: 비 오는 장면에서만 편다
  const umb = new THREE.Group();
  const mUmb = mat('#ffd166');
  add(new THREE.ConeGeometry(0.95, 0.38, 10), mUmb, 0, 2.75, 0, umb);
  add(new THREE.CylinderGeometry(0.02, 0.02, 1.3, 5), mDark, 0.3, 2.1, -0.05, umb);
  umb.visible = false;
  body.add(umb);

  const shadow = new THREE.Mesh(SHADOW_GEO, new THREE.MeshBasicMaterial({ color: '#2b2440', transparent: true, opacity: 0.16, depthWrite: false }));
  shadow.position.y = 0.09;
  root.add(shadow);

  let lab = null;
  const setLabel = (t) => {
    if (!t) { if (lab) lab.sprite.visible = false; return; }
    if (!lab) { lab = makeLabel(t); root.add(lab.sprite); lab.sprite.position.y = 2.25 * heightOf(age) + 0.45; } else lab.draw(t);
    lab.sprite.visible = true;
  };

  const hairBase = new THREE.Color(HAIR), hairGray = new THREE.Color(GRAY);
  let age = 20, phase = Math.random() * 6, walkAmt = 0, waveAmt = 0, opacity = 1, lean = 0;
  setLabel(label);

  const me = {
    group: root, age,
    walking: false, waving: false, umbrella: false,
    setColor(c) { mOutfit.color.set(c); },
    setHair,
    setLabel,
    setAge(a) {
      age = me.age = a;
      const s = heightOf(a);
      body.scale.setScalar(s);
      head.scale.setScalar(lerp(1.42, 1, smooth(a, 0, 17)));
      mHair.color.copy(hairBase).lerp(hairGray, smooth(a, 52, 78));
      lean = -0.13 * smooth(a, 68, 88);
      cane.visible = a >= 74;
      shadow.scale.setScalar(s);
      if (lab) lab.sprite.position.y = 2.25 * s + 0.45;
    },
    setOpacity(o) {
      if (o === opacity) return;
      opacity = o;
      for (const m of mats) { m.transparent = o < 1; m.opacity = o; }
      shadow.material.opacity = 0.16 * o;
      if (lab) lab.sprite.material.opacity = o;
      root.visible = o > 0.01;
    },
    update(dt, t) {
      walkAmt = lerp(walkAmt, me.walking ? 1 : 0, 1 - Math.exp(-dt * 6));
      waveAmt = lerp(waveAmt, me.waving ? 1 : 0, 1 - Math.exp(-dt * 6));
      const slow = lerp(1, 0.72, smooth(age, 60, 88)) * lerp(1.25, 1, smooth(age, 2, 14));
      phase += dt * 7.2 * slow * (0.25 + walkAmt * 0.75);
      const sw = Math.sin(phase) * 0.62 * walkAmt;
      legL.rotation.x = sw; legR.rotation.x = -sw;
      armL.rotation.x = -sw * 0.75;
      armR.rotation.x = lerp(sw * 0.75, 0, Math.max(waveAmt, me.umbrella ? 1 : 0));
      armR.rotation.z = waveAmt * (2.55 + Math.sin(t * 9) * 0.28);
      armL.rotation.z = 0;
      body.position.y = Math.abs(Math.sin(phase)) * 0.05 * walkAmt + Math.sin(t * 1.8 + phase) * 0.008;
      body.rotation.x = lean;
      head.rotation.z = Math.sin(t * 1.3 + phase) * 0.03;
      umb.visible = me.umbrella;
    },
    dispose() {
      root.traverse((o) => { if (o.isMesh && o.geometry !== SHADOW_GEO) o.geometry.dispose(); });
      for (const m of mats) m.dispose();
      shadow.material.dispose();
      if (lab) lab.dispose();
    },
  };
  me.setAge(20);
  return me;
}

export function makePet({ color = '#e8c39e', label = '' } = {}) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const mats = [];
  const mat = (c) => { const m = new THREE.MeshLambertMaterial({ color: c }); mats.push(m); return m; };
  const mFur = mat(color), mDark = mat('#3b3340'), mEar = mat('#c99b72');
  const add = (geo, m, x, y, z, parent = body) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); parent.add(o); return o; };
  const torso = add(new THREE.CapsuleGeometry(0.2, 0.42, 3, 8), mFur, 0, 0.42, 0);
  torso.rotation.x = Math.PI / 2;
  const head = new THREE.Group(); head.position.set(0, 0.66, -0.42); body.add(head);
  add(new THREE.SphereGeometry(0.21, 12, 10), mFur, 0, 0, 0, head);
  add(new THREE.SphereGeometry(0.09, 8, 6), mFur, 0, -0.05, -0.19, head);
  add(new THREE.SphereGeometry(0.035, 6, 5), mDark, 0, -0.03, -0.27, head);
  add(new THREE.SphereGeometry(0.028, 6, 5), mDark, -0.08, 0.06, -0.18, head);
  add(new THREE.SphereGeometry(0.028, 6, 5), mDark, 0.08, 0.06, -0.18, head);
  add(new THREE.SphereGeometry(0.09, 8, 6), mEar, -0.16, 0.13, 0.02, head).scale.set(0.7, 1.3, 0.6);
  add(new THREE.SphereGeometry(0.09, 8, 6), mEar, 0.16, 0.13, 0.02, head).scale.set(0.7, 1.3, 0.6);
  const tail = new THREE.Group(); tail.position.set(0, 0.52, 0.38); body.add(tail);
  add(new THREE.CapsuleGeometry(0.045, 0.2, 2, 6), mFur, 0, 0.14, 0.04, tail);
  const legs = [[-0.12, -0.2], [0.12, -0.2], [-0.12, 0.2], [0.12, 0.2]].map(([x, z]) => {
    const p = new THREE.Group(); p.position.set(x, 0.3, z); body.add(p);
    add(new THREE.CapsuleGeometry(0.055, 0.16, 2, 6), mFur, 0, -0.14, 0, p);
    return p;
  });
  const shadow = new THREE.Mesh(SHADOW_GEO, new THREE.MeshBasicMaterial({ color: '#2b2440', transparent: true, opacity: 0.14, depthWrite: false }));
  shadow.position.y = 0.09; shadow.scale.set(0.7, 1, 1);
  root.add(shadow);
  let lab = null, phase = 0, walkAmt = 0, opacity = 1;
  const me = {
    group: root, age: 5, walking: false, waving: false, umbrella: false,
    setColor() {}, setHair() {},
    setLabel(t) {
      if (!t) { if (lab) lab.sprite.visible = false; return; }
      if (!lab) { lab = makeLabel(t); root.add(lab.sprite); lab.sprite.position.y = 1.45; } else lab.draw(t);
    },
    setAge() {},
    setOpacity(o) {
      if (o === opacity) return; opacity = o;
      for (const m of mats) { m.transparent = o < 1; m.opacity = o; }
      shadow.material.opacity = 0.14 * o;
      if (lab) lab.sprite.material.opacity = o;
      root.visible = o > 0.01;
    },
    update(dt, t) {
      walkAmt = lerp(walkAmt, me.walking ? 1 : 0, 1 - Math.exp(-dt * 6));
      phase += dt * 13 * (0.2 + walkAmt * 0.8);
      const sw = Math.sin(phase) * 0.6 * walkAmt;
      legs[0].rotation.x = sw; legs[3].rotation.x = sw; legs[1].rotation.x = -sw; legs[2].rotation.x = -sw;
      body.position.y = Math.abs(Math.sin(phase)) * 0.04 * walkAmt;
      tail.rotation.z = Math.sin(t * 11) * (me.waving ? 0.9 : 0.45);
      head.rotation.z = Math.sin(t * 1.7) * 0.08;
    },
    dispose() {
      root.traverse((o) => { if (o.isMesh && o.geometry !== SHADOW_GEO) o.geometry.dispose(); });
      for (const m of mats) m.dispose();
      shadow.material.dispose();
      if (lab) lab.dispose();
    },
  };
  me.setLabel(label);
  return me;
}
