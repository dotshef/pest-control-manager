# Label + Input 공통 컴포넌트 적용 대상

## 목적
- 모든 label에 `text-base`, `mb-2` 공통 적용
- 반복 코드 제거를 위해 공통 컴포넌트로 추출

## 대상 파일 (8개, 총 44개 label+input 쌍)

| 파일 | 개수 | 입력 타입 |
|------|------|-----------|
| `app/(app)/settings/page.tsx` | 7 | input, password |
| `app/(app)/clients/new/page.tsx` | 9 | input, select, textarea, date |
| `app/(app)/clients/[id]/edit/page.tsx` | 9 | input, select, textarea |
| `app/signup/page.tsx` | 7 | input |
| `app/(app)/members/new/page.tsx` | 4 | input |
| `app/(app)/visits/[id]/page.tsx` | 3 | input, textarea |
| `app/login/page.tsx` | 2 | input |
| `app/(app)/members/[id]/edit/page.tsx` | 2 | input |

## 파일별 상세

### 1. settings/page.tsx (7개) — 이미 text-base, mb-2 적용 완료
- 업체명 (text)
- 사업자등록번호 (text)
- 대표자명 (text)
- 전화번호 (tel)
- 주소 (text)
- 현재 비밀번호 (password)
- 새 비밀번호 (password)

### 2. clients/new/page.tsx (9개)
- 시설명 (text)
- 시설 유형 (select)
- 주소 (text)
- 면적 ㎡ (number)
- 면적 평 (number)
- 담당자명 (text)
- 연락처 (tel)
- 메모 (textarea)
- 첫 방문 예정일 (date)

### 3. clients/[id]/edit/page.tsx (9개)
- 시설명 (text)
- 시설 유형 (select)
- 주소 (text)
- 면적 ㎡ (number)
- 면적 평 (number)
- 담당자명 (text)
- 연락처 (tel)
- 메모 (textarea)

### 4. signup/page.tsx (7개)
- 업체명 (text)
- 사업자등록번호 (text)
- 대표자명 (text)
- 전화번호 (tel)
- 이름 (text)
- 이메일 (email)
- 비밀번호 (password)

### 5. members/new/page.tsx (4개)
- 이름 (text)
- 이메일 (email)
- 비밀번호 (password)
- 연락처 (tel)

### 6. visits/[id]/page.tsx (3개)
- 소독 방법 (버튼 선택 + text input)
- 사용 약제 (버튼 선택 + text input)
- 메모 (textarea)

### 7. login/page.tsx (2개)
- 이메일 (email)
- 비밀번호 (password)

### 8. members/[id]/edit/page.tsx (2개)
- 이름 (text)
- 연락처 (tel)

## 현재 공통 패턴
```tsx
<div className="form-control">
  <label className="label">
    <span className="label-text font-medium">라벨명</span>
  </label>
  <input type="text" className="input input-bordered w-full" />
</div>
```

## 필요한 공통 스타일
- label: `text-base`, `mb-2`
- input/select/textarea: 기존 유지
