import { FACILITY_TYPE_MAP, type FacilityTypeId } from "@/lib/constants/facility-types";
import { getFacilityCategoryLabel } from "@/lib/constants/facility-category";

interface ClientLike {
  facility_category: string | null | undefined;
  facility_type: string | null | undefined;
}

export function getClientFacilityLabel(client: ClientLike | null | undefined): string {
  if (!client) return "-";

  if (client.facility_category === "mandatory" && client.facility_type) {
    const ft = FACILITY_TYPE_MAP.get(client.facility_type as FacilityTypeId);
    return ft?.label ?? client.facility_type;
  }

  return getFacilityCategoryLabel(client.facility_category);
}
