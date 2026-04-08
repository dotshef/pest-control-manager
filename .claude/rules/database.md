---
description: DB 관련 규칙. Supabase 쿼리, 스키마, 마이그레이션 작업 시 적용.
globs: ["**/*.sql", "lib/supabase/**", "app/api/**"]
---

# DB 규칙

## 금지 사항
- DB 트리거 사용 금지
- `default now()` 등 DB 레벨 기본값 금지 — 서버에서 직접 타임스탬프 주입
- Supabase RLS 사용 금지 — 서버에서 tenant_id 기반 직접 필터링
- Supabase Auth 사용 금지 — users 테이블에 email/password_hash 직접 관리
- DB 시퀀스 사용 금지 — 채번 로직은 서버에서 처리

## 필수 사항
- 모든 쿼리에 tenant_id 조건 명시적 추가
- Supabase 클라이언트는 `getSupabase()` (lazy 초기화) 사용
- INSERT/UPDATE 시 created_at, updated_at을 `new Date().toISOString()`으로 직접 전달