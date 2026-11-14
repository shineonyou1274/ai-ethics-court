// 일당 계산. 화면 없이 숫자만 다룬다.
// 연봉(만 원, 중앙값) → 시급 → 하루 기본급 + 연장 수당. 모두 세금과 보험료를 떼기 전(세전) 금액이다.

export const MONTH_HOURS = 209; // 주 40시간 일하고 주휴 8시간을 더한 한 달 기준 시간 (근로기준법 계산 관행)
export const MIN_WAGE = { year: 2026, hourly: 10320 }; // 2026년 최저임금 (최저임금위원회 고시)
export const OVERTIME_RATE = 1.5; // 하루 8시간을 넘겨 일하면 시급의 50%를 더 준다 (상시 5명 이상 사업장)

const r10 = (n) => Math.round(n / 10) * 10;

export function hourlyFromAnnual(annualMan) {
  return r10(annualMan * 10000 / 12 / MONTH_HOURS);
}

// 실제로 주는 시급: 자료로 계산한 값이 올해 최저시급보다 낮으면 최저시급을 준다.
// (자료는 몇 년 전 조사라서 그사이 오른 최저임금보다 낮게 나올 수 있다. 최저임금보다 적게 주는 것은 법으로 막혀 있다.)
export function hourlyOf(annualMan) {
  const raw = hourlyFromAnnual(annualMan);
  return { raw, hourly: Math.max(raw, MIN_WAGE.hourly), floored: raw < MIN_WAGE.hourly };
}

// workedMin: 오늘 실제로 일한 시간(분, 쉬는 시간 빼고). shiftMin: 약속된 근무 시간(분)
export function salaryDay(annualMan, workedMin, shiftMin = 480) {
  const { hourly, raw, floored } = hourlyOf(annualMan);
  const baseMin = Math.min(workedMin, shiftMin);
  const overMin = Math.max(0, workedMin - shiftMin);
  const base = r10(hourly * baseMin / 60);
  const overtime = r10(hourly * OVERTIME_RATE * overMin / 60);
  return { hourly, raw, floored, base, overtime, overMin, total: base + overtime };
}

// 일한 시간만큼 지금까지 번 돈 (하루 중간에 보여 주는 용도)
export function earnedSoFar(annualMan, workedMin, shiftMin = 480) {
  return salaryDay(annualMan, workedMin, shiftMin).total;
}

export const won = (n) => `${Math.round(n).toLocaleString('ko-KR')}원`;
export function manwon(n) { // 1234567 → "123만 4,567원"
  n = Math.round(n); const man = Math.floor(n / 10000), rest = n % 10000;
  return man ? `${man.toLocaleString('ko-KR')}만${rest ? ' ' + rest.toLocaleString('ko-KR') : ''}원` : won(n);
}
