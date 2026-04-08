## 1. companies (방역업체)

멀티테넌시 루트 테이블. 모든 데이터가 여기에 종속.

- `id` (uuid, PK)
- `name` (업체명)
- `business_number` (사업자등록번호)
- `logo_url` (증명서용 로고 이미지)
- `owner_name` (대표자명)
- `phone`
- `address`
- `plan` (basic / plus / pro)
- `created_at`
- `updated_at`

---

## 2. technicians (기사/사용자)

로그인 주체이자 방문 수행자. Supabase Auth와 1:1 연결.

- `id` (uuid, PK)
- `company_id` (FK → companies)
- `auth_user_id` (FK → auth.users, unique)
- `name` (기사명)
- `phone`
- `role` (admin / technician)
- `is_active` (boolean, default true)
- `created_at`
- `updated_at`

---

## 3. clients (고객 시설)

> **facility_types**는 DB 테이블이 아닌 서버 상수로 관리 (`lib/constants/facility-types.ts`)

방역업체가 관리하는 개별 시설.

- `id` (uuid, PK)
- `company_id` (FK → companies)
- `name` (시설명)
- `facility_type` (text — 서버 상수 FacilityTypeId 값)
- `area` (면적, 제곱미터)
- `area_pyeong` (면적, 평)
- `address`
- `contact_name` (담당자명)
- `contact_phone` (담당자 연락처)
- `notes`
- `is_active` (boolean, default true)
- `created_at`
- `updated_at`

---

## 4. schedules (정기 방문 규칙)

고객별 반복 스케줄. 실제 개별 방문 건은 visits에서 관리.

- `id` (uuid, PK)
- `client_id` (FK → clients)
- `company_id` (FK → companies)
- `technician_id` (FK → technicians, nullable)
- `cycle_months` (방문 주기 — 1/2/3/6개월)
- `next_visit_date` (다음 방문 예정일)
- `is_active` (boolean, default true)
- `created_at`
- `updated_at`

---

## 5. visits (실제 방문 기록)

매 방문 건마다 1행. 스케줄에서 자동 생성 또는 수동 추가.

- `id` (uuid, PK)
- `schedule_id` (FK → schedules, nullable)
- `client_id` (FK → clients)
- `technician_id` (FK → technicians, nullable)
- `company_id` (FK → companies)
- `scheduled_date` (예정일)
- `completed_at` (완료 시각, nullable)
- `status` (scheduled / completed / missed)
- `method` (소독 방법 — 분무/연막/훈증 등)
- `chemicals_used` (사용 약제, text[])
- `notes`
- `created_at`

---

## 6. certificates (소독증명서)

방문 완료 시 생성되는 증명서 기록. visit과 1:1.

- `id` (uuid, PK)
- `visit_id` (FK → visits, unique)
- `company_id` (FK → companies)
- `certificate_number` (발급번호 — 자동 채번)
- `pdf_url` (생성된 PDF 스토리지 경로)
- `sent_at` (카톡/문자 발송 시각, nullable)
- `sent_to` (발송 대상 번호)
- `created_at`

---

## 관계 요약

`companies 1 → N technicians
companies 1 → N clients
clients   1 → N schedules
schedules 1 → N visits
clients   1 → N visits
visits    1 → 1 certificates`

---

## 증명서 번호 채번 규칙

`CERT-YYYYMMDD-00001` 형식. 시퀀스 사용.

예시: `CERT-20260408-00001`