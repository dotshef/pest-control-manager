import { getSupabase } from "@/lib/supabase/server";

/**
 * 방문 코드 채번: `VYYYYMMDD-NNN` 형식
 *
 * - 날짜 prefix는 `scheduled_date`(방문 예정일) 기준
 * - 시퀀스는 tenant 내에서 해당 날짜 prefix 범위의 기존 건수 + 1
 * - 3자리 zero-pad (일일 최대 999건)
 *
 * 동시성: 증명서 채번과 동일하게 count 기반이라 같은 tenant 내 동시 생성 시
 * race condition 가능. `(tenant_id, visit_code)` UNIQUE 제약이 최종 방어선.
 */
export async function generateVisitCode(
  tenantId: string,
  scheduledDate: string
): Promise<string> {
  const supabase = getSupabase();
  const datePrefix = scheduledDate.replace(/-/g, "");

  const { count } = await supabase
    .from("visits")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .like("visit_code", `V${datePrefix}-%`);

  const seq = String((count || 0) + 1).padStart(3, "0");
  return `V${datePrefix}-${seq}`;
}
