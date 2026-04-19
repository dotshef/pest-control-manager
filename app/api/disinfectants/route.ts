import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/jwt";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();

  const { data } = await supabase
    .from("disinfectants")
    .select("id, name")
    .eq("tenant_id", session.tenantId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json(data || []);
}
