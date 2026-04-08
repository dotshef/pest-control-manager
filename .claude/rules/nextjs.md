---
description: Next.js 16 관련 규칙. 라우팅, 미들웨어, 빌드 관련 작업 시 적용.
globs: ["**/*.ts", "**/*.tsx", "proxy.ts"]
---

# Next.js 16 규칙

## proxy (구 middleware)
- Next.js 16에서 `middleware.ts`는 deprecated됨
- 반드시 `proxy.ts` 파일명 + `export function proxy()` 함수명 사용
- 기존 middleware와 동일한 API (NextRequest, NextResponse, cookies, redirect 등)
- 절대 `middleware.ts` 파일을 생성하지 말 것