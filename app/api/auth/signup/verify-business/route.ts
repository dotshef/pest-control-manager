import { NextResponse } from "next/server";
import { z } from "zod";
import { checkBusinessStatus } from "@/lib/business/status";

const schema = z.object({
  businessNumber: z.string().min(1, "사업자등록번호를 입력해주세요"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const result = await checkBusinessStatus(parsed.data.businessNumber);

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      statusCode: result.statusCode,
      statusName: result.statusName,
    });
  } catch (e) {
    console.error("[signup/verify-business] unexpected error:", e);
    return NextResponse.json(
      { error: "사업자번호 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
