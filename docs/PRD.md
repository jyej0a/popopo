

# PRD: POIZON 셀러용 자동 입찰 및 마진 분석 대시보드

## 1. 프로젝트 개요
*   **프로젝트명:** POIZON Auto-Bidder & Arbitrage Dashboard
*   **목표:** POIZON 판매자 API와 네이버 최저가 정보를 결합하여, 실시간 마진을 계산하고 최적의 판매가로 자동 입찰(Price Update)을 수행하여 수익성을 극대화함.
*   **핵심 사용자:** POIZON 입점 셀러 (Access Token 보유자)
*   **구현 방식:** Next.js 15 + TypeScript 기반 풀스택 웹 애플리케이션 (App Router, Server Actions, Supabase)

## 2. 시스템 아키텍처 및 데이터 흐름

### 2.1. 기술 아키텍처
시스템은 **Next.js 15 App Router 기반 풀스택 아키텍처**를 채택합니다.

**Frontend (Client Components)**
*   React 19 + TypeScript
*   shadcn/ui (Radix UI 기반 컴포넌트)
*   Tailwind CSS v4
*   React Query (데이터 캐싱 및 상태 관리)

**Backend (Server Components & Actions)**
*   Next.js Server Actions (주요 비즈니스 로직)
*   API Routes (외부 웹훅, 캐싱 엔드포인트)
*   Supabase PostgreSQL (데이터 저장소)
*   Clerk (사용자 인증)

**데이터 수집 레이어**
*   POIZON 공식 API (Server Actions에서 호출)
*   Naver Search API (Server Actions에서 호출)
*   Playwright (Headless Browser, 별도 프로세스)

### 2.2. 데이터 수집 방식
시스템은 **하이브리드 데이터 수집 방식**을 채택합니다.
1.  **POIZON 공식 API:** 상품 기본 정보, 옵션(SKU) 리스트, 내 재고/가격 관리, 가격 업데이트 실행
2.  **Web Scraping (Playwright):** 공식 API가 제공하지 않는 **시장 최저가(Market Lowest Ask)** 및 **누적 판매량** 수집
3.  **Naver Search API:** 국내 소싱 최저가 수집

### 2.3. 데이터 흐름
```
[사용자 브라우저]
    ↓ (검색 요청)
[Next.js Server Component/Action]
    ↓ (병렬 호출)
    ├─→ [POIZON API] → 상품 기본 정보
    ├─→ [Playwright Service] → 시장 최저가 (캐시 우선)
    └─→ [Naver API] → 국내 최저가
    ↓ (데이터 통합)
[마진 계산 로직]
    ↓ (저장)
[Supabase DB]
    ↓ (렌더링)
[React 컴포넌트 (테이블)]
```

---

## 3. 기능 요구사항 (Functional Requirements)

### 3.1. 대시보드 및 입력 모듈
*   **상품 검색 기능:**
    *   입력값: `품번 (Style Code)` (예: DD1503-101) 또는 `브랜드명`
    *   기능: 입력 시 POIZON API(`Product List`)를 호출하여 해당 상품의 썸네일, 영문명, 모델 번호를 카드 형태로 표시.
*   **환율 설정:**
    *   실시간 환율(CNY/KRW) 자동 적용 (금융 API 연동)
    *   사용자가 수동으로 환율 고정(Overriding) 할 수 있는 입력 필드 제공.

### 3.2. 데이터 수집 및 조회 모듈
*   **POIZON 데이터 조회 (API + Scraping):**
    *   `SPU` 기준 전체 사이즈 목록(`SKU`) 호출.
    *   각 사이즈별 **현재 시장 최저가(Lowest Ask)** 및 **최근 판매량(Sales Vol)** 표시.
        *   *Logic:* API 응답에 해당 필드가 없으면, 백그라운드에서 Headless Browser를 띄워 해당 상품 페이지를 스크래핑하여 채워 넣음.
    *   현재 **나의 입찰가(My Price)** 표시 (재고가 있는 경우).
*   **Naver 최저가 조회 (API):**
    *   입력된 `품번` + `사이즈(선택적)` 키워드로 네이버 쇼핑 Search API 호출.
    *   검색 결과 중 최상위(최저가) 3개의 가격과 쇼핑몰 링크 노출.
    *   *Filter:* 해외직구 상품 제외 로직(옵션) 또는 '국내배송' 키워드 필터링 권장.

### 3.3. 마진 계산 및 가격 결정 로직 (Core)
각 사이즈(SKU)별로 아래 수식을 적용하여 테이블에 표시:

