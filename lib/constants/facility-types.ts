export type FacilityTypeId =
  | 'hotel'
  | 'restaurant'
  | 'transport'
  | 'retail'
  | 'hospital'
  | 'cafeteria'
  | 'dormitory'
  | 'theater'
  | 'school'
  | 'academy'
  | 'office'
  | 'childcare'
  | 'apartment'
  | 'etc';

export interface FacilityType {
  id: FacilityTypeId;
  label: string;
  /** 하절기 주기 (월), 4~9월. null이면 법정 주기 없음 */
  cycleSummer: number | null;
  /** 동절기 주기 (월), 10~3월. null이면 법정 주기 없음 */
  cycleWinter: number | null;
}

export const FACILITY_TYPES: readonly FacilityType[] = [
  { id: 'hotel',     label: '숙박업소 (객실 20실 이상)',              cycleSummer: 1, cycleWinter: 2 },
  { id: 'restaurant',label: '식품접객업소 (연면적 300㎡ 이상)',        cycleSummer: 1, cycleWinter: 2 },
  { id: 'transport', label: '여객운송차량 및 대합실',                  cycleSummer: 1, cycleWinter: 2 },
  { id: 'retail',    label: '대형마트/백화점/쇼핑센터',                cycleSummer: 1, cycleWinter: 2 },
  { id: 'hospital',  label: '종합병원/병원/치과/한방병원',             cycleSummer: 1, cycleWinter: 2 },
  { id: 'cafeteria', label: '집단급식소 (100인 이상)',                 cycleSummer: 2, cycleWinter: 3 },
  { id: 'dormitory', label: '기숙사/합숙소 (50인 이상)',               cycleSummer: 2, cycleWinter: 3 },
  { id: 'theater',   label: '공연장 (300석 이상)',                     cycleSummer: 2, cycleWinter: 3 },
  { id: 'school',    label: '학교 (초/중/고/대)',                      cycleSummer: 2, cycleWinter: 3 },
  { id: 'academy',   label: '학원 (연면적 1,000㎡ 이상)',              cycleSummer: 2, cycleWinter: 3 },
  { id: 'office',    label: '사무실용 건축물 (연면적 2,000㎡ 이상)',    cycleSummer: 2, cycleWinter: 3 },
  { id: 'childcare', label: '어린이집/유치원 (50인 이상)',              cycleSummer: 2, cycleWinter: 3 },
  { id: 'apartment', label: '공동주택 (300세대 이상)',                  cycleSummer: 3, cycleWinter: 6 },
  { id: 'etc',       label: '기타',                                    cycleSummer: null, cycleWinter: null },
] as const;

export const FACILITY_TYPE_IDS = FACILITY_TYPES.map((ft) => ft.id);

export const FACILITY_TYPE_MAP = new Map(
  FACILITY_TYPES.map((ft) => [ft.id, ft]),
);

export function getFacilityType(id: FacilityTypeId): FacilityType {
  const ft = FACILITY_TYPE_MAP.get(id);
  if (!ft) throw new Error(`Unknown facility type: ${id}`);
  return ft;
}
