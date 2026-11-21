// 가까이 보기의 수명은 엔진이 관리한다. 현재 장면의 처방·서류 자료로 한 번만 무대를 짓는다.
export const departmentBenches = {};
export function mountBench(world, name, build) {
  departmentBenches[name].build = build;
  try { return world.closeup(name, {}); }
  finally { delete departmentBenches[name].build; }
}
for (const name of ['rxcheck','rxhandoff','paperwork','adminroute','physiopath']) departmentBenches[name] = {};
