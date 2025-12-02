/**
 * @file types/naver.ts
 * @description Naver Search API 타입 정의
 * 
 * Naver 쇼핑 검색 API의 요청/응답 타입을 정의합니다.
 * 
 * @see https://developers.naver.com/docs/serviceapi/search/shopping/shopping.md
 */

// ============================================================================
// API 인증 관련
// ============================================================================

export interface NaverApiCredentials {
  clientId: string;
  clientSecret: string;
}

// ============================================================================
// 쇼핑 검색 관련 타입
// ============================================================================

export interface NaverShoppingSearchRequest {
  query: string; // 검색어 (예: "나이키 덩크 로우 260")
  display?: number; // 한 번에 표시할 검색 결과 개수 (기본값: 10, 최대: 100)
  start?: number; // 검색 시작 위치 (기본값: 1, 최대: 1000)
  sort?: 'sim' | 'date' | 'asc' | 'dsc'; // 정렬 옵션 (sim: 정확도순, asc: 가격 오름차순, dsc: 가격 내림차순)
  filter?: string; // 필터 옵션 (예: "naverpay" - 네이버페이 상품만)
}

export interface NaverShoppingItem {
  title: string; // 상품명 (HTML 태그 포함 가능)
  link: string; // 상품 링크
  image: string; // 썸네일 이미지 URL
  lprice: string; // 최저가 (문자열, 예: "145000")
  hprice: string; // 최고가 (문자열, 예: "180000")
  mallName: string; // 쇼핑몰 이름
  productId: string; // 상품 ID
  productType: string; // 상품 타입 (1: 일반, 2: 중고, 3: 단종)
  brand: string; // 브랜드명
  maker: string; // 제조사
  category1: string; // 카테고리 1
  category2: string; // 카테고리 2
  category3: string; // 카테고리 3
  category4: string; // 카테고리 4
}

export interface NaverShoppingSearchResponse {
  lastBuildDate: string; // 검색 결과를 생성한 시간
  total: number; // 총 검색 결과 개수
  start: number; // 검색 시작 위치
  display: number; // 한 번에 표시할 검색 결과 개수
  items: NaverShoppingItem[];
}

// ============================================================================
// 가공된 데이터 타입 (UI 표시용)
// ============================================================================

export interface ProcessedNaverItem {
  title: string; // HTML 태그 제거된 상품명
  link: string;
  image: string;
  price: number; // 숫자로 변환된 최저가
  mallName: string;
  isOverseas: boolean; // 해외직구 여부
  isTrusted: boolean; // 신뢰할 수 있는 몰인지 (크림, 솔드아웃 등)
}

export interface NaverPriceSummary {
  lowestPrice: number; // 최저가
  averagePrice: number; // 평균가 (상위 3-5개)
  trustedPrice?: number; // 신뢰할 수 있는 몰의 최저가
  items: ProcessedNaverItem[]; // 상위 3-5개 상품
}

// ============================================================================
// 에러 타입
// ============================================================================

export interface NaverApiError {
  errorCode: string;
  errorMessage: string;
}

export class NaverApiException extends Error {
  errorCode: string;

  constructor(error: NaverApiError) {
    super(error.errorMessage);
    this.name = 'NaverApiException';
    this.errorCode = error.errorCode;
  }
}

// ============================================================================
// 필터링 옵션
// ============================================================================

export interface NaverSearchFilters {
  excludeOverseas?: boolean; // 해외직구 제외
  trustedMallsOnly?: boolean; // 신뢰할 수 있는 몰만 (크림, 솔드아웃 등)
  minPrice?: number; // 최저가 필터
  maxPrice?: number; // 최고가 필터
}

// 신뢰할 수 있는 쇼핑몰 리스트 (확장 가능)
export const TRUSTED_MALLS = [
  'KREAM',
  '크림',
  'SOLDOUT',
  '솔드아웃',
  '무신사',
  'MUSINSA',
  '29CM',
] as const;

// 해외직구 키워드 (확장 가능)
export const OVERSEAS_KEYWORDS = [
  '해외배송',
  '해외직구',
  '직구',
  'overseas',
  'global',
] as const;

