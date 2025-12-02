/**
 * @file lib/naver-api.ts
 * @description Naver Search API 클라이언트
 * 
 * Naver 쇼핑 검색 API와 통신하기 위한 함수들을 제공합니다.
 * 
 * 주요 기능:
 * 1. 쇼핑 상품 검색
 * 2. 검색 결과 필터링 (해외직구 제외, 신뢰할 수 있는 몰만 등)
 * 3. 가격 정보 요약
 * 
 * @dependencies
 * - ky: HTTP 클라이언트
 * 
 * @security
 * 이 파일은 반드시 Server-side에서만 사용해야 합니다.
 * API 키가 클라이언트에 노출되어서는 안 됩니다.
 * 
 * @see https://developers.naver.com/docs/serviceapi/search/shopping/shopping.md
 */

import ky from 'ky';
import type {
  NaverApiCredentials,
  NaverShoppingSearchRequest,
  NaverShoppingSearchResponse,
  NaverShoppingItem,
  ProcessedNaverItem,
  NaverPriceSummary,
  NaverSearchFilters,
  NaverApiException,
  TRUSTED_MALLS,
  OVERSEAS_KEYWORDS,
} from '@/types/naver';

// ============================================================================
// 설정
// ============================================================================

const NAVER_API_BASE_URL = 'https://openapi.naver.com/v1';

/**
 * 환경 변수에서 Naver API 인증 정보를 가져옵니다.
 * 
 * @throws {Error} 환경 변수가 설정되지 않은 경우
 */
function getCredentials(): NaverApiCredentials {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Naver API credentials not found. Please set NAVER_CLIENT_ID and NAVER_CLIENT_SECRET in .env file.'
    );
  }

  return { clientId, clientSecret };
}

// ============================================================================
// HTTP 클라이언트 설정
// ============================================================================

/**
 * Naver API 요청을 위한 ky 인스턴스를 생성합니다.
 * 
 * @returns 설정된 ky 인스턴스
 */
