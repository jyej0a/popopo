/**
 * @file types/poizon.ts
 * @description POIZON API 타입 정의
 * 
 * POIZON Open Platform 공식 API 구조에 맞춘 타입 정의
 * 
 * @reference
 * - API 문서: https://open.poizon.com/doc/list/documentationDetail/15
 * - 인증 가이드: https://open.poizon.com/doc/list/documentationDetail/9
 */

// ============================================================================
// API 인증 관련
// ============================================================================

export interface PoizonApiCredentials {
  appKey: string;
  appSecret: string;
}

// ============================================================================
// 공통 응답 구조
// ============================================================================

/**
 * POIZON API 기본 응답 형식
 * - code: 200 = 성공, 그 외 = 실패
 * - msg: 응답 메시지
 * - data: 실제 데이터
 */
export interface PoizonBaseResponse<T = unknown> {
  code: number; // 200 = success
  msg: string;
  data: T;
  trace_id?: string;
}

// ============================================================================
// 품번 검색 (Query SKU by Article Number)
// ============================================================================

export interface PoizonSkuSearchRequest {
  articleNumber: string; // 품번 (예: DD1503-101)
  region: string; // US, CN, HK, TW, MO, JP, KR, FR, IT, GB, ES, DE
  language?: string;
  timeZone?: string;
}

