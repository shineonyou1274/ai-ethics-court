// 일당 계산은 모든 직업체험 앱이 함께 지키는 약속이라 shared/workday.js 에 있다. 여기서는 그대로 다시 내보낸다.
export { MONTH_HOURS, MIN_WAGE, OVERTIME_RATE, hourlyFromAnnual, hourlyOf, salaryDay, won, manwon } from '../../shared/workday.js';

// 일한 시간만큼 지금까지 번 돈 (하루 중간에 보여 주는 용도)
import { salaryDay } from '../../shared/workday.js';
export function earnedSoFar(annualMan, workedMin, shiftMin = 480) {
  return salaryDay(annualMan, workedMin, shiftMin).total;
}
