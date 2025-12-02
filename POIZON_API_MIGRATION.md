# POIZON API 연동 수정 완료 보고서

## 개요

POIZON Open Platform 공식 문서를 기반으로 API 클라이언트를 전면 수정하였습니다.

**작업 일자**: 2024년 12월 1일  
**참조 계획**: [poizon-api-integration.plan.md](poizon-api-integration.plan.md)

## 주요 변경 사항

### 1. 인증 방식 변경 (Critical)

**이전**: HMAC-SHA256 서명  
**현재**: MD5 서명

공식 문서([Authentication Guide](https://open.poizon.com/doc/list/documentationDetail/9))에 따라 올바른 MD5 서명 방식으로 변경:

```typescript
// 이전 (잘못됨)
const hmac = createHmac('sha256', appSecret);
hmac.update(signString);
return hmac.digest('hex');

// 현재 (올바름)
// 1. 파라미터를 ASCII 순으로 정렬
// 2. key=value 형식으로 URL 인코딩
// 3. appSecret 추가
// 4. MD5 해시 → 대문자 변환
return md5(signStringWithSecret).toUpperCase();
```

### 2. API 엔드포인트 변경

**Base URL**: `https://open.poizon.com` (변경 없음)

**실제 엔드포인트 적용**:
- 품번 검색: `POST /dop/api/v1/pop/api/v1/intl-commodity/intl/sku/sku-info/by-article-number`
- SKU 목록: `POST /dop/api/v1/pop/api/v1/intl-commodity/intl/sku/sku-basic-info/by-global-spu`
- 시장 최저가: `POST /dop/api/v1/pop/api/v1/recommend-bid/price`
- 입찰 등록: `POST /dop/api/v1/pop/api/v1/submit-bid/normal-autonomous-bidding`
- 입찰 수정: `POST /dop/api/v1/pop/api/v1/submit-bid/update-normal-autonomous-bidding`

### 3. 요청 구조 변경

**이전**: 인증 정보를 헤더에 포함
```typescript
headers: {
  'X-Access-Token': accessToken,
  'X-App-Key': appKey,
  'X-Sign': sign,
  'X-Timestamp': timestamp,
}
```

**현재**: 모든 파라미터를 요청 본문에 포함
```typescript
body: {
  app_key: appKey,
  timestamp: timestamp,
  sign: sign,
  language: 'en',
  timeZone: 'Asia/Shanghai',
  ...businessParams
}
```

### 4. 응답 처리 수정

응답 코드 확인 로직 변경:
- **이전**: `response.success === true`
- **현재**: `response.code === 200`

## 수정된 파일 목록

### Core Files
1. **lib/poizon-api.ts** (완전 재작성)
   - MD5 서명 생성 함수 구현
   - 실제 API 엔드포인트 적용
   - 새로운 함수들: `searchByStyleCode`, `getSkusBySpuId`, `getMarketPrice`, `createListing`, `updateListing`

2. **types/poizon.ts** (업데이트)
   - 실제 API 응답 구조에 맞춘 타입 정의
   - 새로운 인터페이스 추가: `PoizonSkuSearchResponse`, `PoizonSkuListResponse`, `PoizonMarketPriceResponse` 등

### Server Actions
3. **actions/product-actions.ts** (업데이트)
   - `searchProduct`: 품번으로 SKU 검색 (새 API 사용)
   - `getProductSkus`: globalSpuId로 SKU 목록 조회
   - `getBulkProductSkus`: 여러 상품 일괄 조회 (신규)

4. **actions/price-actions.ts** (업데이트)
   - `fetchPoizonMarketPrice`: POIZON 시장 최저가 조회 (신규)
   - 기존 함수들 유지

5. **actions/bid-actions.ts** (재작성)
   - `placeBid`: globalSkuId 기반 입찰 (파라미터 구조 변경)
   - `updateBid`: 기존 입찰 수정 (신규)
   - `placeBulkBids`: 일괄 입찰 (파라미터 구조 변경)

### Frontend
6. **app/dashboard/page.tsx** (업데이트)
   - 새 API 응답 구조 처리
   - `skuInfoList` 직접 사용 (별도 SKU 조회 불필요)
   - globalSkuId 기반 입찰 로직

### Configuration
7. **package.json**
   - `md5` 패키지 추가
   - `@types/md5` 타입 정의 추가

8. **docs/TODO.md**
   - API 연동 수정 완료 섹션 추가
   - 참고 자료 링크 추가

## 새로운 의존성

```bash
pnpm add md5 @types/md5
```

## API 사용 예시

### 1. 품번으로 상품 검색

```typescript
import { searchByStyleCode } from '@/lib/poizon-api';

const result = await searchByStyleCode({
  articleNumber: 'DD1503-101',
  region: 'US',
});

// result.skuInfoList[0] = {
//   globalSkuId: 12000001925,
//   globalSpuId: 11000001234,
//   properties: '260',
//   title: 'Nike Dunk Low Panda',
//   ...
// }
```

### 2. 시장 최저가 조회

```typescript
import { getMarketPrice } from '@/lib/poizon-api';

const price = await getMarketPrice({
  globalSkuId: 12000001925,
  biddingType: 20, // Ship-to-Verify
  region: 'US',
  currency: 'USD',
});

// price = {
//   globalMinPrice: 15400,
//   localMinPrice: 15400,
//   usMinPrice: 5400,
// }
```

### 3. 입찰 등록

```typescript
import { createListing } from '@/lib/poizon-api';

const result = await createListing({
  requestId: 'unique-request-id',
  globalSkuId: 12000001925,
  price: 15000, // 센트 단위
  quantity: 1,
  countryCode: 'US',
  deliveryCountryCode: 'US',
  currency: 'USD',
});

// result = {
//   sellerBiddingNo: '112020032027462648',
//   tips: 'Listing in progress...',
// }
```

## 테스트 방법

### 1. 더미 데이터 테스트 (UI 확인)
```
1. http://localhost:3000/dashboard 접속
2. "🎯 더미 데이터 테스트" 버튼 클릭
3. 테이블과 UI가 정상 표시되는지 확인
```

### 2. 실제 API 테스트
```
1. .env 파일에 POIZON API 키 설정 확인
2. 대시보드에서 품번 검색 (예: DD1503-101)
3. 브라우저 개발자 도구(F12) 콘솔 확인
4. API 응답 로그 확인
```

### 3. 빌드 테스트
```bash
pnpm build
```

결과: ✅ 빌드 성공 (경고만 있고 에러 없음)

## 알려진 제한 사항

1. **환경 변수 필수**
   - `POIZON_APP_KEY`
   - `POIZON_APP_SECRET`
   - 없으면 API 호출 시 에러 발생

2. **실제 API 응답 구조 미확인**
   - 공식 문서 기반으로 구현
   - 실제 API 호출 시 응답 구조가 다를 수 있음
   - 필요 시 타입 정의 및 파싱 로직 수정 필요

3. **판매량 데이터 확보** ✅
   - `statisticsDataQry` 파라미터 추가로 판매량 통계 조회 가능
   - 제공 데이터: `localSoldNum`, `globalSoldNum`, `localMonthToMonth`, `globalMonthToMonth`, `averagePrice`
   - 30일 판매량 및 전년 대비 증가율 포함

4. **Supabase 데이터베이스 미연동**
   - 현재는 메모리에만 데이터 저장
   - 데이터베이스 마이그레이션은 별도 작업 필요

## 다음 단계 (권장)

### 단기 (즉시 가능)
1. ✅ 더미 데이터로 UI 테스트
2. 🔄 실제 POIZON API 키로 연동 테스트
3. 🔄 API 응답 구조 확인 및 필요 시 수정

### 중기 (필요 시)
1. Supabase 데이터베이스 마이그레이션 실행
2. 가격 히스토리 및 입찰 내역 저장 기능 구현
3. Playwright 스크래핑 구현 (판매량 등 추가 데이터)

### 장기 (최적화)
1. API 호출 결과 캐싱
2. 에러 처리 개선
3. 재시도 로직 강화
4. 로깅 시스템 구축

## 참고 자료

- [POIZON API 소개](https://open.poizon.com/doc/list/documentationDetail/15)
- [인증 가이드 (MD5)](https://open.poizon.com/doc/list/documentationDetail/9)
- [품번으로 SKU 조회](https://open.poizon.com/doc/list/apiDetail/140?openKey=11)
- [globalSpuId로 SKU 조회](https://open.poizon.com/doc/list/apiDetail/159?openKey=11)
- [입찰 추천(시장가)](https://open.poizon.com/doc/list/apiDetail/93?openKey=4)
- [수동 입찰](https://open.poizon.com/doc/list/apiDetail/41?openKey=4)

## 결론

POIZON Open Platform 공식 문서에 맞춰 API 클라이언트를 완전히 재구성하였습니다. 
모든 파일이 TypeScript 컴파일을 통과하고 빌드가 성공적으로 완료되었습니다.

실제 API 키로 테스트 후 응답 구조를 확인하여 필요 시 추가 조정이 필요할 수 있습니다.

---

**작성자**: AI Assistant  
**최종 업데이트**: 2024-12-01

