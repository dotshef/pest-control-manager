export type FacilityCategoryId = "home" | "business" | "mandatory";

export interface FacilityCategory {
  id: FacilityCategoryId;
  label: string;
}

export const FACILITY_CATEGORIES: readonly FacilityCategory[] = [
  { id: "home", label: "가정" },
  { id: "business", label: "사업장" },
  { id: "mandatory", label: "의무소독시설" },
] as const;

export const FACILITY_CATEGORY_IDS = FACILITY_CATEGORIES.map((c) => c.id);

const FACILITY_CATEGORY_MAP = new Map(
  FACILITY_CATEGORIES.map((c) => [c.id, c]),
);

export function getFacilityCategoryLabel(id: string | null | undefined): string {
  if (!id) return "-";
  return FACILITY_CATEGORY_MAP.get(id as FacilityCategoryId)?.label ?? id;
}
