# 소독증명서 PDF 다운로드 추가 작업 정의

## 배경

현재 소독증명서는 HWPX(한글 파일)로만 생성/다운로드된다.
한글 프로그램이 없는 사용자를 위해 **PDF 다운로드**를 별도 파이프라인으로 추가한다.

- HWPX 파이프라인의 생성 로직은 변경하지 않음 (법적 원본 유지)
- PDF는 같은 `CertificateInput` 데이터를 사용하되, 별도로 렌더링
- PDF 미리보기(PDFViewer)는 제공하지 않음 — 다운로드만 지원
- PDF도 HWPX와 마찬가지로 Supabase Storage에 저장

## 기술 선택

- **라이브러리**: `@react-pdf/renderer` (서버사이드 `renderToBuffer()`)
- **폰트**: 나눔고딕 (NanumGothic) — OFL 라이선스, 돋움 대체
- **클라이언트 컴포넌트 불필요**: 서버에서 PDF 생성 후 바이너리 응답
- **레이아웃 참조**: `lib/template/소독증명서_템플릿.pdf` — 법정 양식 원본 PDF

## 현재 구조

```
lib/hwpx/generate-certificate.ts    ← HWPX 생성 (CertificateInput → Buffer)
app/api/certificates/generate/       ← POST: HWPX 생성 + Storage 업로드 + DB 기록
app/api/certificates/[id]/download/  ← GET: HWPX 파일 다운로드
app/(app)/visits/[id]/page.tsx       ← 방문 상세 (증명서 생성/다운로드 UI)
```

### 현재 Storage 구조

```
certificates/                        ← Supabase Storage 버킷
  {tenantId}/
    CERT-C00001-00001.hwpx
    CERT-C00001-00002.hwpx
```

---

## 구조 변경

### Storage 버킷 구조

같은 `certificateNumber`는 유니크하므로 확장자로 구분한다.
서브폴더 분리 없이 같은 경로에 `.hwpx`와 `.pdf`를 나란히 저장.

```
certificates/
  {tenantId}/
    CERT-C00001-00001.hwpx
    CERT-C00001-00001.pdf       ← 신규
    CERT-C00001-00002.hwpx
    CERT-C00001-00002.pdf       ← 신규
```

### API 라우트 구조 변경

기존 `/api/certificates/[id]/download/`를 포맷별 정적 라우트로 분리한다.

**변경 전**:
```
app/api/certificates/[id]/download/route.ts   ← HWPX 전용
```

**변경 후**:
```
app/api/certificates/[id]/
  hwpx/route.ts     ← GET: HWPX 다운로드 (기존 download/route.ts 이동)
  pdf/route.ts      ← GET: PDF 다운로드 (신규)
```

- `download/route.ts`는 삭제하고 `hwpx/route.ts`로 이동 (내용 동일)
- 두 포맷의 로직이 다르므로 파일 분리가 자연스러움
  - HWPX: Storage에서 파일 가져오기만
  - PDF: Storage에서 파일 가져오기 (없으면 생성 후 저장)
- 기존 `download/` 경로를 참조하는 곳: `app/(app)/visits/[id]/page.tsx` 한 곳 → `hwpx/`로 변경

---

## 작업 목록

### 1. 패키지 설치

```bash
npm install @react-pdf/renderer
```

### 2. 나눔고딕 폰트 파일 추가

**경로**: `lib/fonts/NanumGothic-Regular.ttf`, `lib/fonts/NanumGothic-Bold.ttf`

- Google Fonts에서 다운로드
- Bold는 제목/라벨용, Regular은 본문/데이터용

### 3. PDF 문서 컴포넌트

**파일**: `lib/pdf/certificate-document.tsx`

**역할**: `CertificateInput`을 받아 소독증명서 PDF 레이아웃을 React PDF 컴포넌트로 렌더링

