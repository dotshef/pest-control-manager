# 내 정보 수정 + LNB 로그아웃 이동 작업

## 현황

- 헤더의 이메일 클릭 → 드롭다운 로그아웃 버튼 (제거 대상)
- LNB(사이드바)에는 네비게이션 메뉴만 존재
- "내 정보 수정" 페이지 없음
- users 테이블에 `name`, `phone`, `email` 필드 존재
- 비밀번호 변경 API(`POST /api/auth/change-password`)는 이미 존재
- 비밀번호 변경 UI(`PasswordChangeSection`)가 settings/page.tsx에 정의되어 있지만 렌더링되지 않는 상태

## 작업 목록

### 1. 헤더 수정 — `components/layout/header.tsx`

- 이메일을 감싸는 `<button>` → 단순 `<span>`으로 변경
- 드롭다운 메뉴 (`menuOpen`, `handleLogout`, overlay) 전체 삭제
- `useState`, `useRouter` import 제거

### 2. 사이드바 수정 — `components/layout/sidebar.tsx`

- 하단 고정 영역 추가 (`border-t`로 구분)
  - **내 정보 수정** — `UserPen` 아이콘 + `/my-info` Link
  - **로그아웃** — `LogOut` 아이콘 + `POST /api/auth/logout` 호출 button
- 로그아웃 처리를 위해 `"use client"` + `useRouter` 필요 (이미 client component)

### 3. 사이드바 호출부 수정 — `app/(app)/layout.tsx`

- 현재: `<Sidebar role={session.role} />`
- 로그아웃은 사이드바 내부에서 fetch만 하면 되므로 추가 prop 불필요
- pageTitles에 `/my-info` 항목 추가 (헤더 타이틀 표시용)

### 4. 내 정보 수정 API — `app/api/my-info/route.ts`

- **GET**: 현재 로그인한 유저의 `name`, `phone`, `email` 반환
  - `requireAuth()`로 세션에서 `userId`, `tenantId` 추출
  - `SELECT name, phone, email FROM users WHERE id = $userId AND tenant_id = $tenantId`
- **PATCH**: `name`, `phone` 수정 (email 변경은 제외)
  - `updated_at`은 `new Date().toISOString()`으로 서버에서 주입

### 5. 내 정보 수정 페이지 — `app/(app)/my-info/page.tsx`

- 구성:
  - **내 정보 섹션**: 이름, 전화번호 수정 폼 (이메일은 읽기전용 표시)
  - **비밀번호 변경 섹션**: settings/page.tsx의 `PasswordChangeSection`을 이동 또는 공용 컴포넌트로 분리
- 기존 프로젝트 패턴 따름:
  - `useSession()`으로 현재 세션 확인
  - `useEffect` + `ignore` 플래그 패턴으로 데이터 fetch
  - `FormField` 컴포넌트 재사용
  - `Spinner` 로딩 처리

### 6. PasswordChangeSection 처리

- 현재 `settings/page.tsx` 안에 정의만 되고 사용되지 않음
- `my-info/page.tsx`로 이동하여 렌더링
- settings/page.tsx에서 해당 코드 삭제

## 작업 순서

1 → 2 → 3 → 4 → 5 → 6 순서로 진행 (UI 변경 → API → 페이지)
