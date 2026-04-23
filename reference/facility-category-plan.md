# 시설 분류(facility_category) 도입 작업 계획

## 배경 / 목표
- 현재 고객(`clients`) 테이블은 `facility_type` 하나로 14종 법정 시설 유형만 받음.
- 실제 사용자는 **가정/사업장/의무소독시설** 3개 대분류로 고객을 인지하고, 법정 세부 유형은 의무소독시설에만 의미가 있음.
- **이번 작업 범위**: 대분류(`facility_category`)를 도입하고, 의무소독시설일 때만 세부 유형(`facility_type`)을 선택/표시하도록 변경.
- **이번 작업 범위 밖**: 법정 주기 로직 변경, 인증서 템플릿 문구 변경.

## 확정된 규칙

### 값/네이밍
- 새 컬럼: `clients.facility_category` (text, NOT NULL)
- 허용값: `'home'` | `'business'` | `'mandatory'`
- 라벨: 가정 / 사업장 / 의무소독시설
- 기존 `facility_type`: NULL 허용으로 변경. `category='mandatory'`일 때만 값이 들어간다.

### 검증 (API 레벨)
- `category='mandatory'` → `facilityType` 필수
- `category in ('home','business')` → `facilityType`은 무시/`null` 저장
- DB 트리거·CHECK 복합 조건 없이 zod + 라우트 핸들러에서 검증

### UI 규칙
- **등록/수정 폼**
  - `시설명` → `시설 분류`(셀렉트 3종) → `의무 시설 유형`(셀렉트)
  - `의무 시설 유형`은 **분류가 `mandatory`일 때만 표시**, 아닐 때는 숨김(+폼 값 초기화)
- **목록·상세·대시보드·방문 목록/상세**
  - 표시 셀: `category === 'mandatory'` → 세부 유형 라벨 / 그 외 → 대분류 라벨
- **필터**
  - 고객 목록/방문 목록: 대분류 필터 신설
  - 세부 유형 필터는 대분류 필터가 `mandatory`일 때만 하위에 노출
  - 기존 `facility_type` 필터 파라미터는 이름 유지 (하위 필터로 재배치만)

## 작업 단계

### 1. 스키마 & 마이그레이션
- [ ] `reference/schema.sql` 업데이트
  - `facility_category text not null check (facility_category in ('home','business','mandatory'))`
  - `facility_type` NOT NULL 제거
- [ ] 마이그레이션 SQL (직접 실행 — 프로젝트는 별도 마이그레이션 도구 미사용)
  ```sql
  alter table clients add column facility_category text;
  update clients set facility_category = 'mandatory' where facility_category is null;
  alter table clients alter column facility_category set not null;
  alter table clients add constraint clients_facility_category_check
    check (facility_category in ('home','business','mandatory'));
  alter table clients alter column facility_type drop not null;
  ```

### 2. 상수/유틸
- [ ] `lib/constants/facility-category.ts` 신설
  - `FACILITY_CATEGORIES = [{id:'home',label:'가정'},{id:'business',label:'사업장'},{id:'mandatory',label:'의무소독시설'}]`
  - `FACILITY_CATEGORY_IDS`, `getFacilityCategoryLabel(id)`, 타입 `FacilityCategoryId`
- [ ] 공용 표시 헬퍼(`lib/utils/facility-display.ts`)
  - `getClientFacilityLabel({ facility_category, facility_type })`
    - `mandatory` → 기존 `FACILITY_TYPES` 라벨
    - 그 외 → 대분류 라벨
  - 현재 `visits/page.tsx`, `visits/[id]/page.tsx`에 중복 정의된 `getFacilityLabel` 두 개를 이 헬퍼로 통합/교체

### 3. Zod 스키마
- [ ] `lib/validations/client.ts`
  - `facilityCategory: z.enum(['home','business','mandatory'])`
  - `facilityType`는 optional로 변경
  - `.superRefine`으로 `category==='mandatory' && !facilityType` 이면 에러

### 4. API
- [ ] `app/api/clients/route.ts`
  - POST: `facilityCategory`, `facilityType`(선택) 처리. `category !== 'mandatory'`면 `facility_type = null`.
  - GET: `facilityCategory` 쿼리 파라미터 수신 → `.eq('facility_category', ...)`. 기존 `facilityType` 필터는 유지.
