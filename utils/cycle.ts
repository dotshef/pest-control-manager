import { getFacilityType, type FacilityTypeId } from "@/constants/facility-types";

/**
 * 현재 월 기준으로 하절기(4~9)/동절기(10~3) 판별 후 주기 반환
 */
export function getCycleMonths(
  facilityTypeId: FacilityTypeId,
  date: Date = new Date()
): number {
  const ft = getFacilityType(facilityTypeId);
  const month = date.getMonth() + 1; // 1~12
  const isSummer = month >= 4 && month <= 9;
  return isSummer ? ft.cycleSummer : ft.cycleWinter;
}
