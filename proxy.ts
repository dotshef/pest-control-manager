import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import type { JwtPayload } from "@/lib/auth/jwt";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const COOKIE_NAME = "session";
const TOKEN_MAX_AGE = 60 * 60 * 24; // 1일

// 시스템 API — proxy 우회 (각자 자체 인증 사용: api/auth는 자체 검증, api/cron은 CRON_SECRET)
const SYSTEM_API_PATHS = ["/api/auth/", "/api/cron/"];

// 공개 페이지 — 미로그인도 접근 가능
const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/install"];

// 관리자 전용 — member 접근 차단
const ADMIN_ONLY_PATHS = ["/clients"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 시스템 API는 즉시 통과
  if (SYSTEM_API_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // 공개 경로 — 로그인 상태면 대시보드로
  if (isPublic) {
    if (token) {
      try {
        await jwtVerify(token, JWT_SECRET);
        if (pathname === "/login" || pathname === "/signup") {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      } catch {
        // 토큰 만료/무효 — 그대로 진행
      }
    }
    return NextResponse.next();
  }

  // 보호 경로 — 미로그인 시 로그인으로
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify<JwtPayload>(token, JWT_SECRET);

    // 관리자 전용 경로 — member 접근 차단
    const isAdminOnly = ADMIN_ONLY_PATHS.some((path) => pathname.startsWith(path));
    if (isAdminOnly && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Sliding session — 활동이 있을 때마다 토큰 재발급
    const newPayload: JwtPayload = {
      userId: payload.userId,
      tenantId: payload.tenantId,
      role: payload.role,
      email: payload.email,
    };
    const newToken = await new SignJWT(newPayload as unknown as Record<string, unknown>)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(JWT_SECRET);

    const response = NextResponse.next();
    response.cookies.set(COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: TOKEN_MAX_AGE,
    });
    return response;
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

// matcher는 정적 자산만 거름 — 그 외 분기는 함수 상단의 명시적 배열에서 처리
export const config = {
  matcher: [
    "/((?!_next/|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|json|js|woff2?|ttf)).*)",
  ],
};
