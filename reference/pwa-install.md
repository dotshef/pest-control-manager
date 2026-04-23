# PWA 아이콘 + 설치 UI 구현 계획

> 작성일: 2026-04-23
> 대상: 소독노트 (Next.js 16 + Turbopack)
> 전제: RealFaviconGenerator로 제작된 아이콘 세트가 `public/icons/`에 배치됨

사용자가 홈 화면에 앱을 설치해 **단독 실행 모드(standalone)**로 쓸 수 있게 만드는 작업. manifest·Service Worker 뼈대는 이미 있고 아이콘 실물도 준비됐으므로 **manifest 연결 + 설치 UI 추가**가 남은 핵심 작업.

---

## 1. 현재 상태와 GAP

| 항목 | 현재 | 필요 |
|------|------|------|
| `public/icons/` | **파일 5개 배치 완료** | manifest/layout에서 연결 |
| `public/manifest.json` | 구버전 아이콘 경로(`icon-192x192.png` 등) + 존재하지 않는 파일 참조 | 새 파일명으로 갱신, `purpose: "any"` 단일 |
| `public/sw.js` | 푸시 전용 등록됨 | 앱 부팅 시에도 무조건 등록되게 변경 |
| `app/layout.tsx` | manifest 링크만 있음 | apple-touch-icon link + SW 부트스트랩 추가 |
| 설치 프롬프트 UI | 없음 | 대시보드 상단 배너 (`PushPermissionBanner` 자리 교체)<br>iOS: 별도 안내 페이지로 이동 |
| SW 등록 타이밍 | 푸시 구독 시에만 | 첫 진입 시 전역 등록 |

---

## 2. 아이콘 파일 (배치 완료)

`public/icons/` 하위에 다음 5개 파일이 이미 존재. 추가 생성 작업 없음.

| 파일명 | 크기 | 용도 |
|--------|------|------|
| `android-chrome-192x192.png` | 192×192 | Chrome/Android 기본 |
| `android-chrome-512x512.png` | 512×512 | 설치 후 홈 아이콘, splash |
| `apple-touch-icon.png` | 180×180 | iOS 홈 화면 |
| `favicon-16x16.png` | 16×16 | 브라우저 탭 |
| `favicon-32x32.png` | 32×32 | 브라우저 탭 |

**maskable은 범위 제외**: 안드로이드 일부 기기(원형 크롭)에서 아이콘이 약간 작게 보일 수 있으나, 런처가 자동 패딩을 넣어주므로 글자 잘림 없음. Lighthouse는 경고만 뜨고 통과. 필요 시 추후 teal 배경 + 흰 글자 이미지 추가하면 **마이그레이션 비용 0**.

---

## 3. manifest.json 업데이트

`public/manifest.json`을 새 파일명 + 단일 purpose로 교체.

```json
{
  "name": "소독노트",
  "short_name": "소독노트",
  "description": "소독 방역업체를 위한 올인원 관리 플랫폼",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#009098",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" }
  ]
}
```

**참고**: SW(`public/sw.js`)의 기본 알림 아이콘도 `/icons/icon-192x192.png`를 참조 중 — 새 파일명으로 바꿔야 함 (`/icons/android-chrome-192x192.png`).

---

## 4. layout.tsx 업데이트

### 4.1 Metadata / Viewport

```tsx
export const metadata: Metadata = {
  title: "소독노트",
  description: "소독 방역업체를 위한 올인원 관리 플랫폼",
  manifest: "/manifest.json",
  icons: {
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "소독노트",
  },
};

export const viewport: Viewport = {
  themeColor: "#009098",
};
```

### 4.2 SW 부트스트랩 컴포넌트 추가

`<body>` 최상단에 클라이언트 컴포넌트 삽입:

```tsx
<ServiceWorkerBootstrap />
```

---

## 5. Service Worker 부트스트랩

**신규 파일**: `components/pwa/sw-bootstrap.tsx`

```tsx
"use client";
import { useEffect } from "react";

export function ServiceWorkerBootstrap() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    let cancelled = false;
    async function register() {
      try {
        const existing = await navigator.serviceWorker.getRegistration("/sw.js");
        if (!cancelled && !existing) {
          await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        }
      } catch (err) {
        console.error("SW 등록 실패", err);
      }
    }
    register();
    return () => { cancelled = true; };
  }, []);

  return null;
}
```

**주의**
- 개발 환경(`npm run dev`)에서는 SW가 캐시 동작으로 HMR을 방해할 수 있어 **production 빌드에서만 등록.**
- 기존 `lib/push/browser.ts`의 SW 등록 로직은 그대로 유지 (이미 등록돼 있으면 `getRegistration`이 재사용).

