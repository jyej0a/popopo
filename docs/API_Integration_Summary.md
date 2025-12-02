# POIZON API 통합 방식 요약

> 출처: [API Fact Sheet](./API_Fact_Sheet.md)  
> 작성일: 2024-12-01

## 🎯 우리의 선택

### 통합 방식
**Seller Integration with POIZON** ✅
- 판매자가 POIZON API를 호출하여 상품/재고/주문 데이터 관리
- 자체 ERP 시스템 개발자에게 적합

### 리스팅 타입
**Manual Listing** ✅
- 판매자가 시장 상황과 전략에 따라 직접 가격 설정
- 우리는 마진 분석 후 최적 가격으로 입찰

### 풀필먼트 타입
**Ship-to-verify** ✅
- 재고를 자체 창고에 보관
- 주문 발생 시 직접 발송
- 안정적인 재고 관리 능력이 있는 판매자에게 적합

---

## 📚 API 카테고리별 구현 현황

### 1. Commodity (상품 정보)

| API 이름 | 엔드포인트 | 구현 상태 | 함수명 |
|---------|----------|---------|--------|
| Query Sku&Spu Information by Brand Official Item Number | `/intl-commodity/intl/sku/sku-basic-info/by-article-number` | ✅ 완료 | `searchByStyleCode()` |
| Query Sku&Spu Information by globalSkuId - Batch | `/intl-commodity/intl/sku/sku-basic-info/by-global-spu` | ✅ 완료 | `getSkusBySpuId()` |

**용도**: 품번으로 상품 검색 → SKU 목록 조회 → 입찰 대상 선정

---

### 2. Listing (입찰 관리) - **Ship-to-verify 타입**

| API 이름 | 엔드포인트 | 구현 상태 | 함수명 | 중요도 |
|---------|----------|---------|--------|-------|
| Listing Recommendations | `/recommend-bid/price` | ✅ 완료 | `getMarketPrice()` | 🔴 필수 |
| Manual Listing (Ship-to-verify) | `/submit-bid/normal-autonomous-bidding` | ✅ 완료 | `createListing()` | 🔴 필수 |
| Update Manual Listing (Ship-to-verify) | `/submit-bid/update-normal-autonomous-bidding` | ✅ 완료 | `updateListing()` | 🔴 필수 |
| Cancel Listing | `/cancel-listing` (추정) | ❌ 미구현 | - | 🟡 권장 |
| Query Listing List | `/query-listing-list` (추정) | ❌ 미구현 | - | 🟡 권장 |

**용도**: 
1. 시장 최저가 조회 (Listing Recommendations)
2. 입찰가 설정 후 등록 (Manual Listing)
3. 입찰가 수정 (Update Manual Listing)
4. 내 입찰 목록 관리 (Query Listing List)

---

### 3. Order (주문 처리) - **⚠️ 미구현 (중요!)**

| API 이름 | 엔드포인트 | 구현 상태 | 필요성 | 설명 |
|---------|----------|---------|-------|------|
| Query Order List by Order Type | `/order/list` (추정) | ❌ 미구현 | 🔴 필수 | 주문 목록 조회 |
| Confirm Order | `/order/confirm` (추정) | ❌ 미구현 | 🔴 필수 | 주문 확인 |
| Ship Order | `/order/ship` (추정) | ❌ 미구현 | 🔴 필수 | 배송 처리 (송장번호 등록) |
| Get Express Label Info | `/order/label` (추정) | ❌ 미구현 | 🟡 권장 | 송장 라벨 출력 |

**Ship-to-verify 주문 처리 흐름**:
```
1. 고객이 내 입찰가로 구매
   ↓
2. [API] Query Order List - 새 주문 확인
   ↓
3. [API] Confirm Order - 주문 수락
   ↓
4. [물리적] 상품 포장 및 배송사 접수
   ↓
5. [API] Ship Order - 송장번호 등록
   ↓
6. 고객 수령 → POIZON 정산
```

**⚠️ 현재 문제점**: 
- 1단계(입찰)만 구현됨
- 2-5단계 API가 없으면 **실제 판매 불가능**

---

### 4. Bill (정산) - 추후 구현

| API 이름 | 구현 상태 | 필요성 |
|---------|---------|-------|
| Generate Billing Cycle Invoice | ❌ 미구현 | 🟡 권장 |
| Download Billing Cycle Invoice | ❌ 미구현 | 🟡 권장 |
| Get Billing Cycle Reconciliation List | ❌ 미구현 | 🟡 권장 |
| Get Return Orders | ❌ 미구현 | 🟡 권장 |
| Get Real-Time Reconciliation List | ❌ 미구현 | 🟡 권장 |