1.  **예상 매출액 (KRW):** `POIZON 시장가(CNY) × 환율 × (1 - 플랫폼 수수료율)`
2.  **예상 매입가 (KRW):** `네이버 최저가 + 배송비(기본값)`
3.  **예상 수익 (Profit):** `예상 매출액 - 예상 매입가`
4.  **수익률 (ROI):** `(예상 수익 / 예상 매입가) × 100`

### 3.4. 자동 입찰(Bidding) 실행 모듈
*   **개별/일괄 입찰 기능:**
    *   특정 사이즈의 체크박스 선택 후 `가격 반영` 버튼 클릭 시 동작.
*   **스마트 프라이싱 로직:**
    *   **옵션 A (최저가 매칭):** 시장 최저가 - 1 위안
    *   **옵션 B (마진 보장형):** (네이버 최저가 + 목표마진) / 환율 / 수수료 역산
*   **API 실행:**
    *   POIZON `Price Update API` 호출 (Header에 서명(Sign) 포함 필수).
    *   성공/실패 여부를 Toast Message로 알림.

---

## 4. UI/UX 와이어프레임 (Next.js + React 기준)

### 4.1. 레이아웃 구조
```
┌─────────────────────────────────────────────────────────┐
│  [Navbar] POIZON Dashboard    [설정] [로그아웃]         │
├───────────┬─────────────────────────────────────────────┤
│           │  [검색 섹션]                                  │
│           │  ┌──────────────────────────────────────┐   │
│           │  │ 품번 입력 (DD1503-101)    [검색]    │   │
│           │  └──────────────────────────────────────┘   │
│ [사이드바] │                                              │
│           │  [상품 정보 카드]                             │
│  환율 설정 │  ┌────────────────────────────────────┐    │
│  190.5원  │  │ [이미지] 나이키 덩크 로우 범고래     │    │
│           │  │ Style: DD1503-101                  │    │
│  수수료   │  └────────────────────────────────────┘    │
│  5%       │                                              │
│           │  [가격 분석 테이블]                           │
│  배송비   │  (React Table 컴포넌트)                      │
│  3,000원  │                                              │
│           │  [선택 항목 일괄 입찰] [엑셀 다운로드]        │
│  API 상태 │                                              │
│  🟢 POIZON│                                              │
│  🟢 Naver │                                              │
└───────────┴─────────────────────────────────────────────┘
```

### 4.2. 컴포넌트 구조

**메인 대시보드 페이지** (`app/dashboard/page.tsx`)
```tsx
<DashboardLayout>
  <Sidebar />
  <MainContent>
    <ProductSearch onSearch={handleSearch} />
    <ProductCard product={selectedProduct} />
    <PriceAnalysisTable data={analysisData} onBid={handleBid} />
    <BulkActionBar selectedItems={selected} />
  </MainContent>
</DashboardLayout>
```

**가격 분석 테이블** (핵심 컴포넌트)
| 사이즈 | POIZON 최저가(CNY) | 판매량 | 네이버 최저가(KRW) | 예상 수익(KRW) | ROI(%) | **내 입찰가(CNY)** | 동작 |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 260 | ¥ 850 | 1.2만 | ₩145,000 | +₩12,000 | 8.2% | [849] ⚙️ | [입찰] |
| 265 | ¥ 880 | 8천 | ₩148,000 | +₩18,000 | 12.1% | [879] ⚙️ | [입찰] |
| 270 | ¥ 920 | 5천 | ₩152,000 | +₩8,000 | 5.2% | [919] ⚙️ | [입찰] |

*   ⚙️ 클릭 시 스마트 프라이싱 옵션 선택 (최저가 매칭 / 마진 보장형)
*   ROI가 10% 이상이면 초록색, 5% 이하면 빨간색 배지 표시

### 4.3. 사용자 인터랙션 플로우
1.  **상품 검색:** 품번 입력 → 검색 버튼 클릭
2.  **데이터 로딩:** Skeleton UI 표시 (2-3초)
3.  **결과 표시:** 상품 카드 + 테이블 렌더링
4.  **입찰가 조정:** 
    *   수동 입력 또는
    *   ⚙️ 아이콘 클릭 → 자동 계산
5.  **입찰 실행:** 
    *   개별 입찰: 행별 [입찰] 버튼
    *   일괄 입찰: 체크박스 선택 → 하단 [일괄 입찰] 버튼
6.  **피드백:** Toast 알림 (성공/실패)

---

## 5. 기술 스펙 (Technical Stack)

### 5.1. 프론트엔드
*   **Framework:** Next.js 15.5.6 (App Router)
*   **Language:** TypeScript (strict mode)
*   **UI Library:** React 19
*   **Styling:** Tailwind CSS v4
*   **Component Library:** shadcn/ui (Radix UI 기반)
*   **Icons:** lucide-react
*   **State Management:** 
    *   Server State: @tanstack/react-query
    *   Client State: React Hooks (최소화)
