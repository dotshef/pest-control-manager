import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/jwt";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = getSupabase();

  await supabase
    .from("disinfectants")
    .update({ is_active: false })
    .eq("id", id)
    .eq("tenant_id", session.tenantId);

  return NextResponse.json({ success: true });
}