**용도**: 정산 내역 확인, 수익 분석

---

### 5. Return (반품 처리) - 추후 구현

| API 이름 | 구현 상태 | 필요성 |
|---------|---------|-------|
| Query Return Outbound Order | ❌ 미구현 | 🟡 권장 |
| Query Return Fulfillment Order | ❌ 미구현 | 🟡 권장 |
| Create Self-Pickup Appointment Order | ❌ 미구현 | 🟡 권장 |
| Create Return Order | ❌ 미구현 | 🟡 권장 |

**용도**: 반품 접수 및 처리

---

### 6. Others (기타)

| API 이름 | 구현 상태 | 필요성 |
|---------|---------|-------|
| Get Announcement Details | ❌ 미구현 | 🟢 선택 |

---

## 🚨 즉시 조치 필요 사항

### 우선순위 1: 입찰 관리 완성 (단기)
```typescript
// lib/poizon-api.ts에 추가

/**
 * 입찰 취소
 */
export async function cancelListing(
  sellerBiddingNo: string
): Promise<void>

/**
 * 내 입찰 목록 조회
 */
export async function getListingList(
  params: {
    page?: number;
    pageSize?: number;
    status?: 'active' | 'inactive' | 'sold';
  }
): Promise<ListingListResponse>
```

### 우선순위 2: 주문 처리 기능 구현 (중기 - 필수!)

**새 파일**: `lib/poizon-order-api.ts`
```typescript
/**
 * 주문 목록 조회
 */
export async function getOrderList(
  params: {
    startDate?: string;
    endDate?: string;
    orderStatus?: string;
    page?: number;
    pageSize?: number;
  }
): Promise<OrderListResponse>

/**
 * 주문 확인 (수락)
 */
export async function confirmOrder(
  orderId: string
): Promise<ConfirmOrderResponse>

/**
 * 배송 처리 (송장번호 등록)
 */
export async function shipOrder(
  params: {
    orderId: string;
    trackingNumber: string;
    courierCode: string;
    courierName?: string;
  }
): Promise<ShipOrderResponse>

/**
 * 송장 라벨 조회
 */
export async function getExpressLabel(
  orderId: string
): Promise<ExpressLabelResponse>
```

**새 파일**: `actions/order-actions.ts`
```typescript
'use server';

import { getOrderList, confirmOrder, shipOrder } from '@/lib/poizon-order-api';

export async function fetchOrders(params: OrderQueryParams) {
  // 주문 목록 조회 로직
}

export async function acceptOrder(orderId: string) {
  // 주문 수락 로직
}

export async function processShipment(orderId: string, trackingInfo: TrackingInfo) {
  // 배송 처리 로직
}
```

**새 페이지**: `app/dashboard/orders/page.tsx`
```typescript
// 주문 관리 대시보드
// - 신규 주문 알림
// - 주문 목록 표시
// - 주문 확인 버튼
// - 송장번호 입력 및 배송 처리
```

### 우선순위 3: 정산/반품 기능 (장기)
- 정산 내역 조회 API
- 반품 처리 API

---

## 📖 참고 문서

### POIZON 공식 문서
- [API 소개](https://open.poizon.com/doc/list/documentationDetail/15)
- [인증 가이드](https://open.poizon.com/doc/list/documentationDetail/9)
- [API Fact Sheet](https://open.poizon.com/doc/api-fact-sheet)

### 프로젝트 문서
- [PRD](./PRD.md) - 제품 요구사항 문서
- [TODO](./TODO.md) - 개발 진행 상황
- [DIR](./DIR.md) - 디렉토리 구조

---

## 💡 중요 인사이트

1. **현재 MVP는 "입찰 등록"까지만 가능**
   - 실제 판매를 위해서는 주문 처리 API 필수

2. **Ship-to-verify 모델의 특성**
   - 주문 수락 → 물리적 배송 → 송장 등록의 프로세스
   - API로 자동화할 수 있는 부분과 수동 작업 구분 필요

3. **API 엔드포인트 추정**
   - Cancel Listing, Query Listing List 등의 정확한 엔드포인트는 공식 문서 확인 필요
   - 주문 관련 API는 별도 섹션에서 확인 필요

4. **다음 단계**
   - 현재 입찰 기능 테스트
   - 주문 API 공식 문서 확인
   - 주문 처리 기능 구현

---

**작성자**: AI Assistant  
**최종 업데이트**: 2024-12-01

