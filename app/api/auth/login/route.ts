import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/jwt";
import { loginSchema } from "@/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const { data: user } = await getSupabase()
      .from("users")
      .select("id, tenant_id, email, password_hash, role, is_active")
      .eq("email", email)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: "이메일 또는 비밀번호가 올바르지 않습니다" },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: "비활성화된 계정입니다" },
        { status: 403 }
      );
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "이메일 또는 비밀번호가 올바르지 않습니다" },
        { status: 401 }
      );
    }

    await setSessionCookie({
      userId: user.id,
      tenantId: user.tenant_id,
      role: user.role,
      email: user.email,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
