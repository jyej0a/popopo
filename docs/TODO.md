# POIZON 차익 분석 대시보드 개발 TODO

## ✅ POIZON API 연동 수정 완료 (2024-12-01)

공식 POIZON Open Platform 문서에 맞춰 API 클라이언트를 전면 수정하였습니다.

### 완료된 작업
- [x] MD5 서명 방식으로 변경 (HMAC-SHA256 → MD5) ✅
- [x] `md5` 패키지 설치 ✅
- [x] `lib/poizon-api.ts` 완전 재작성 ✅
  - [x] 올바른 MD5 서명 생성 알고리즘 구현
  - [x] 실제 API 엔드포인트로 변경
  - [x] 요청 구조 수정 (헤더 → 본문 포함)
  - [x] searchByStyleCode, getSkusBySpuId, getMarketPrice, createListing, updateListing 함수 구현
- [x] `types/poizon.ts` 업데이트 ✅
  - [x] 실제 API 응답 구조에 맞춘 타입 정의
  - [x] PoizonSkuSearchRequest, PoizonSkuListRequest, PoizonMarketPriceRequest 등 추가
- [x] Server Actions 업데이트 ✅
  - [x] `actions/product-actions.ts` - 새 API 함수 사용하도록 수정
  - [x] `actions/price-actions.ts` - fetchPoizonMarketPrice 함수 추가
  - [x] `actions/bid-actions.ts` - createListing/updateListing 사용하도록 수정
- [x] `app/dashboard/page.tsx` 업데이트 ✅
  - [x] 새 API 응답 구조 처리
  - [x] globalSkuId 사용하도록 수정

