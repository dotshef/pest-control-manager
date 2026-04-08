# Phase 1: 프로젝트 기반 세팅 + 인증

## 목표
Supabase 연동, DB 스키마 생성, 인증(로그인/회원가입), 멀티테넌시 기본 구조 확립

## 선행 조건
- Next.js 프로젝트 초기화 완료
- Supabase 프로젝트 생성 완료

## 작업 목록

### 1-1. Supabase 연동 및 환경 설정
- [x] Supabase 서버 클라이언트 설정 (`lib/supabase/server.ts`, service_role 키)
- [x] 환경변수 설정 (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET)
- [x] DaisyUI 5 + 기타 의존성 설치 및 설정

### 1-2. DB 스키마 생성
- [x] `tenants` 테이블 생성
- [x] `users` 테이블 생성 (email + password_hash 직접 관리)
- [x] `clients` 테이블 생성
- [x] `schedules` 테이블 생성
- [x] `visits` 테이블 생성
- [x] `certificates` 테이블 생성
- [x] 서버 사이드 tenant_id 기반 멀티테넌시 유틸 함수 작성 (service_role 키 사용)

### 1-3. 인증 (Auth) — 자체 구현 (Supabase Auth 미사용)
- [x] `POST /api/auth/signup` — 비인증 공개 엔드포인트. 트랜잭션으로 tenants + users(admin) 동시 생성
- [x] `POST /api/auth/login` — 이메일/비밀번호 검증 → JWT 발급 → httpOnly 쿠키 저장
- [x] `POST /api/auth/logout` — 쿠키 삭제
- [x] 회원가입 페이지 (`app/signup/page.tsx`) — 업체 정보 + 관리자 계정 입력
- [x] 로그인 페이지 (`app/login/page.tsx`) — 좌측 브랜드 소개 + 우측 로그인 폼 (2분할 레이아웃)
- [x] "로그인 상태 유지" 체크박스
- [ ] "비밀번호 찾기" 링크 + 비밀번호 재설정 플로우
- [x] 인증 미들웨어 (`middleware.ts`) — JWT 검증, 미로그인 시 리다이렉트

### 1-4. 레이아웃 기본 구조
- [x] 좌측 사이드바 레이아웃 셸 (`app/(app)/layout.tsx`)
- [x] 사이드바 메뉴: 대시보드 / 캘린더 / 고객 관리 / 증명서 / 기사 관리 / 설정
- [x] 상단 헤더 — 페이지 타이틀 + 관리자 배지 + 로그아웃
- [ ] 모바일 반응형 (사이드바 → 하단 탭 또는 햄버거 메뉴)

## 산출물
- 로그인/회원가입 동작
- DB 테이블 6개 + 서버 사이드 권한 체크
- 앱 레이아웃 셸 (사이드바 + 헤더)

## 미완료 항목
- 비밀번호 찾기/재설정 플로우
- 모바일 반응형 네비게이션