---

## 6. 설치 프롬프트 UI

### 6.1 동작 분기

| 플랫폼 | 메커니즘 | 구현 |
|--------|----------|------|
| Android Chrome/Edge/Samsung | `beforeinstallprompt` 이벤트 캡처 | 이벤트 저장 → 버튼 클릭 시 `prompt()` 호출 |
| Desktop Chrome/Edge | 동일 | 동일 |
| iOS Safari | **이벤트 없음** | "공유 → 홈 화면에 추가" 수동 안내 모달 |
| 이미 설치됨 | `window.matchMedia("(display-mode: standalone)").matches` 또는 `navigator.standalone` | 버튼 숨김 |

### 6.2 신규 파일

`lib/pwa/install.ts` — 훅

```ts
"use client";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallState =
  | { status: "installed" }
  | { status: "available"; install: () => Promise<boolean> }
  | { status: "ios-manual" }
  | { status: "unsupported" };

export function useInstallPrompt(): InstallState {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (standalone) { setInstalled(true); return; }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);

    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return { status: "installed" };
  if (deferred) {
    return {
      status: "available",
      install: async () => {
        await deferred.prompt();
        const choice = await deferred.userChoice;
        setDeferred(null);
        return choice.outcome === "accepted";
      },
    };
  }

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  if (isIos) return { status: "ios-manual" };
  return { status: "unsupported" };
}
```

### 6.3 신규 컴포넌트

`components/pwa/install-banner.tsx` — 대시보드 상단 배너

기존 [components/push/push-permission-banner.tsx](../components/push/push-permission-banner.tsx)와 **동일한 비주얼 슬롯·디자인**을 사용. 구조 재활용:
- 좌측 아이콘 박스(다운로드 아이콘 등) + 본문 텍스트 + 우측 액션 버튼 + X 닫기 버튼
- `localStorage`에 `install-banner-dismissed` 키로 닫기 상태 영속화

**상태별 동작**
| `InstallState.status` | 배너 본문 | 버튼 동작 |
|------|---------|----------|
| `"available"` | "앱으로 설치하기" / "홈 화면에 추가하면 더 빠르게 이용할 수 있어요" | `install()` 네이티브 프롬프트 호출 |
| `"ios-manual"` | "iPhone에서 앱처럼 사용" / "홈 화면 추가 방법을 알려드릴게요" | `router.push("/install")` |
| `"installed"` \| `"unsupported"` | 렌더 X (`return null`) | — |

### 6.4 iOS 안내 페이지

`app/install/page.tsx` — 별도 라우트, 텍스트 중심 안내.

- **접근 경로**: 대시보드 배너의 "설치 방법 보기" 버튼 클릭 시에만 진입
- **구성**: 번호가 매겨진 단계별 텍스트 안내
  1. Safari 하단 **공유 버튼** (정사각형에서 화살표 올라가는 아이콘) 을 눌러주세요
  2. 메뉴를 아래로 스크롤해서 **"홈 화면에 추가"** 를 선택하세요
  3. 오른쪽 상단 **"추가"** 를 누르면 끝입니다
- **주의사항 블록**: "크롬·네이버 앱에서는 설치가 불가능합니다. Safari로 열어주세요." 안내
- **하단 CTA**: "대시보드로 돌아가기" 버튼
- **인증 불필요** — 로그인 전에도 접근 가능 (공개 라우트)

### 6.5 교체 대상