### 참고 자료
- [POIZON API 소개](https://open.poizon.com/doc/list/documentationDetail/15)
- [인증 가이드](https://open.poizon.com/doc/list/documentationDetail/9)
- [품번으로 SKU 조회](https://open.poizon.com/doc/list/apiDetail/140?openKey=11)
- [입찰 추천(시장가)](https://open.poizon.com/doc/list/apiDetail/93?openKey=4)
- [수동 입찰](https://open.poizon.com/doc/list/apiDetail/41?openKey=4)

---

## Phase 1: 기반 설정 및 데이터베이스 설계

### 1.1 환경 설정
- [x] `.env` 파일에 API 키 추가
  - [x] POIZON_APP_KEY, POIZON_APP_SECRET
  - [x] NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
  - [x] EXCHANGE_RATE_API_KEY (선택)

### 1.2 패키지 설치
- [ ] `playwright` 설치 (스크래핑용)
- [x] `ky` (API 호출용) ✅
- [x] `md5` (POIZON API 서명용) ✅
- [ ] `@tanstack/react-table` (테이블 UI용)
- [ ] `recharts` 또는 `chart.js` (차트 표시용, 선택)
- [ ] `date-fns` (날짜 처리)

### 1.3 Supabase 데이터베이스 스키마 설계
- [x] `products` 테이블 생성 ✅
  - [x] id, spu (POIZON 상품 ID), style_code, brand, name_en, name_cn, thumbnail_url, created_at
- [x] `product_skus` 테이블 생성 ✅
  - [x] id, product_id (FK), sku, size, created_at
- [x] `poizon_prices` 테이블 생성 (POIZON 시장가 히스토리) ✅
  - [x] id, sku_id (FK), lowest_ask (CNY), sales_volume, fetched_at
- [x] `naver_prices` 테이블 생성 (네이버 최저가 히스토리) ✅
  - [x] id, product_id (FK), size, lowest_price (KRW), source_url, mall_name, fetched_at
- [x] `my_bids` 테이블 생성 (내 입찰 내역) ✅
  - [x] id, user_id, sku_id (FK), bid_price (CNY), status, created_at, updated_at
- [x] `settings` 테이블 생성 (사용자 설정) ✅
  - [x] id, user_id, exchange_rate, platform_fee_rate, shipping_cost, updated_at
- [x] 마이그레이션 파일 작성 ✅
- [ ] 마이그레이션 실행 (Supabase에 적용) - ⏸️ 보류 (나중에 추가)

## Phase 2: 백엔드 로직 구현

### 2.1 유틸리티 함수 작성 (`lib/` 폴더)
- [x] `lib/poizon-api.ts` - POIZON API 클라이언트 (Listing 기능) ✅
  - [x] 서명(Signature) 생성 함수 (MD5, 공백 처리 포함)
  - [x] 상품 검색 함수 (searchByStyleCode)
  - [x] SKU 목록 조회 함수 (getSkusBySpuId)
  - [x] 시장 최저가 조회 함수 (getMarketPrice)
  - [x] 입찰 등록 함수 (createListing)
  - [x] 입찰 수정 함수 (updateListing)
  - [ ] 입찰 취소 함수 (cancelListing) - **추가 필요**
  - [ ] 입찰 목록 조회 함수 (getListingList) - **추가 필요**
- [ ] `lib/poizon-api.ts` - **주문 처리 API 추가 필요** ⚠️
  - [ ] 주문 확인 함수 (confirmOrder) - **필수!**
  - [ ] 배송 처리 함수 (shipOrder) - **필수!**
  - [ ] 주문 목록 조회 함수 (getOrderList) - **필수!**
  - [ ] 송장 라벨 조회 함수 (getExpressLabel) - 권장
- [x] `lib/naver-api.ts` - 네이버 검색 API 클라이언트 ✅
  - [x] 쇼핑 검색 함수 (/v1/search/shop.json)
  - [x] 결과 필터링 로직 (국내배송만)
- [x] `lib/exchange-rate.ts` - 환율 조회 ✅
  - [x] 실시간 CNY/KRW 환율 가져오기 (API 또는 더미 데이터)
- [ ] `lib/scraper.ts` - Playwright 스크래핑 (Fallback)
  - [ ] POIZON 시장 최저가 스크래핑 함수
  - [ ] 판매량 스크래핑 함수
  - [ ] 캐싱 로직 (1시간 단위)
- [x] `lib/calculator.ts` - 마진 계산 로직 ✅
  - [x] 예상 매출액 계산
  - [x] 예상 매입가 계산
  - [x] 예상 수익 및 ROI 계산
  - [x] 최적 입찰가 계산
  - [x] 목표 마진 기반 최대 입찰가 계산

### 2.2 Server Actions (`actions/` 폴더 생성)
- [x] `actions/product-actions.ts` ✅
  - [x] searchProduct(styleCode) - 상품 검색
  - [x] getProductSkus(spuId) - SKU 목록 조회
  - [x] getProductDetails(spuId) - 상품 상세 및 SKU 목록
- [x] `actions/price-actions.ts` ✅
  - [x] fetchNaverPrice(styleCode, size?) - 네이버 최저가 조회
  - [x] fetchBulkNaverPrices() - 네이버 가격 일괄 조회
  - [x] calculateSingleMargin() - 단일 마진 계산
  - [x] analyzePrices() - 전체 가격 분석
- [x] `actions/bid-actions.ts` (입찰 관련) ✅
  - [x] placeBid(skuId, bidPrice) - 단일 입찰 실행
  - [x] placeBulkBids() - 일괄 입찰 실행
  - [x] getMyBids() - 내 입찰 내역 조회 (TODO: Supabase 연동)
  - [x] cancelBid(bidId) - 입찰 취소 (TODO: Supabase 연동)
- [ ] `actions/order-actions.ts` (주문 처리 - **추가 필요**) ⚠️
  - [ ] getOrderList() - 주문 목록 조회
  - [ ] confirmOrder(orderId) - 주문 확인
  - [ ] shipOrder(orderId, trackingNo, courier) - 배송 처리
  - [ ] getExpressLabel(orderId) - 송장 라벨 조회
- [x] `actions/settings-actions.ts` ✅
  - [x] getUserSettings() - 사용자 설정 조회
  - [x] updateUserSettings(settings) - 설정 업데이트
  - [x] resetSettings() - 설정 초기화
  - [x] fetchCurrentExchangeRate() - 실시간 환율 조회

### 2.3 API Routes (`app/api/` 폴더)
- [ ] `app/api/webhooks/poizon/route.ts` - POIZON 웹훅 수신 (선택)
- [ ] `app/api/exchange-rate/route.ts` - 환율 캐싱 엔드포인트 (선택)

## Phase 3: UI 컴포넌트 개발

### 3.1 shadcn/ui 컴포넌트 추가 설치
- [x] `card` 컴포넌트 ✅
- [x] `table` 컴포넌트 ✅
- [x] `badge` 컴포넌트 ✅
- [x] `sonner` 컴포넌트 (알림용, toast 대체) ✅
- [x] `select` 컴포넌트 ✅
- [x] `checkbox` 컴포넌트 ✅
- [x] `skeleton` 컴포넌트 (로딩용) ✅
- [ ] `tabs` 컴포넌트 (선택)

### 3.2 레이아웃 및 네비게이션
- [x] `components/dashboard/dashboard-layout.tsx` - 대시보드 전용 레이아웃 ✅
- [x] `components/dashboard/settings-sidebar.tsx` - 설정 사이드바 ✅
  - [x] 환율 입력 필드
  - [x] 수수료율 입력 필드
  - [x] 배송비 입력 필드
  - [x] API 연결 상태 표시
  - [x] 계산 예시 미리보기

### 3.3 메인 대시보드 컴포넌트
- [x] `components/dashboard/product-search.tsx` - 상품 검색 바 ✅
  - [x] 품번(Style Code) 입력
  - [x] 검색 버튼
  - [x] 로딩 상태
- [x] `components/dashboard/product-card.tsx` - 상품 정보 카드 ✅
  - [x] 썸네일 이미지
  - [x] 상품명 (영문/중문)
  - [x] 모델 번호
  - [x] 브랜드 배지
- [x] `components/dashboard/price-analysis-table.tsx` - 가격 분석 테이블 (핵심) ✅
  - [x] 사이즈별 행 표시
  - [x] POIZON 최저가(CNY)
  - [x] 판매량
  - [x] 네이버 최저가(KRW)
  - [x] 예상 수익
  - [x] ROI 배지 (색상 구분)
  - [x] 내 입찰가 입력 필드
  - [x] 입찰 버튼 (개별)
  - [x] 체크박스 선택
  - [x] 로딩 스켈레톤
- [x] `components/dashboard/bulk-action-bar.tsx` - 일괄 작업 바 ✅
  - [x] 선택 항목 일괄 입찰
  - [x] 엑셀 다운로드 버튼
  - [x] 선택 개수 표시

### 3.4 추가 컴포넌트 (선택)
- [ ] `components/price-history-chart.tsx` - 가격 변동 차트
- [ ] `components/bid-history.tsx` - 입찰 내역 조회

## Phase 4: 페이지 구성

### 4.1 메인 대시보드 페이지
- [x] `app/dashboard/page.tsx` - 대시보드 메인 ✅
  - [x] ProductSearch 컴포넌트 배치
  - [x] ProductCard 컴포넌트 배치
  - [x] PriceAnalysisTable 컴포넌트 배치
  - [x] BulkActionBar 컴포넌트 배치
  - [x] SettingsSidebar 컴포넌트 배치
  - [x] 상품 검색 로직
  - [x] 가격 분석 로직
  - [x] 입찰 실행 로직
  - [x] Toast 알림 연동
  - [x] DashboardLayout 컴포넌트 사용 (컴포넌트 기반 레이아웃)

### 4.2 레이아웃 구조
- [x] `components/dashboard/dashboard-layout.tsx` - 대시보드 레이아웃 컴포넌트 ✅
  - [x] 메인 컨텐츠 영역
  - [x] 사이드바 영역 (설정 사이드바 포함)
  - [x] 반응형 그리드 레이아웃
- [ ] `app/dashboard/layout.tsx` - Next.js 레이아웃 파일 (선택, 현재는 컴포넌트로 대체됨)
  - [ ] 공통 헤더/푸터 추가 시 필요
  - [ ] 메타데이터 설정 시 필요

### 4.3 설정 페이지
- [ ] `app/dashboard/settings/page.tsx` - 사용자 설정 페이지 (선택)
  - [ ] API 키 관리
  - [ ] 기본 설정값 관리
  - [ ] 현재는 SettingsSidebar 컴포넌트로 대체됨
  - **참고**: 현재 메인 대시보드에 SettingsSidebar가 통합되어 있어 별도 페이지 불필요할 수 있음

### 4.4 입찰 내역 페이지
- [ ] `app/dashboard/bids/page.tsx` - 입찰 내역 조회 페이지 (선택)
  - [ ] 내 입찰 내역 목록 표시
  - [ ] 입찰 상태 필터링 (대기/성공/실패)
  - [ ] 입찰 취소 기능
  - [ ] 입찰 히스토리 조회
  - **참고**: `actions/bid-actions.ts`의 `getMyBids()` 함수와 연동 필요

## Phase 5: 테스트 및 최적화

### 5.1 기능 테스트
- [ ] 상품 검색 기능 테스트
- [ ] POIZON API 연동 테스트
- [ ] Naver API 연동 테스트
- [ ] 마진 계산 로직 검증
- [ ] 입찰 기능 테스트 (실제 API 호출 주의!)

### 5.2 에러 처리 및 개선
- [ ] API 호출 실패 시 재시도 로직
- [ ] Rate Limit 대응 (딜레이 추가)
- [ ] 스크래핑 실패 시 Fallback 처리
- [ ] 사용자 친화적 에러 메시지

### 5.3 성능 최적화
- [ ] 가격 정보 캐싱 구현 (1시간 단위)
- [ ] 이미지 최적화 (Next.js Image 컴포넌트)
- [ ] Server Component vs Client Component 최적화

## Phase 6: 배포 및 문서화

### 6.1 배포 준비
- [ ] 환경 변수 확인
- [ ] Vercel 배포 설정
- [ ] Supabase 프로덕션 설정

### 6.2 문서화
- [ ] README.md 업데이트
  - [ ] 프로젝트 소개
  - [ ] 설치 방법
  - [ ] API 키 발급 가이드
  - [ ] 사용 방법
- [ ] 주요 함수 JSDoc 작성
- [ ] 데이터베이스 스키마 문서화

---

## 추가 고려사항

### 리스크 관리 (PRD Section 6 참고)
- [ ] POIZON API Rate Limit 모니터링
- [ ] Playwright 호출 최소화 (캐싱)
- [ ] 네이버 최저가 정확도 필터링 로직
- [ ] IP 차단 방지 (User-Agent, 딜레이)
