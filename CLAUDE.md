# 방역매니저 - 소독 방역업체용 SaaS

## 기술 스택
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4 + DaisyUI 5
- Supabase (PostgreSQL DB, Storage만 사용 — Auth 미사용)
- 자체 인증: bcryptjs + jose (JWT + httpOnly 쿠키)
- Zod v4, React Hook Form, date-fns, Lucide React

## 핵심 규칙

### DB
- **트리거 절대 금지** — created_at, updated_at 등 모든 타임스탬프는 서버에서 직접 주입
- **default now() 금지** — DB 레벨 기본값 사용하지 않음
- **RLS 미사용** — 멀티테넌시 격리는 서버에서 tenant_id 기반으로 직접 처리
- **Supabase Auth 미사용** — users 테이블에 email/password_hash 직접 관리
- DB 접근은 service_role 키 사용 (`lib/supabase/server.ts`)

### Next.js 16
- `middleware.ts`는 deprecated. 반드시 `proxy.ts` + `export function proxy()` 사용

### 코드 컨벤션
- 서버 컴포넌트 우선, 필요한 경우만 "use client"
- Supabase 클라이언트는 lazy 초기화 (`getSupabase()`)
- 한국어 UI, 에러 메시지도 한국어

## 프로젝트 구조
- `reference/` — PRD, DB 스키마, Phase별 작업 문서, 디자인 샘플
- `lib/` — 유틸리티 (auth, supabase, validations, constants)
- `components/` — 공통 컴포넌트
- `app/(app)/` — 인증 필요 페이지 (사이드바 + 헤더 레이아웃)
- `app/login/`, `app/signup/` — 공개 페이지
