// 저장: 이 기기의 브라우저에만 남긴다. 서버로 보내지 않는다.
const KEY = 'lifeDrama.v3';

export function fresh() {
  return { v: 3, name: '', look: { color: '#ff9f8a', hair: 0 }, now: null, ageBasis: 'man', life: null, title: '', a: {}, at: null, hints: [Math.floor(Math.random() * 6), Math.floor(Math.random() * 6)], seed: Math.floor(Math.random() * 1e9), sound: false };
}

export function valid(x) {
  return !!x && x.v === 3 && typeof x.a === 'object' && x.a !== null && typeof x.look === 'object' && JSON.stringify(x).length < 200000;
}

export function load() {
  try {
    const x = JSON.parse(localStorage.getItem(KEY));
    return valid(x) ? x : null;
  } catch (e) { return null; }
}

export function save(S) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...S, savedAt: new Date().toISOString() })); return true; } catch (e) { return false; }
}

export function clear() {
  try { localStorage.removeItem(KEY); } catch (e) { /* 저장소가 막힌 환경 */ }
}

export function download(name, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
