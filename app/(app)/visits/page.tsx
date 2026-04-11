import { requireAuth } from "@/lib/auth/session";
import { VisitsList } from "./visits-list";

interface VisitsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function VisitsPage({ searchParams }: VisitsPageProps) {
  const session = await requireAuth();
  const params = await searchParams;

  function getString(key: string): string {
    const v = params[key];
    return Array.isArray(v) ? v[0] || "" : v || "";
  }

  return (
    <VisitsList
      role={session.role}
      initialFilters={{
        search: getString("search"),
        status: getString("status"),
        dateFrom: getString("date_from"),
        dateTo: getString("date_to"),
        userId: getString("user_id"),
        facilityType: getString("facility_type"),
      }}
    />
  );
}