function createNaverClient() {
  const { clientId, clientSecret } = getCredentials();

  return ky.create({
    prefixUrl: NAVER_API_BASE_URL,
    headers: {
      'X-Naver-Client-Id': clientId,
      'X-Naver-Client-Secret': clientSecret,
    },
    timeout: 10000, // 10초
    retry: {
      limit: 2,
      methods: ['get'],
      statusCodes: [408, 429, 500, 502, 503, 504],
    },
  });
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * HTML 태그를 제거합니다.
 * 
 * @param html - HTML 문자열
 * @returns 태그가 제거된 문자열
 */
function stripHtml(html: string): string {
  return html.replace(/<\/?[^>]+(>|$)/g, '');
}

/**
 * 해외직구 상품인지 확인합니다.
 * 
 * @param item - 네이버 쇼핑 아이템
 * @returns 해외직구 여부
 */
function isOverseasItem(item: NaverShoppingItem): boolean {
  const checkText = `${item.title} ${item.mallName}`.toLowerCase();
  const keywords = ['해외배송', '해외직구', '직구', 'overseas', 'global'] as string[];
  
  return keywords.some((keyword) => checkText.includes(keyword));
}

/**
 * 신뢰할 수 있는 몰인지 확인합니다.
 * 
 * @param item - 네이버 쇼핑 아이템
 * @returns 신뢰할 수 있는 몰 여부
 */
function isTrustedMall(item: NaverShoppingItem): boolean {
  const mallName = item.mallName.toLowerCase();
  const trustedMalls = [
    'kream',
    '크림',
    'soldout',
    '솔드아웃',
    '무신사',
    'musinsa',
    '29cm',
  ] as string[];
  
  return trustedMalls.some((trusted) => mallName.includes(trusted));
}

/**
 * 네이버 쇼핑 아이템을 가공합니다.
 * 
 * @param item - 네이버 쇼핑 아이템
 * @returns 가공된 아이템
 */
function processNaverItem(item: NaverShoppingItem): ProcessedNaverItem {
  return {
    title: stripHtml(item.title),
    link: item.link,
    image: item.image,
    price: parseInt(item.lprice, 10),
    mallName: item.mallName,
    isOverseas: isOverseasItem(item),
    isTrusted: isTrustedMall(item),
  };
}

/**
 * 검색 결과를 필터링합니다.
 * 
 * @param items - 검색 결과
 * @param filters - 필터링 옵션
 * @returns 필터링된 결과
 */
function filterItems(
  items: ProcessedNaverItem[],
  filters: NaverSearchFilters = {}
): ProcessedNaverItem[] {
  let filtered = items;

  // 해외직구 제외
  if (filters.excludeOverseas) {
    filtered = filtered.filter((item) => !item.isOverseas);
  }

  // 신뢰할 수 있는 몰만
  if (filters.trustedMallsOnly) {
    filtered = filtered.filter((item) => item.isTrusted);
  }

  // 가격 범위 필터
  if (filters.minPrice) {
    filtered = filtered.filter((item) => item.price >= filters.minPrice!);
  }
  if (filters.maxPrice) {
    filtered = filtered.filter((item) => item.price <= filters.maxPrice!);
  }

  return filtered;
}

// ============================================================================
// API 함수들
// ============================================================================

/**
 * 네이버 쇼핑 검색을 수행합니다.
 * 
 * @param request - 검색 요청
 * @returns 검색 결과
 * 
 * @example
 * ```typescript
 * const results = await searchShopping({ query: '나이키 덩크 로우 260', display: 10, sort: 'asc' });
 * ```
 */
export async function searchShopping(
  request: NaverShoppingSearchRequest
): Promise<NaverShoppingSearchResponse> {
  console.group('🛍️ Naver API: searchShopping');
  console.log('Request:', request);
  
  try {
    const client = createNaverClient();
    
    const searchParams = new URLSearchParams({
      query: request.query,
      display: (request.display || 10).toString(),
      start: (request.start || 1).toString(),
      ...(request.sort && { sort: request.sort }),
      ...(request.filter && { filter: request.filter }),
    });
    
    const response = await client.get(`search/shop.json?${searchParams}`).json<NaverShoppingSearchResponse>();
    
    console.log('✅ Success:', {
      total: response.total,
      count: response.items.length,
    });
    console.groupEnd();
    
    return response;
  } catch (error) {
    console.error('❌ Error:', error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 네이버 쇼핑 검색을 수행하고 가격 정보를 요약합니다.
 * 
 * @param query - 검색어 (예: "나이키 덩크 로우 260")
 * @param filters - 필터링 옵션
 * @returns 가격 정보 요약
 * 
 * @example
 * ```typescript
 * const summary = await getNaverPriceSummary('나이키 덩크 로우 260', {
 *   excludeOverseas: true,
 *   trustedMallsOnly: false,
 * });
 * ```
 */
export async function getNaverPriceSummary(
  query: string,
  filters: NaverSearchFilters = {}
): Promise<NaverPriceSummary> {
  console.group('📊 Naver API: getNaverPriceSummary');
  console.log('Query:', query);
  console.log('Filters:', filters);
  
  try {
    // 1. 검색 수행 (가격 오름차순, 상위 20개)
    const response = await searchShopping({
      query,
      display: 20,
      sort: 'asc', // 가격 오름차순
    });
    
    // 2. 아이템 가공
    const processedItems = response.items.map(processNaverItem);
    
    // 3. 필터링
    const filteredItems = filterItems(processedItems, filters);
    
    if (filteredItems.length === 0) {
      console.warn('⚠️ No items found after filtering');
      console.groupEnd();
      return {
        lowestPrice: 0,
        averagePrice: 0,
        items: [],
      };
    }
    
    // 4. 가격 정보 계산
    const prices = filteredItems.map((item) => item.price);
    const lowestPrice = Math.min(...prices);
    
    // 상위 3-5개의 평균가 계산 (이상치 제외)
    const topItems = filteredItems.slice(0, 5);
    const averagePrice = Math.round(
      topItems.reduce((sum, item) => sum + item.price, 0) / topItems.length
    );
    
    // 신뢰할 수 있는 몰의 최저가
    const trustedItems = filteredItems.filter((item) => item.isTrusted);
    const trustedPrice = trustedItems.length > 0
      ? Math.min(...trustedItems.map((item) => item.price))
      : undefined;
    
    const summary: NaverPriceSummary = {
      lowestPrice,
      averagePrice,
      trustedPrice,
      items: topItems.slice(0, 3), // 상위 3개만 반환
    };
    
    console.log('✅ Success:', summary);
    console.groupEnd();
    
    return summary;
  } catch (error) {
    console.error('❌ Error:', error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 품번과 사이즈로 검색어를 생성합니다.
 * 
 * @param styleCode - 품번 (예: "DD1503-101")
 * @param size - 사이즈 (선택적, 예: "260")
 * @returns 검색어
 * 
 * @example
 * ```typescript
 * const query1 = buildSearchQuery('DD1503-101'); // "DD1503-101"
 * const query2 = buildSearchQuery('DD1503-101', '260'); // "DD1503-101 260"
 * ```
 */
export function buildSearchQuery(styleCode: string, size?: string): string {
  return size ? `${styleCode} ${size}` : styleCode;
}

/**
 * Naver API 연결 상태를 확인합니다.
 * 
 * @returns 연결 성공 여부
 */
export async function checkConnection(): Promise<boolean> {
  try {
    // 간단한 검색으로 연결 테스트
    await searchShopping({ query: 'test', display: 1 });
    return true;
  } catch (error) {
    console.error('Naver API connection failed:', error);
    return false;
  }
}