*   **Form Handling:** react-hook-form + Zod
*   **Table:** @tanstack/react-table

### 5.2. 백엔드
*   **Runtime:** Next.js Server Components & Server Actions
*   **Database:** Supabase PostgreSQL
*   **Authentication:** Clerk (with Korean localization)
*   **API Integration:**
    *   POIZON API: `ky` 또는 `axios` (Server Actions에서 호출)
    *   Naver API: `ky` 또는 `axios` (Server Actions에서 호출)
*   **Web Scraping:** Playwright (Headless Chromium)
*   **Caching:** 
    *   React Cache (Server Components)
    *   Supabase 테이블 (가격 히스토리)

### 5.3. 외부 API 통합

**POIZON API**
*   Method: HTTP POST/GET (Server Actions)
*   Auth: HMAC Signature 방식
    ```typescript
    // lib/poizon-api.ts
    function generateSignature(params: object, secret: string): string {
      // HMAC-SHA256 서명 생성
    }
    ```
*   주요 엔드포인트:
    *   `/api/product/list` - 상품 검색
    *   `/api/product/sku` - SKU 목록
    *   `/api/seller/price/update` - 가격 업데이트

**Naver Search API**
*   Method: HTTP GET
*   Auth: Client ID, Client Secret (Header)
*   엔드포인트: `https://openapi.naver.com/v1/search/shop.json`

**환율 API** (선택)
*   ExchangeRate-API 또는 한국수출입은행 API
*   Fallback: 수동 입력값 사용

### 5.4. 개발 환경
*   **Package Manager:** pnpm
*   **Linting:** ESLint
*   **Formatting:** Prettier
*   **Testing:** Playwright (E2E), Vitest (Unit) - 선택
*   **Deployment:** Vercel (권장)
*   **Database Hosting:** Supabase Cloud

---

## 6. 개발 시 주의사항 (Risk & Mitigation)

### 6.1. API 및 성능 관련
1.  **API Rate Limit:** 
    *   POIZON API 호출 제한을 확인하고, Server Actions에서 요청 큐잉 구현
    *   옵션: `p-queue` 라이브러리 또는 커스텀 Throttle 함수
    ```typescript
    // lib/rate-limiter.ts
    const queue = new PQueue({ concurrency: 1, interval: 1000, intervalCap: 1 });
    ```

2.  **Scraping 탐지 방지:**
    *   Playwright 호출은 **반드시 캐싱**하고 최소화
    *   Supabase에 `poizon_prices` 테이블 생성, 1시간 이내 데이터는 재사용
    *   User-Agent 랜덤화, Viewport 설정
    ```typescript
    // lib/scraper.ts
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 ...',
      viewport: { width: 1920, height: 1080 }
    });
    ```

3.  **네이버 가격 정확도:**
    *   최저가 외에 **상위 3~5개 평균가** 함께 표시
    *   특정 몰 필터링 로직 (예: "크림", "솔드아웃" 포함 상품 우선)
    *   "해외배송" 키워드 제외

### 6.2. Next.js 특화 고려사항
4.  **Server Component vs Client Component 분리:**
    *   데이터 fetching: Server Component 또는 Server Actions
    *   사용자 인터랙션(입력, 버튼): Client Component
    *   과도한 'use client' 사용 지양

5.  **환경 변수 보안:**
    *   API 키는 **절대** 클라이언트에 노출 금지
    *   `NEXT_PUBLIC_` 접두사 사용 금지 (POIZON, Naver 키)
    *   Server Actions에서만 접근

6.  **데이터베이스 RLS (개발 중):**
    *   초기 개발 시 RLS 비활성화 권장
    *   프로덕션 배포 전 반드시 RLS 정책 검토

7.  **비동기 처리 및 에러 핸들링:**
    *   모든 API 호출에 try-catch 블록
    *   사용자 친화적 에러 메시지 (Toast)
    *   Fallback UI (Skeleton, Error Boundary)

### 6.3. 비즈니스 로직 검증
8.  **마진 계산 정확도:**
    *   수수료율 변경 시 즉시 반영
    *   환율 변동 고려 (자동 갱신 권장)
    *   배송비, 부가세 등 숨은 비용 고려

9.  **입찰 실행 안전장치:**
    *   실제 API 호출 전 확인 다이얼로그 필수
    *   ROI가 음수인 경우 경고 표시
    *   입찰 내역 DB 저장 (추적 가능)

---


