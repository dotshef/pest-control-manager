import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/jwt";

// 방문 건 목록 조회 (월별, 오늘, 상태별)
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const date = searchParams.get("date"); // 특정 날짜
  const status = searchParams.get("status");
  const today = searchParams.get("today"); // "true"이면 오늘 건만

  const supabase = getSupabase();

  // 미완료 건 자동 업데이트 (예정일 경과한 scheduled → missed)
  const todayStr = new Date().toISOString().split("T")[0];
  await supabase
    .from("visits")
    .update({ status: "missed" })
    .eq("tenant_id", session.tenantId)
    .eq("status", "scheduled")
    .lt("scheduled_date", todayStr);

  let query = supabase
    .from("visits")
    .select(`
      id, scheduled_date, completed_at, status, method, chemicals_used, notes, user_id,
      clients(id, name, facility_type, address),
      certificates(id, certificate_number, pdf_url)
    `)
    .eq("tenant_id", session.tenantId)
    .order("scheduled_date", { ascending: true });

  if (today === "true") {
    query = query.eq("scheduled_date", todayStr);
  } else if (date) {
    query = query.eq("scheduled_date", date);
  } else if (year && month) {
    const startDate = `${year}-${month.padStart(2, "0")}-01`;
    const endMonth = parseInt(month);
    const endYear = parseInt(year);
    const nextMonth = endMonth === 12 ? 1 : endMonth + 1;
    const nextYear = endMonth === 12 ? endYear + 1 : endYear;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
    query = query.gte("scheduled_date", startDate).lt("scheduled_date", endDate);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ visits: data || [] });
}
