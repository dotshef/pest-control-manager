# 증명서 이메일 발송 기능 설계

## 1. 목적

증명서 PDF 생성 후, 시설 담당자 이메일로 발송하는 기능. 방문 상세 페이지의 "소독증명서" 카드에서 발송 버튼으로 트리거. Resend로 PDF를 첨부해 발송하고, `certificates.sent_at` / `sent_to`에 이력 저장.

---

## 2. 현재 상태 / 갭 분석

### 이미 있는 것
- `certificates.pdf_file_url` — Supabase Storage(`certificates` 버킷) 내 PDF 경로
- [lib/email/resend.ts](lib/email/resend.ts) — Resend 클라이언트, 인증번호 메일만 구현됨
- [app/api/certificates/[id]/pdf/route.ts](app/api/certificates/[id]/pdf/route.ts) — Storage에서 PDF 다운로드 패턴 검증 완료
- [app/(app)/visits/[id]/page.tsx:445-525](app/(app)/visits/[id]/page.tsx#L445-L525) — 증명서 카드 UI

### 빠진 것 (이번에 구현)
1. **시설 담당자 이메일 컬럼이 없음** — `clients` 테이블에 `contact_name`, `contact_phone`, `contact_position`만 있고 이메일 필드 없음
2. **`certificates` 발송 이력 컬럼이 실제 DB에 없음** — `schema.sql`에는 `sent_at`, `sent_to`가 적혀 있지만 실제 Supabase에는 적용되어 있지 않음. 마이그레이션 필요
3. 증명서 발송 API
4. 증명서 발송용 이메일 템플릿 (PDF 첨부 포함)
5. UI: 발송 버튼 + 발송 이력 표시 + 수신자 이메일 확인/수정 모달

---

## 3. DB 변경

### 3-1. `clients` 테이블
```sql
alter table clients add column contact_email text;
```
- nullable. 기존 시설은 빈 값으로 두고, 발송 시 사용자가 직접 입력 가능
- [reference/schema.sql](reference/schema.sql) 업데이트 (CLAUDE.md 규칙: 트리거/시퀀스 없음, default 없음)

### 3-2. `certificates` 테이블
실제 DB에는 아직 발송 이력 컬럼이 없으므로 추가:
```sql
alter table certificates add column sent_at timestamptz;
alter table certificates add column sent_to text;
```
- `schema.sql`에는 이미 기재되어 있음 → SQL 파일 수정은 불필요, 실제 DB에만 반영
- 단일 발송 이력만 보관 (재발송 시 덮어씀). 다중 이력이 필요해지면 별도 `certificate_send_logs` 테이블로 분리하는 건 후속 과제로 미룸

---

## 4. API 설계

### 4-1. `POST /api/certificates/[id]/send`
증명서 PDF를 첨부해 이메일 발송.

**Request body**
```ts
{ to: string }  // 수신자 이메일 (담당자 이메일 또는 직접 입력)
```

**처리 흐름**
1. `getSession()` → tenantId 확보 (없으면 401)
2. `to`를 zod 또는 간단한 정규식으로 검증 (없거나 형식 불일치면 400)
3. `certificates` 조회: `id` + `tenant_id` 조건. join: `visits → clients(name, contact_name)`, `tenants(name)` (tenant 이름은 메일 본문/제목에 사용)
4. `pdf_file_url` 없으면 409 "PDF가 아직 생성되지 않았습니다"
5. Supabase Storage에서 PDF 다운로드 → `Buffer`로 변환
6. `sendCertificateEmail({ to, recipientName, clientName, tenantName, certificateNumber, pdfBuffer, pdfFileName })` 호출
7. 성공 시 `certificates` 업데이트: `sent_at = new Date().toISOString()`, `sent_to = to`
8. 응답: `{ sentAt, sentTo }`

**에러 처리**
- Resend API 실패 시 500. `sent_at` 업데이트하지 않음 (메일 실제로 안 나갔으면 이력 남기지 않음)
- 첨부 파일 크기 제한: Resend 기본 한도(40MB) 이내. 증명서 PDF는 대체로 < 1MB라 별도 처리 불필요

### 4-2. `GET /api/certificates/[id]/send-status` (선택)
- 카드 진입 시 따로 호출하기엔 과함. 이미 visit 상세 API에서 certificates를 join하므로 거기에 `sent_at`, `sent_to` 두 컬럼만 추가 셀렉트하면 충분
- → **별도 엔드포인트 만들지 않음**. [app/api/visits/[id]/route.ts](app/api/visits/[id]/route.ts)의 certificates select에 두 컬럼 추가

---

## 5. 이메일 템플릿

### 위치
[lib/email/resend.ts](lib/email/resend.ts)에 `sendCertificateEmail` 함수 추가. 기존 `sendVerificationCodeEmail`과 같은 파일/스타일.

### 시그니처
```ts
interface SendCertificateEmailParams {
  to: string;
  recipientName: string | null;   // 시설 담당자명. 없으면 "담당자님"
  clientName: string;             // 시설명
  tenantName: string;             // 방역업체명
  certificateNumber: string;
  pdfBuffer: Buffer;
  pdfFileName: string;
}
```

### 메일 내용
- **제목**: `[소독노트] {clientName} 소독증명서 발송 안내`
- **From**: `소독노트 <contact@dotshef.com>` (기존 동일)
- **본문 골자** (HTML, 인증번호 메일과 같은 카드 레이아웃):
  - 인사말: `{recipientName}님, 안녕하세요.` (없으면 `담당자님, 안녕하세요.`)
  - 안내: `{tenantName}에서 {clientName} 소독을 완료하고 증명서를 발송드립니다.`
  - 증명서 번호 표시
  - "첨부 파일을 확인해 주세요." 안내
  - 푸터: 기존과 동일한 "소독노트 · ..."
- **첨부**: Resend `attachments: [{ filename: pdfFileName, content: pdfBuffer }]`

---

## 6. UI 변경

### 6-1. 시설 등록/수정 폼
- [app/(app)/clients/new/page.tsx](app/(app)/clients/new/page.tsx), [app/(app)/clients/[id]/edit/page.tsx](app/(app)/clients/[id]/edit/page.tsx)
- 담당자 정보 섹션에 "담당자 이메일" input 추가 (선택 입력, type="email")
- [lib/validations/client.ts](lib/validations/client.ts)의 zod 스키마에 `contact_email: z.string().email().optional().or(z.literal(""))` 추가
- [app/api/clients/route.ts](app/api/clients/route.ts), [app/api/clients/[id]/route.ts](app/api/clients/[id]/route.ts)에 contact_email 처리 추가

### 6-2. 시설 상세
- [app/(app)/clients/[id]/page.tsx](app/(app)/clients/[id]/page.tsx)에 담당자 이메일 노출

### 6-3. 방문 상세 — 증명서 카드 ([app/(app)/visits/[id]/page.tsx:445-525](app/(app)/visits/[id]/page.tsx#L445-L525))

증명서 파일 섹션 아래에 **발송 섹션** 추가:

```
─────────────────────────
이메일 발송
[ 발송 / 재발송 버튼 ]
(발송 이력이 있으면) 2026.04.23 14:32 → recipient@example.com 으로 발송됨
```

**버튼 클릭 동작**:
1. `client.contact_email`이 **없으면** 먼저 확인 dialog(`confirm`):
   - 메시지: `"시설 담당자 이메일이 등록되어 있지 않습니다. 지금 입력해서 발송하시겠습니까?"`
   - 취소 → 아무 동작 없음 (사용자가 먼저 시설 정보에 이메일 등록하도록 유도)
   - 확인 → 2단계로 진행
2. `SendCertificateModal` 컴포넌트 열기
3. 모달 내용:
   - "수신자 이메일" input. 기본값은 `client.contact_email`. 없으면 빈 값.
   - "이 이메일로 시설 담당자 정보도 함께 업데이트" 체크박스 (체크 시 `clients.contact_email`도 갱신, 시설에 이메일 미등록인 경우 기본 체크)
   - 첨부될 PDF 파일명 표시
   - "발송" / "취소" 버튼
4. 발송 시 `POST /api/certificates/[id]/send` → 성공 시 toast + visit 재조회
5. 시설 이메일 동기화는 `PATCH /api/clients/[id]/contact-email` (간단한 별도 엔드포인트) 또는 같은 send API에서 `updateClientEmail: boolean` 플래그로 처리. **send API에서 같이 처리**하는 게 round-trip 줄어 단순.

**컴포넌트 위치**: `components/certificates/send-certificate-modal.tsx`

### 6-4. 발송 가능 조건
- `pdf_file_url`이 있을 때만 발송 버튼 노출 (HWPX만 있고 PDF 없는 경우 제외)
- 즉 증명서 카드의 "파일" 섹션과 같은 가시성 조건

---

## 7. 데이터 흐름 요약

```
[방문 완료] → [증명서 생성] → [PDF Storage 저장] → [발송 버튼 클릭]
  → 모달에서 수신자 확인/수정 → [POST /api/certificates/:id/send]
  → Storage에서 PDF 다운로드 → Resend로 첨부 발송 → certificates.sent_at/sent_to 업데이트
  → (선택) clients.contact_email 동기화 → toast + UI 갱신
```

---

## 8. 작업 순서 (구현 시 참고)

1. **DB**:
   - `clients.contact_email` 추가 + schema.sql 업데이트
   - `certificates.sent_at`, `certificates.sent_to` 실제 DB에 추가 (schema.sql은 이미 반영됨)
2. **API/검증**: clients zod 스키마 + POST/PATCH 라우트에 contact_email 추가
3. **시설 폼 UI**: new/edit 페이지에 이메일 입력 추가, 시설 상세에 노출
4. **이메일 템플릿**: `lib/email/resend.ts`에 `sendCertificateEmail` 추가
5. **send API**: `app/api/certificates/[id]/send/route.ts` 신규
6. **visit 상세 API**: certificates select에 `sent_at`, `sent_to` 추가
7. **모달 컴포넌트**: `components/certificates/send-certificate-modal.tsx`
8. **방문 상세 페이지**: 증명서 카드에 발송 섹션/버튼 통합

---

## 9. 비범위 (이번 구현에서 제외)

- 다중 수신자 / CC / BCC
- 발송 예약, 자동 발송 (방문 완료 시 자동 메일)
- 발송 이력 다건 보관 (지금은 마지막 발송만 기록)
- SMS/카카오톡 발송
- 이메일 열람 추적, 바운스 처리, 재시도 큐
- 메일 템플릿 커스터마이징 (업체별)
