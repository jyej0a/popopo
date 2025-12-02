# POIZON API - 판매량 통계 데이터

> 작성일: 2024-12-01  
> 관련 이슈: statisticsDataQry 파라미터 추가

## 📊 발견 사항

POIZON API는 `statisticsDataQry` 파라미터를 통해 **판매량 통계 데이터**를 제공합니다!

### 제공 필드

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `localSoldNum` | `number` | **30일 지역 판매량** (Local Sales in 30 Days) |
| `globalSoldNum` | `number` | **30일 글로벌 판매량** (Global Sales in 30 Days) |
| `localMonthToMonth` | `number` | 전년 대비 지역 판매 증가율 (YoY Local Sales Growth) |
| `globalMonthToMonth` | `number` | 전년 대비 글로벌 판매 증가율 (YoY Global Sales Growth) |
| `averagePrice` | `object` | 30일 평균 거래 가격 |
| `averagePrice.amount` | `string` | 가격 (문자열) |
| `averagePrice.minUnitValue` | `number` | 최소 단위 가격 |
| `averagePrice.globalAveragePrice` | `object` | 글로벌 평균 가격 |

## 🔧 구현

### 1. API 요청 시 파라미터 추가

```typescript
// lib/poizon-api.ts

export async function searchByStyleCode(
  request: PoizonSkuSearchRequest
): Promise<PoizonSkuSearchResponse> {
  const response = await makePoizonRequest<PoizonSkuSearchResponse>(
    '/dop/api/v1/pop/api/v1/intl-commodity/intl/sku/sku-basic-info/by-article-number',
    {
      articleNumber: request.articleNumber,
      region: request.region,
      language: request.language,
      timeZone: request.timeZone,
      // ✅ 판매량 통계 데이터 요청
      statisticsDataQry: {
        language: request.language || 'en',
        region: request.region,
      },
    }
  );

  return response.data;
}
```

### 2. 타입 정의 업데이트

```typescript
// types/poizon.ts

export interface PoizonSkuInfo {
  globalSkuId: number;
  properties?: string;
  // ... 기존 필드들 ...
  
  // ✅ 판매량 통계 (statisticsDataQry 요청 시 포함)
  localSoldNum?: number; // 30일 지역 판매량
  globalSoldNum?: number; // 30일 글로벌 판매량
  localMonthToMonth?: number; // 전년 대비 지역 판매 증가율
  globalMonthToMonth?: number; // 전년 대비 글로벌 판매 증가율
  averagePrice?: {
    amount?: string;
    minUnitValue?: number;
    globalAveragePrice?: {
      amount?: string;
      minUnitValue?: number;
    };
  };
}
```

## 📝 사용 예시

### 품번으로 검색 + 판매량 조회

```typescript
import { searchByStyleCode } from '@/lib/poizon-api';

const result = await searchByStyleCode({
  articleNumber: 'DD1503-101',
  region: 'US',
  language: 'en',
});

// 결과에 판매량 데이터 포함
result.forEach((item) => {
  item.skuInfoList.forEach((sku) => {
    console.log(`사이즈: ${sku.properties}`);
    console.log(`지역 30일 판매량: ${sku.localSoldNum || 0}`);
    console.log(`글로벌 30일 판매량: ${sku.globalSoldNum || 0}`);
    console.log(`평균 가격: ${sku.averagePrice?.amount || 'N/A'}`);
  });
});
```

### globalSpuId로 SKU 목록 + 판매량 조회

```typescript
import { getSkusBySpuId } from '@/lib/poizon-api';

const result = await getSkusBySpuId({
  globalSpuIds: [11000001234],
  region: 'US',
  language: 'en',
});

result.contents.forEach((spu) => {
  console.log(`상품: ${spu.title}`);
  
  spu.skuList.forEach((sku) => {
    console.log(`  - 사이즈: ${sku.properties}`);
    console.log(`    판매량: ${sku.globalSoldNum || 0}`);
  });
});
```

## 🎯 활용 방안

### 1. 마진 분석에 활용

```typescript
// 판매량이 높은 사이즈를 우선 입찰
const popularSizes = skuList
  .filter(sku => (sku.globalSoldNum || 0) > 100) // 30일 판매량 100개 이상
  .sort((a, b) => (b.globalSoldNum || 0) - (a.globalSoldNum || 0));
```

### 2. 가격 전략 수립

```typescript
// 판매량 대비 평균 가격 분석
skuList.forEach(sku => {
  const soldNum = sku.globalSoldNum || 0;
  const avgPrice = sku.averagePrice?.minUnitValue || 0;
  
  // 판매량이 많고 평균가가 높은 = 수요 높음
  if (soldNum > 50 && avgPrice > 10000) {
    console.log(`인기 사이즈: ${sku.properties}`);
  }
});
```

### 3. 재고 우선순위 결정

```typescript
// 판매량 증가율이 높은 사이즈 우선
const trendingSizes = skuList
  .filter(sku => (sku.globalMonthToMonth || 0) > 0.2) // 전년 대비 20% 이상 증가
  .sort((a, b) => (b.globalMonthToMonth || 0) - (a.globalMonthToMonth || 0));
```

## 📚 참고 자료

- [POIZON API 문서](https://open.poizon.com/doc/list/apiDetail/159?openKey=11)
- [품번으로 SKU 조회 API](https://open.poizon.com/doc/list/apiDetail/140?openKey=11)
- [globalSpuId로 SKU 조회 API](https://open.poizon.com/doc/list/apiDetail/159?openKey=11)

## ✅ 체크리스트

- [x] `statisticsDataQry` 파라미터 추가
- [x] `searchByStyleCode` 함수 업데이트
- [x] `getSkusBySpuId` 함수 업데이트
- [x] 타입 정의 업데이트 (`PoizonSkuInfo`, `PoizonSkuListItem`)
- [x] 문서화 완료
- [ ] 대시보드 UI에 판매량 표시 추가
- [ ] 판매량 기반 정렬 기능 추가
- [ ] 판매량 히스토리 저장 (Supabase)

---

**작성자**: AI Assistant  
**최종 업데이트**: 2024-12-01