export interface PoizonSkuInfo {
  globalSkuId: number;
  globalSpuId?: number;
  spuId?: number;
  regionSkuId?: number;
  dwSkuId?: number;
  properties?: string; // 사이즈 (예: "260", "265")
  logoUrl?: string;
  title?: string;
  brand?: string;
  price?: number;
  stock?: number;
  regionSalePvInfoList?: Array<{
    level: number;
    propertyValueId: number;
    name: string;
    value: string;
    definitionId: number;
    sizeInfos?: Array<{
      sizeKey: string;
      value: string;
      default: boolean;
    }>;
  }>;
  minPrice?: Record<string, unknown>;
  buyStatus?: number;
  userHasBid?: boolean;
  skuId?: number;
  status?: number;
  // 판매량 통계 (statisticsDataQry 요청 시 포함)
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

export interface PoizonSpuInfo {
  level2CategoryName?: string;
  fitId?: number;
  level1CategoryName?: string;
  language?: string;
  showApplyButton?: boolean;
  title?: string;
  categoryName?: string;
  fit?: string;
  modifyTime?: string;
  articleNumber?: string;
  regionSpuId?: number;
  level1CategoryId?: number;
  brandName?: string;
  dwSpuId?: number;
  logoUrl?: string;
  userCanBidding?: boolean;
  createTime?: string;
  brandId?: number;
  buyStatus?: number;
  spuId?: number;
  level2CategoryId?: number;
  globalSpuId?: number;
  categoryId?: number;
  status?: number;
}

export interface PoizonSkuSearchResponseItem {
  spuInfo: PoizonSpuInfo;
  spuId: number;
  region: string;
  globalSpuId: number;
  skuInfoList: PoizonSkuInfo[];
}

export type PoizonSkuSearchResponse = PoizonSkuSearchResponseItem[];

// ============================================================================
// SKU 목록 조회 (Query SKU by globalSpuId)
// ============================================================================

export interface PoizonSkuListRequest {
  globalSpuIds: number[]; // 최대 5개
  region: string;
  language?: string;
  timeZone?: string;
  sellerStatusEnable?: boolean;
  buyStatusEnable?: boolean;
}

export interface PoizonSkuListItem {
  globalSkuId: number;
  properties: string; // 사이즈
  price?: number;
  stock?: number;
  salePrice?: number;
  marketPrice?: number;
  // 판매량 통계 (statisticsDataQry 요청 시 포함)
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

export interface PoizonSpuWithSkus {
  globalSpuId: number;
  title?: string;
  logoUrl?: string;
  brand?: string;
  skuList: PoizonSkuListItem[];
}

export interface PoizonSkuListResponse {
  contents: PoizonSpuWithSkus[];
}

// ============================================================================
// 시장 최저가 조회 (Listing Recommendation)
// ============================================================================

export interface PoizonMarketPriceRequest {
  globalSkuId?: number;
  skuId?: number; // DW skuId (둘 중 하나는 필수)
  biddingType: number; // 20: Ship-to-Verify, 25: Consignment
  saleType?: number; // 7: Pre-sale, 0: Ship-to-Verify
  region: string;
  currency: string; // CNY, USD, HKD, JPY, SGD, EUR, KRW
  countryCode?: string;
  language?: string;
  timeZone?: string;
}

export interface PoizonMarketPriceResponse {
  globalMinPrice: number; // 글로벌 최저가
  localMinPrice: number; // 현지 최저가
  usMinPrice: number; // 미국 최저가
  otherPlatformMinPrice?: number; // 다른 플랫폼 최저가
  priceRangeItems?: unknown[];
}

// ============================================================================
// 입찰 등록/수정 (Manual Listing)
// ============================================================================

export interface PoizonListingRequest {
  requestId: string; // 고유 요청 ID (중복 방지)
  globalSkuId?: number;
  skuId?: number; // DW skuId (둘 중 하나는 필수)
  price: number; // 최소 단위 (USD는 센트, KRW는 원)
  quantity: number;
  sizeType?: string; // EU, US, UK, CN, JP
  countryCode: string; // 판매자 출하 국가
  deliveryCountryCode: string; // 배송 출발 국가
  currency: string; // CNY, USD, HKD, JPY, SGD, EUR, KRW
  merchantSource?: string;
  language?: string;
  timeZone?: string;
}

export interface PoizonListingResponse {
  sellerBiddingNo: string; // 입찰 번호
  tips: string; // 안내 메시지
}

export interface PoizonListingUpdateRequest extends PoizonListingRequest {
  sellerBiddingNo: string; // 수정할 입찰 번호
}

// ============================================================================
// 입찰 취소
// ============================================================================

export interface PoizonCancelListingRequest {
  sellerBiddingNo: string;
  language?: string;
  timeZone?: string;
}

export interface PoizonCancelListingResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// 입찰 목록 조회
// ============================================================================

export interface PoizonListingListRequest {
  page?: number;
  pageSize?: number;
  status?: string; // 입찰 상태
  language?: string;
  timeZone?: string;
}

export interface PoizonListingListItem {
  sellerBiddingNo: string;
  globalSkuId: number;
  price: number;
  quantity: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PoizonListingListResponse {
  list: PoizonListingListItem[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================================================
// 브랜드 검색 (Query Brand ID by Brand Name)
// ============================================================================

export interface PoizonBrandSearchRequest {
  brandName: string;
  language?: string;
  timeZone?: string;
}

export interface PoizonBrand {
  brandId: number;
  brandName: string;
  logoUrl?: string;
}

export interface PoizonBrandSearchResponse {
  brandList: PoizonBrand[];
}

// ============================================================================
// 브랜드별 상품 조회 (Query SPU by Brand ID)
// ============================================================================

export interface PoizonSpuByBrandRequest {
  brandId: number;
  categoryId?: number;
  page?: number;
  pageSize?: number;
  language?: string;
  timeZone?: string;
}

export interface PoizonSpu {
  globalSpuId: number;
  spuId?: number;
  title: string;
  logoUrl: string;
  brand?: string;
  categoryId?: number;
  minPrice?: number;
}

export interface PoizonSpuByBrandResponse {
  contents: PoizonSpu[];
  total?: number;
  page?: number;
  pageSize?: number;
}

// ============================================================================
// 레거시 타입 (하위 호환성 유지)
// ============================================================================

/** @deprecated Use PoizonSkuInfo instead */
export interface PoizonProduct {
  spuId: number;
  globalSpuId?: number;
  title: string;
  logoUrl?: string;
  styleCode?: string;
  brand?: string;
  minPrice?: number;
}

/** @deprecated Use PoizonSkuSearchRequest instead */
export interface PoizonProductListRequest {
  keyword?: string;
  brandId?: number;
  page?: number;
  pageSize?: number;
}

/** @deprecated Use PoizonSkuSearchResponse instead */
export interface PoizonProductListResponse {
  list: PoizonProduct[];
  total: number;
}

/** @deprecated Use PoizonSkuInfo instead */
export interface PoizonSku {
  skuId: string;
  spuId: string;
  properties: string;
  price?: number;
  stock?: number;
  lowestAsk?: number;
  salesVolume?: number;
}

/** @deprecated Use PoizonListingRequest instead */
export interface PoizonPriceUpdateRequest {
  skuId: string;
  price: number;
  stock?: number;
}

/** @deprecated Use PoizonListingResponse instead */
export interface PoizonPriceUpdateResponse {
  success: boolean;
  message: string;
  skuId: string;
  newPrice: number;
}

export interface PoizonBulkPriceUpdateRequest {
  updates: PoizonPriceUpdateRequest[];
}

export interface PoizonBulkPriceUpdateResponse {
  successCount: number;
  failCount: number;
  results: {
    skuId: string;
    success: boolean;
    message: string;
  }[];
}

export interface PoizonInventoryItem {
  skuId: string;
  spuId: string;
  properties: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
}

export interface PoizonInventoryListRequest {
  page?: number;
  pageSize?: number;
  status?: 'active' | 'inactive' | 'all';
}

export interface PoizonInventoryListResponse {
  list: PoizonInventoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================================================
// 에러 타입
// ============================================================================

export interface PoizonApiError {
  code: number;
  message: string;
  details?: unknown;
}

export class PoizonApiException extends Error {
  code: number;
  details?: unknown;

  constructor(error: PoizonApiError) {
    super(error.message);
    this.name = 'PoizonApiException';
    this.code = error.code;
    this.details = error.details;
  }
}