**구현 포인트**:
- `@react-pdf/renderer`의 `Document`, `Page`, `View`, `Text`, `Font`, `StyleSheet` 사용
- `Font.register()`로 나눔고딕 등록 (파일 경로 또는 Buffer)
- 기존 `CertificateInput` 인터페이스 그대로 사용 (`lib/hwpx/generate-certificate.ts`에서 import)
- A4 사이즈, 법정 양식(별지 제28호서식) 레이아웃을 표(View+flexDirection row)로 재현

**레이아웃 참조**: `lib/template/소독증명서_템플릿.pdf` (별지 제28호서식)

이 PDF를 시각적으로 재현한다. 주요 구조:

```
■ 감염병의 예방 및 관리에 관한 법률 시행규칙 [별지 제28호서식]

┌─────────────────────────────────────────────────────────┐
│  제           호                                         │
│                                                         │
│              소  독  증  명  서                            │
│                                                         │
├───────────┬─────────────────┬──────────────────────────┤
│           │ 상호(명칭)       │ 실시 면적(용적)            │
│           │ (businessName)  │ (areaM2)㎡( (areaM3)㎥)   │
│           ├─────────────────┴──────────────────────────┤
│           │ 소재지                                      │
│ 대상 시설  │ (address)                                   │
│           ├──────────┬─────────────────────────────────┤
│           │ 관리(운영)자│ 직위  (position)                │
│           │   확인    │ 성명  (managerName)        (인)  │
├───────────┴──────────┴─────────────────────────────────┤
│ 소독기간              │ (periodStart) ~ (periodEnd)      │
├───────────────────────┤                                 │
│           │ 종류      │ (disinfectionType)               │
│ 소독 내용  ├───────────┤                                 │
│           │ 약품 사용  │ (chemicals)                      │
│           │ 내용      │                                   │
├───────────┴───────────┴─────────────────────────────────┤
│                                                         │
│  「감염병의 예방 및 관리에 관한 법률」 제54조제1항 및         │
│   같은 법 시행규칙 제40조제2항에 따라 위와 같이 소독을       │
│   실시하였음을 증명합니다.                                  │
│                                                         │
│                    (year)년    (month)월    (day)일       │
│                                                         │
│         소독 실시자  상호(명칭)  (operatorName)             │
│                     소재지      (operatorAddress)         │
│                     성명(대표자) (operatorCeo)       (인)  │
├─────────────────────────────────────────────────────────┤
│                            210mm×297mm(일반용지 60g/㎡)   │
└─────────────────────────────────────────────────────────┘
```

**셀 → CertificateInput 매핑**:

| 양식 위치 | CertificateInput 필드 |
|---|---|
| 제 ○ 호 | `issueNumber` |
| 상호(명칭) | `businessName` |
| 실시 면적(용적) | `areaM2`, `areaM3` |
| 소재지 (대상 시설) | `address` |
| 직위 | `position` |
| 성명 | `managerName` |
| 소독기간 | `periodStart`, `periodEnd` |
| 종류 | `disinfectionType` |
| 약품 사용 내용 | `chemicals` |
| 년 월 일 | `year`, `month`, `day` |
| 소독 실시자 상호(명칭) | `operatorName` |
| 소독 실시자 소재지 | `operatorAddress` |
| 소독 실시자 성명(대표자) | `operatorCeo` |

### 4. generate API 수정

**파일**: `app/api/certificates/generate/route.ts`

**변경 사항**: HWPX 생성 + 업로드 후, PDF도 생성 + 업로드

**추가되는 흐름**:
1. (기존) HWPX 생성 → `{tenantId}/{certificateNumber}.hwpx`로 업로드
2. (신규) PDF 생성 → `{tenantId}/{certificateNumber}.pdf`로 업로드

**DB 컬럼 rename + 추가** (아래 "DB 변경" 섹션 참조):
- 기존 `file_url` → `hwpx_file_url`, `file_name` → `hwpx_file_name`
- 신규 `pdf_file_url`, `pdf_file_name` 추가
- INSERT 시 HWPX/PDF 경로를 각각 명시적으로 저장

### 5. API 라우트 재구성

