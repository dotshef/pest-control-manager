import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

const PUBLIC_PATHS = ["/login", "/signup", "/api/auth/login", "/api/auth/signup"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const token = request.cookies.get("session")?.value;

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
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("session");
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth/).*)",
  ],
};