[app/(app)/dashboard/page.tsx:102](../app/(app)/dashboard/page.tsx#L102)

```tsx
// 변경 전
<PushPermissionBanner />

// 변경 후
<InstallBanner />
```

**Push 권한 요청은 배너에서 제거**됩니다. 대신 [components/push/push-settings.tsx](../components/push/push-settings.tsx) (이미 존재)에서 옵트인하도록 동선 변경. 이유:
- iOS는 **설치된 PWA에서만** 푸시 수신 가능 → 설치 전 푸시 배너는 낭비
- 설치 → 푸시 순으로 자연스럽게 유도됨

기존 `components/push/push-permission-banner.tsx` 파일은 **삭제하지 않고 남겨둠** (설정 페이지에서 재활용 가능성). 대시보드에서만 import 제거.

### 6.6 로그인 페이지

**설치 UI 넣지 않음.** 로그인 전 설치 유도는 불필요하다 판단.

---

## 7. 정리 완료된 항목

- ✅ `scripts/generate-icons.mjs` 삭제됨
- ✅ `package.json` 의 `"icons"` 스크립트 제거됨
- ✅ `sharp` devDependency 제거됨
- ✅ `@ducanh2912/next-pwa` dependency 제거됨 (Turbopack 미호환, 정적 SW로 대체)
- ✅ `next.config.ts` 의 `withPWA` 래핑 제거됨
- ✅ `npm run build` 통과 확인
- 🔲 `public/app_icon.png` (300×300 원본) — 백업용 보관, 필요 시 수동 삭제

---

## 8. 테스트 체크리스트

### 8.1 빌드 후 로컬 검증
- [ ] `npm run build && npm run start`로 production 실행
- [ ] Chrome DevTools → Application → Manifest 탭에서 아이콘 2종 로드 확인 (192, 512)
- [ ] Application → Service Workers에서 `/sw.js` activated 확인
- [ ] Lighthouse → PWA 감사 통과 (Installable 섹션 녹색, maskable 경고는 무시)
- [ ] 주소창 오른쪽 설치 아이콘 출현 → 클릭해서 설치

### 8.2 기기 테스트
- [ ] Android Chrome — 대시보드 배너 버튼 클릭 시 네이티브 설치 시트 출현
- [ ] iOS Safari — 배너 버튼 클릭 시 `/install` 페이지로 이동, 단계별 안내 문구 노출
- [ ] 설치 후 실행 — standalone 모드, 주소창 없음, 테마색 #009098 적용
- [ ] 홈 화면 아이콘 — apple-touch-icon(iOS) / android-chrome-192(Android) 제대로 표시
- [ ] 푸시 알림 — 기존 기능 회귀 없음 (SW 알림 아이콘 경로 수정 반영 확인)
- [ ] 로그인 페이지 — 설치 UI 노출되지 않음

### 8.3 회귀 확인
- [ ] 개발 환경(`next dev`)에서 SW 미등록 확인 (HMR 정상 작동)
- [ ] 설치된 상태에서 배너 자동 숨김
- [ ] 배너 X로 닫은 후 새로고침해도 재출현하지 않음 (localStorage 확인)
- [ ] 새 탭/시크릿 모드에서 manifest 에러 없음

---

## 9. 작업 순서 (예상 2.5~3시간)

1. **(5분)** `public/manifest.json` icons 배열 업데이트 + 구버전 경로 제거
2. **(5분)** `public/sw.js` 알림 아이콘 경로 새 파일명으로 교체
3. **(5분)** `app/layout.tsx` metadata에 apple-touch-icon + appleWebApp 추가
4. **(15분)** `components/pwa/sw-bootstrap.tsx` 작성 + layout에 삽입
5. **(30분)** `lib/pwa/install.ts` 훅 구현
6. **(40분)** `components/pwa/install-banner.tsx` 구현 (푸시 배너 스타일 재활용)
7. **(25분)** `app/install/page.tsx` iOS 안내 페이지 구현
8. **(5분)** `app/(app)/dashboard/page.tsx`에서 `PushPermissionBanner` → `InstallBanner` 교체
9. **(30분)** 로컬 production 빌드 + Chrome DevTools 검증
10. **(30분)** 실기기 테스트 (Android + iOS)

---

## 10. 비범위 (나중에)

- **Maskable 아이콘** — 사용자 피드백에 따라 추후 추가. teal(#009098) 배경 + 흰 글자 512px 단일 파일만 만들면 manifest.json에 `purpose: "maskable"` 엔트리 추가로 끝.
- **오프라인 캐싱** — 현재 SW는 fetch 핸들러 없음. 방문 이력·증명서 오프라인 열람은 별도 이슈로 분리.
- **Web App Manifest `shortcuts`** — 홈 화면 롱프레스 메뉴 (예: "오늘 일정", "증명서 발급") — 설치 흐름 안정화 후.
- **Splash screen 커스터마이징** — iOS 전용. 별도 `apple-touch-startup-image` 세트가 필요하며 우선순위 낮음.
- **설치 유도 배너** — 하단 고정 "앱으로 설치하기" 배너. 초기엔 생략, 사용자 피드백 보고 판단.

---

## 11. 확정된 결정

- ✅ **배치 위치**: 대시보드 상단 `PushPermissionBanner` 슬롯 교체 (동일 비주얼)
- ✅ **iOS 안내**: 별도 페이지 `/install`, 텍스트 중심 단계별 안내
- ✅ **로그인 페이지**: 설치 UI 없음
- ✅ **기존 푸시 배너**: 대시보드에서만 제거, 파일은 남겨두어 설정 페이지에서 재활용 여지 확보