**삭제**: `app/api/certificates/[id]/download/route.ts`

**신규**: `app/api/certificates/[id]/hwpx/route.ts`
- 기존 `download/route.ts`의 내용을 그대로 이동
- DB에서 `hwpx_file_url`, `hwpx_file_name` 사용
- Storage에서 HWPX 파일 다운로드 → 응답

**신규**: `app/api/certificates/[id]/pdf/route.ts`
- DB에서 `pdf_file_url`, `pdf_file_name` 사용
- Storage에서 PDF 파일 다운로드 → 응답
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename*=UTF-8''소독증명서_...pdf`

### 6. UI 변경

**파일**: `app/(app)/visits/[id]/page.tsx`

**변경 사항**:
1. 기존 HWPX 다운로드 링크 경로 변경: `/api/certificates/{id}/download` → `/api/certificates/{id}/hwpx`
2. PDF 다운로드 링크 추가: `/api/certificates/{id}/pdf`

**변경 후**:
```
파일
┌─────────────────────────────────────┐
│ 📄 소독증명서_시설명_업체명_날짜.hwpx  ⬇ │
├─────────────────────────────────────┤
│ 📄 소독증명서_시설명_업체명_날짜.pdf   ⬇ │
└─────────────────────────────────────┘
```

---

## DB 변경

### certificates 테이블 컬럼 변경

```sql
-- 기존 컬럼 rename (HWPX 명시)
ALTER TABLE certificates RENAME COLUMN file_url TO hwpx_file_url;
ALTER TABLE certificates RENAME COLUMN file_name TO hwpx_file_name;

-- PDF 컬럼 추가
ALTER TABLE certificates ADD COLUMN pdf_file_url TEXT;
ALTER TABLE certificates ADD COLUMN pdf_file_name TEXT;
```

**변경 전**:
| 컬럼 | 용도 |
|------|------|
| `file_url` | HWPX 경로 (암묵적) |
| `file_name` | HWPX 파일명 (암묵적) |

**변경 후**:
| 컬럼 | 용도 |
|------|------|
| `hwpx_file_url` | HWPX Storage 경로 |
| `hwpx_file_name` | HWPX 다운로드 파일명 |
| `pdf_file_url` | PDF Storage 경로 |
| `pdf_file_name` | PDF 다운로드 파일명 |


**영향 범위** (기존 `file_url`/`file_name` 참조하는 코드):
- `app/api/certificates/generate/route.ts` — INSERT/UPDATE 시 컬럼명 변경
- `app/api/certificates/[id]/download/route.ts` → `hwpx/route.ts`로 이동하며 변경
- `app/(app)/visits/[id]/page.tsx` — certificates 타입에서 컬럼명 변경

---

## 의존성 변경

**추가**:
- `@react-pdf/renderer` — PDF 렌더링

**유지**:
- `jszip`, `@xmldom/xmldom` — HWPX 파이프라인 (변경 없음)

## 파일 변경 요약

| 파일 | 변경 |
|------|------|
| `package.json` | `@react-pdf/renderer` 추가 |
| `lib/fonts/NanumGothic-Regular.ttf` | 신규 (폰트 파일) |
| `lib/fonts/NanumGothic-Bold.ttf` | 신규 (폰트 파일) |
| `lib/pdf/certificate-document.tsx` | 신규 (PDF 레이아웃 컴포넌트) |
| `app/api/certificates/generate/route.ts` | 수정 (PDF 생성 + 업로드 추가) |
| `app/api/certificates/[id]/download/route.ts` | 삭제 |
| `app/api/certificates/[id]/hwpx/route.ts` | 신규 (기존 download 이동) |
| `app/api/certificates/[id]/pdf/route.ts` | 신규 (PDF 다운로드) |
| `app/(app)/visits/[id]/page.tsx` | 수정 (컬럼명 변경 + 경로 변경 + PDF 다운로드 버튼 추가) |
| `reference/schema.sql` | 수정 (컬럼 rename + 추가) |
