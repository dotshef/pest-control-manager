# 방역매니저 - 소독 방역업체용 SaaS

## 기술 스택
- **프레임워크**: Next.js 16.2 (App Router, Turbopack) + React 19.2 + TypeScript
- **스타일**: Tailwind CSS 4 (순정) — **DaisyUI 미사용**
- **DB/Storage**: Supabase (PostgreSQL + Storage) — Auth·RLS 미사용
- **인증**: 자체 구현 (bcryptjs + jose JWT + httpOnly 쿠키)
- **검증**: Zod 4
- **PDF**: `@react-pdf/renderer`
- **PWA**: `@ducanh2912/next-pwa` ([next.config.ts](next.config.ts))
- **아이콘**: Lucide React
- **폰트**: Pretendard (로컬 `@font-face`)
- **날짜**: date-fns

> `package.json`에 `react-hook-form`이 있지만 **실사용되지 않음**. 폼은 `useState` + 수동 핸들러로 작성되어 있음. 전역 상태 라이브러리는 사용하지 않음 (`useState`만).

## 스타일링 규칙 ★

DaisyUI를 쓰지 않지만 **DaisyUI와 동일한 네이밍의 커스텀 토큰**을 Tailwind 4 `@theme`로 정의해 쓴다. [app/globals.css](app/globals.css)에 정의됨.

사용 가능한 색상 토큰:
- `primary` / `primary-content`, `secondary` / `secondary-content`, `accent` / `accent-content`
- `neutral` / `neutral-content`, `base-100` / `base-200` / `base-300` / `base-content`
- `success`, `error`, `warning`, `info`

→ `bg-primary`, `text-base-content/60`, `border-base-300` 같은 클래스는 **Tailwind의 임의값이 아니라 프로젝트 토큰**이다. 새 색상을 추가하려면 `@theme` 블록에 `--color-*` 변수를 추가.

**전역 폼 스타일**: `globals.css`에서 `input[type=text|email|password|tel|number|date]`, `select`, `textarea`에 테두리·패딩·포커스 스타일이 자동 적용된다. 컴포넌트에서는 대부분 `className="w-full"` 정도만 붙이면 됨. 좌/우 라운드 제거 등이 필요하면 `!rounded-l-none` 같은 important 유틸 사용.

**유틸 클래스**: `.data-table` — 리스트 테이블에 공통 적용 (`<table className="data-table">`).

## 핵심 규칙

### DB (.claude/rules/database.md)
- **트리거 절대 금지** — created_at, updated_at 등 모든 타임스탬프는 서버에서 `new Date().toISOString()`으로 직접 주입
- **`default now()` 금지** — DB 레벨 기본값 사용하지 않음
- **RLS 미사용** — 모든 쿼리에 `.eq("tenant_id", session.tenantId)` 명시적 추가
- **Supabase Auth 미사용** — `users` 테이블에 `email` / `password_hash` 직접 관리
- **DB 시퀀스 금지** — 채번 로직은 서버에서 처리 (예: [lib/utils/visit-code.ts](lib/utils/visit-code.ts))
- DB 클라이언트: `getSupabase()` (service_role 키, lazy 초기화) — [lib/supabase/server.ts](lib/supabase/server.ts)

### Next.js 16 (.claude/rules/nextjs.md)
- `middleware.ts`는 deprecated. 반드시 [proxy.ts](proxy.ts) + `export async function proxy()` 사용
- `themeColor`, `width`, `initialScale` 등은 `metadata`가 아닌 `export const viewport: Viewport`로 분리
- `import type { Metadata, Viewport } from "next"`

### React — useEffect 데이터 페칭 (.claude/rules/react.md)
- effect 본문에서 동기적 `setState` 금지 (`setLoading(true)` 등)
- `useCallback` + `useEffect` 조합 금지
- effect 내부에 async 함수 직접 정의, `let ignore = false` + cleanup에서 `ignore = true`
- `loading`은 별도 state 대신 데이터에서 파생: `const loading = !data`
- 로딩 전환이 필요하면 **이벤트 핸들러**에서 `setData(null)` 호출 (effect 바깥)
- 상세 패턴은 rules/react.md 참조

### 인증
- **서버 컴포넌트**: `await requireAuth()` 호출로 세션 검증 + 리다이렉트 ([lib/auth/session.ts](lib/auth/session.ts))
- **API 라우트**: `const session = await getSession()` 후 null 체크 → 401
- **proxy.ts**: 공개 경로 화이트리스트 + 보호 경로 토큰 검증 + **매 요청마다 sliding session 토큰 재발급** (1일)
- JWT payload: `{ userId, tenantId, role: "admin" | "member", email }`

### 코드 컨벤션
- 서버 컴포넌트 우선, 인터랙션 필요한 경우만 `"use client"`
- 한국어 UI, 에러 메시지·유효성 메시지 전부 한국어
- 경로 alias: `@/` → 프로젝트 루트
- 재사용 UI가 부족함 (Button 컴포넌트 없음) — 버튼은 인라인 Tailwind 클래스를 반복 사용 중. 공통화할 때는 `components/ui/` 아래에 추가.

## 프로젝트 구조

```
app/
  (app)/              # 인증 필요 — Sidebar + Header 레이아웃
    dashboard/
    calendar/
    visits/           # visit-list.tsx는 클라 컴포넌트
    clients/
    certificates/
    members/          # admin만 접근
    settings/
    layout.tsx        # requireAuth() 호출
  login/              # 공개
  signup/             # 공개
  api/
    auth/             # login, logout, signup, change-password
    visits/           # 캘린더 모드 + 목록 모드 겸용
    clients/
    members/
    certificates/     # generate 포함 (PDF)
    dashboard/
    settings/
  layout.tsx          # 루트 (폰트, metadata, viewport)
  globals.css         # Tailwind + @theme 토큰 + 전역 폼 스타일

components/
  layout/             # Sidebar, Header
  ui/                 # FormField, Spinner

lib/
  auth/               # jwt (토큰/쿠키), session (requireAuth), password (bcrypt)
  supabase/           # server.ts — getSupabase() lazy init
  validations/        # Zod 스키마 (auth, client, member)
  constants/          # facility-types, methods
  utils/              # area (㎡↔평 변환), cycle, calendar, visit-code (채번)

reference/            # PRD, DB 스키마, Phase별 작업 문서

proxy.ts              # Next.js 16 proxy (구 middleware)
next.config.ts        # PWA 래핑
```