- [ ] `app/api/clients/[id]/route.ts`
  - PATCH: 동일 규칙. `category` 변경 시 `facility_type`도 함께 정리(category가 `mandatory`가 아닐 때 null로 리셋).
- [ ] `app/api/visits/route.ts`
  - select 컬럼에 `facility_category` 추가 (`clients(id, name, facility_type, facility_category, address)` 등)
  - 쿼리 파라미터 `facility_category` 추가 (목록 모드에서 사용). 기존 `facility_type` 필터는 유지.
- [ ] `app/api/visits/[id]/route.ts`: select 컬럼에 `facility_category` 추가
- [ ] `app/api/dashboard/route.ts`: select 컬럼에 `facility_category` 추가

### 5. UI — 고객
- [ ] `app/(app)/clients/new/page.tsx`
  - 폼 state: `facilityCategory` 추가, `facilityType` 기본 빈 값
  - 분류 셀렉트 렌더 → `mandatory`일 때만 세부 유형 셀렉트 노출
  - 분류 변경 시 `facilityType` 초기화
  - submit 시 `category !== 'mandatory'`면 `facilityType`을 전송하지 않음(또는 서버에서 무시되므로 그대로 보내도 무방하지만 명시적으로 비우는 쪽 권장)
- [ ] `app/(app)/clients/[id]/edit/page.tsx`: 위와 동일
- [ ] `app/(app)/clients/page.tsx`
  - 상태: `facilityCategory` 필터 추가
  - 세부 유형 필터는 `facilityCategory === 'mandatory'`일 때만 렌더
  - 표·카드 셀: `getClientFacilityLabel` 사용
  - URL 파라미터에 `facilityCategory` 추가
- [ ] `app/(app)/clients/[id]/page.tsx`
  - 상세 타입에 `facility_category` 추가
  - 라벨 표시: `getClientFacilityLabel`
  - 주기 표시 블록: `category !== 'mandatory'`면 숨김 (주기 로직은 이번 단계에서 건드리지 않되, `mandatory`일 때만 노출되도록 분기만 추가)

### 6. UI — 방문
- [ ] `app/(app)/visits/page.tsx`
  - `facilityTypeFilter` → `facilityCategoryFilter` + (조건부) `facilityTypeFilter`
  - URL/쿼리 파라미터 `facility_category` 추가
  - 목록 셀: `getClientFacilityLabel`로 교체
  - 중복 `getFacilityLabel` 제거
- [ ] `app/(app)/visits/[id]/page.tsx`
  - `clients`에 `facility_category` 추가
  - 셀: `getClientFacilityLabel`로 교체
  - 중복 `getFacilityLabel` 제거
- [ ] `components/visits/visit-create-modal.tsx`: 클라이언트 조회 시 `facility_category` 포함, 표시도 분기 라벨 사용 (사용 부위 확인 후 반영)

### 7. UI — 대시보드 / 캘린더
- [ ] `app/(app)/dashboard/page.tsx`: 타입에 `facility_category` 추가, 표시 분기
- [ ] `app/(app)/calendar/page.tsx`: 타입에 `facility_category` 추가. 표시 영역이 있으면 분기 적용

### 8. 테스트 / 검수
- [ ] 기존 고객(전부 `mandatory`로 마이그레이션됨) 목록/상세/수정에서 기존 동작 이상 없는지
- [ ] 새 고객을 `home` / `business`로 등록 → 세부 유형 미입력 허용, 목록·상세·방문 목록·방문 상세에서 "가정" / "사업장" 라벨로 노출되는지
- [ ] `mandatory`로 등록 → 기존과 동일하게 세부 유형 필수, 셀 라벨은 세부 라벨로 표시되는지
- [ ] 필터: 대분류 필터 동작, `mandatory` 선택 시에만 하위 유형 필터 노출/동작
- [ ] 수정 폼에서 `mandatory` → `home` 변경 시 `facility_type`이 null로 정리되는지 (API 책임)

## 영향 받지 않는 항목 (이번에 건드리지 않음)
- `lib/utils/cycle.ts` — 주기 로직 (상세 페이지에서 렌더 분기만 추가)
- 인증서 템플릿 문구
- `FACILITY_TYPES` 상수 자체

## 오픈 이슈 / TODO (후속)
- 가정/사업장 고객의 주기 관리(사용자 정의 주기) — 별도 작업
- 가정/사업장용 인증서 문구 분기 — 별도 작업
