import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/jwt";

// 방문 건 목록 조회 (캘린더 모드 + 목록 모드)
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);

  // 캘린더 모드 파라미터 (기존)
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const date = searchParams.get("date");
  const today = searchParams.get("today");
  const status = searchParams.get("status");

  // 목록 모드 파라미터 (신규)
  const search = searchParams.get("search");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const userIdParam = searchParams.get("user_id");
  const facilityType = searchParams.get("facility_type");
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");

  const supabase = getSupabase();

  // 미완료 건 자동 업데이트 (예정일 경과한 scheduled → missed)
  const todayStr = new Date().toISOString().split("T")[0];
  await supabase
    .from("visits")
    .update({ status: "missed" })
    .eq("tenant_id", session.tenantId)
    .eq("status", "scheduled")
    .lt("scheduled_date", todayStr);

  // 모드 판단: 캘린더 특정 파라미터가 있으면 캘린더 모드, 아니면 목록 모드
  const isCalendarMode = !!(year || month || date || today);

  if (isCalendarMode) {
    // === 캘린더 모드 (기존 동작 유지) ===
    let query = supabase
      .from("visits")
      .select(`
        id, visit_code, scheduled_date, completed_at, status, method, chemicals_used, notes, user_id,
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

  // === 목록 모드 (신규) ===
  const page = Math.max(1, parseInt(pageParam || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(limitParam || "20")));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("visits")
    .select(
      `
      id, visit_code, scheduled_date, completed_at, status, method, chemicals_used, notes, user_id,
      clients!inner(id, name, facility_type, address),
      users(id, name)
    `,
      { count: "exact" }
    )
    .eq("tenant_id", session.tenantId)
    .order("scheduled_date", { ascending: false })
    .range(from, to);

  if (status) query = query.eq("status", status);
  if (dateFrom) query = query.gte("scheduled_date", dateFrom);
  if (dateTo) query = query.lte("scheduled_date", dateTo);
  if (search) query = query.ilike("clients.name", `%${search}%`);
  if (facilityType) query = query.eq("clients.facility_type", facilityType);

  // 역할별 강제 필터:
  // - member: 반드시 본인 담당 건만 (클라이언트 파라미터 무시)
  // - admin: user_id 파라미터 있으면 해당 담당자로 필터
  if (session.role === "member") {
    query = query.eq("user_id", session.userId);
  } else if (userIdParam) {
    query = query.eq("user_id", userIdParam);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const total = count || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return NextResponse.json({
    visits: data || [],
    total,
    page,
    totalPages,
  });
}
