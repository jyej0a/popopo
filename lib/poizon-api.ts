/**
 * @file lib/poizon-api.ts
 * @description POIZON API 클라이언트
 * 
 * POIZON 판매자 API와 통신하기 위한 함수들을 제공합니다.
 * 모든 요청은 MD5 서명이 필요합니다.
 * 
 * 주요 기능:
 * 1. API 서명 생성 (MD5)
 * 2. 품번으로 상품 검색
 * 3. SKU 목록 조회
 * 4. 시장 최저가 조회
 * 5. 입찰 등록/수정
 * 
 * @dependencies
 * - ky: HTTP 클라이언트
 * - md5: MD5 해시 생성
 * 
 * @security
 * 이 파일은 반드시 Server-side에서만 사용해야 합니다.
 * API 키가 클라이언트에 노출되어서는 안 됩니다.
 * 
 * @reference
 * - API 문서: https://open.poizon.com/doc/list/documentationDetail/15
 * - 인증 가이드: https://open.poizon.com/doc/list/documentationDetail/9
 */

import ky from 'ky';
import md5 from 'md5';
import type {
  PoizonApiCredentials,
  PoizonBaseResponse,
  PoizonSkuSearchRequest,
  PoizonSkuSearchResponse,
  PoizonSkuListRequest,
  PoizonSkuListResponse,
  PoizonMarketPriceRequest,
  PoizonMarketPriceResponse,
  PoizonListingRequest,
  PoizonListingResponse,
  PoizonListingUpdateRequest,
} from '@/types/poizon';

// ============================================================================
// 설정
// ============================================================================

const POIZON_API_BASE_URL = 'https://open.poizon.com';

/**
 * 환경 변수에서 POIZON API 인증 정보를 가져옵니다.
 */
function getCredentials(): PoizonApiCredentials {
  const appKey = process.env.POIZON_APP_KEY;
  const appSecret = process.env.POIZON_APP_SECRET;

  if (!appKey || !appSecret) {
    throw new Error(
      'POIZON API credentials not found. Please set POIZON_APP_KEY and POIZON_APP_SECRET in .env file.'
    );
  }

  return { appKey, appSecret };
}

// ============================================================================
// 서명 생성 함수 (MD5)
// ============================================================================

/**
 * 값을 문자열로 변환 (배열 및 객체 처리 포함)
 */
function valueToString(value: unknown): string {
  if (Array.isArray(value)) {
    // 배열의 경우, 각 요소를 JSON 문자열로 변환 후 쉼표로 연결
    return value.map(item => {
      if (typeof item === 'object' && item !== null) {
        return JSON.stringify(item);
      }
      return String(item);
    }).join(',');
  } else if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * POIZON API 요청에 필요한 MD5 서명을 생성합니다.
 * 
 * 공식 문서 기준:
 * 1. app_key와 timestamp를 포함한 모든 파라미터를 ASCII 순으로 정렬
 * 2. 비어있지 않은 값만 포함
 * 3. key=value 형식으로 URL 인코딩하여 연결 (& 구분자)
 * 4. 마지막에 appSecret 추가 (& 없이)
 * 5. MD5 해시 계산 후 대문자로 변환
 * 
 * @param params - API 요청 파라미터 (app_key, timestamp 포함)
 * @param appSecret - App Secret
 * @returns MD5 서명 (대문자)
 */
export function generateSignature(
  params: Record<string, unknown>,
  appSecret: string
): string {
  console.group('🔐 Generating MD5 Signature');
  console.log('Input params:', params);

  // 1. 비어있지 않은 파라미터만 필터링 및 정렬
  const sortedKeys = Object.keys(params)
    .filter(key => {
      const value = params[key];
      return value !== null && value !== undefined && value !== '';
    })
    .sort(); // ASCII 순 정렬

  console.log('Sorted keys:', sortedKeys);

  // 2. key=value 형식으로 URL 인코딩하여 연결
  let signString = sortedKeys
    .map(key => {
      const value = valueToString(params[key]);
      // URL 인코딩
      const encodedKey = encodeURIComponent(key);
      const encodedValue = encodeURIComponent(value);
      return `${encodedKey}=${encodedValue}`;
    })
    .join('&');

  // 2-1. 공백을 + 로 치환 (POIZON API 요구사항)
  signString = signString.replace(/%20/gi, '+');

  // 3. appSecret 추가 (& 없이)
  const signStringWithSecret = signString + appSecret;
  
  console.log('Sign string:', signString);
  console.log('Sign string with secret:', signStringWithSecret.substring(0, 100) + '...');

  // 4. MD5 해시 계산 후 대문자 변환
  const signature = md5(signStringWithSecret).toUpperCase();
  
  console.log('Generated signature:', signature);
  console.groupEnd();

  return signature;
}

// ============================================================================
// API 요청 함수
// ============================================================================

/**
 * POIZON API 요청을 실행합니다.
 * 
 * @param endpoint - API 엔드포인트 경로
 * @param businessParams - 비즈니스 파라미터
 * @returns API 응답
 */
async function makePoizonRequest<T>(
  endpoint: string,
  businessParams: Record<string, unknown>
): Promise<PoizonBaseResponse<T>> {
  console.group(`📡 POIZON API Request: ${endpoint}`);
  
  try {
    const { appKey, appSecret } = getCredentials();
    const timestamp = Date.now();

    // 공통 파라미터 + 비즈니스 파라미터
    const allParams = {
      app_key: appKey,
      timestamp,
      language: businessParams.language || 'en',
      timeZone: businessParams.timeZone || 'Asia/Shanghai',
      ...businessParams,
    };

    // 서명 생성
    const sign = generateSignature(allParams, appSecret);

    // 최종 요청 본문
    const requestBody = {
      ...allParams,
      sign,
    };

    console.log('Request body (without sign):', { ...allParams });
    console.log('Request URL:', `${POIZON_API_BASE_URL}${endpoint}`);

    // API 호출
    const response = await ky.post(`${POIZON_API_BASE_URL}${endpoint}`, {
      json: requestBody,
      timeout: 30000,
      retry: {
        limit: 2,
        methods: ['post'],
        statusCodes: [408, 429, 500, 502, 503, 504],
      },
    }).json<PoizonBaseResponse<T>>();

    console.log('Response:', response);
    console.groupEnd();

    // 응답 코드 확인 (200 = 성공)
    if (response.code !== 200) {
      throw new Error(`POIZON API Error: [${response.code}] ${response.msg}`);
    }

    return response;
  } catch (error) {
    console.error('❌ API Request Failed:', error);
    console.groupEnd();
    throw error;
  }
}

// ============================================================================
// 공개 API 함수들
// ============================================================================

/**
 * 품번(스타일 코드)으로 SKU 검색
 * 
 * @param request - 검색 요청 (품번, 지역)
 * @returns SKU 목록
 * 
 * @example
 * ```typescript
 * const result = await searchByStyleCode({
 *   articleNumber: 'DD1503-101',
 *   region: 'US'
 * });
 * ```
 */
export async function searchByStyleCode(
  request: PoizonSkuSearchRequest
): Promise<PoizonSkuSearchResponse> {
  console.log('');
  console.log('📌📌📌 Article Number API 호출 📌📌📌');
  console.log('articleNumber:', request.articleNumber);
  console.log('region:', request.region);
  console.log('language:', request.language);
  console.log('statisticsDataQry:', {
    language: request.language || 'en',
    region: request.region,
  });
  console.log('');

  const response = await makePoizonRequest<PoizonSkuSearchResponse>(
    '/dop/api/v1/pop/api/v1/intl-commodity/intl/sku/sku-basic-info/by-article-number',
    {
      articleNumber: request.articleNumber,
      region: request.region,
      language: request.language,
      timeZone: request.timeZone,
      // 판매량 통계 데이터 요청
      statisticsDataQry: {
        language: request.language || 'en',
        region: request.region,
      },
    }
  );

  console.log('');
  console.log('📊 Article Number API 응답:');
  console.log('spuInfo:', response.data.spuInfo ? '있음' : '없음');
  console.log('skuInfoList 개수:', response.data.skuInfoList?.length || 0);
  if (response.data.skuInfoList && response.data.skuInfoList.length > 0) {
    const firstSku = response.data.skuInfoList[0];
    console.log('첫 번째 SKU 판매량 필드:', {
      localSoldNum: firstSku.localSoldNum,
      globalSoldNum: firstSku.globalSoldNum,
      localMonthToMonth: (firstSku as any).localMonthToMonth,
      globalMonthToMonth: (firstSku as any).globalMonthToMonth,
    });
  }
  console.log('');

  return response.data;
}

/**
 * 판매자 커스텀 코드로 SKU & SPU 정보 조회 (다국어, 판매량 포함)
 * 
 * @param request - 검색 요청 (커스텀 코드, 지역)
 * @returns SKU 목록
 * 
 * @example
 * ```typescript
 * const result = await searchByCustomCode({
 *   customCode: 'DD1503-101',
 *   region: 'US'
 * });
 * ```
 */
export async function searchByCustomCode(
  request: PoizonSkuSearchRequest & {
    sellerStatusEnable?: boolean;
    buyStatusEnable?: boolean;
  }
): Promise<PoizonSkuSearchResponse> {
  console.log('');
  console.log('🔥🔥🔥 Custom Code API 호출 🔥🔥🔥');
  console.log('customCode:', request.articleNumber);
  console.log('region:', request.region);
  console.log('language:', request.language);
  console.log('statisticsDataQry 포함:', true);
  console.log('');

  const response = await makePoizonRequest<PoizonSkuSearchResponse>(
    '/dop/api/v1/pop/api/v1/intl-commodity/intl/sku/sku-basic-info/by-custom-code',
    {
      customCode: request.articleNumber, // articleNumber를 customCode로 사용
      region: request.region,
      language: request.language || 'en',
      timeZone: request.timeZone || 'Asia/Shanghai',
      sellerStatusEnable: request.sellerStatusEnable || false,
      buyStatusEnable: request.buyStatusEnable || false,
      // 판매량 통계 데이터 요청
      statisticsDataQry: {
        language: request.language || 'en',
        region: request.region,
      },
    }
  );

  console.log('');
  console.log('📊 Custom Code API 응답:');
  console.log('spuInfo:', response.data.spuInfo ? '있음' : '없음');
  console.log('skuInfoList 개수:', response.data.skuInfoList?.length || 0);
  if (response.data.skuInfoList && response.data.skuInfoList.length > 0) {
    const firstSku = response.data.skuInfoList[0];
    console.log('첫 번째 SKU 판매량:', {
      localSoldNum: firstSku.localSoldNum,
      globalSoldNum: firstSku.globalSoldNum,
      localMonthToMonth: (firstSku as any).localMonthToMonth,
      globalMonthToMonth: (firstSku as any).globalMonthToMonth,
    });
  }
  console.log('');

  return response.data;
}

/**
 * globalSpuId로 SKU 목록 조회
 * 
 * @param request - SKU 목록 요청
 * @returns SKU 목록 (사이즈별)
 */
export async function getSkusBySpuId(
  request: PoizonSkuListRequest
): Promise<PoizonSkuListResponse> {
  const response = await makePoizonRequest<PoizonSkuListResponse>(
    '/dop/api/v1/pop/api/v1/intl-commodity/intl/sku/sku-basic-info/by-global-spu',
    {
      globalSpuIds: request.globalSpuIds,
      region: request.region,
      language: request.language,
      timeZone: request.timeZone,
      sellerStatusEnable: false,
      buyStatusEnable: false,
      // 판매량 통계 데이터 요청
      statisticsDataQry: {
        language: request.language || 'en',
        region: request.region,
      },
    }
  );

  return response.data;
}

/**
 * 시장 최저가 조회 (입찰 추천)
 * 
 * @param request - 시장가 조회 요청
 * @returns 시장 최저가 정보
 */
export async function getMarketPrice(
  request: PoizonMarketPriceRequest
): Promise<PoizonMarketPriceResponse> {
  const response = await makePoizonRequest<PoizonMarketPriceResponse>(
    '/dop/api/v1/pop/api/v1/recommend-bid/price',
    {
      globalSkuId: request.globalSkuId,
      skuId: request.skuId,
      biddingType: request.biddingType,
      region: request.region,
      currency: request.currency,
      countryCode: request.region, // 같은 값 사용
      language: request.language,
      timeZone: request.timeZone,
    }
  );

  return response.data;
}

/**
 * 입찰 등록 (Manual Listing - Ship-to-verify)
 * 
 * @param request - 입찰 요청
 * @returns 입찰 결과
 */
export async function createListing(
  request: PoizonListingRequest
): Promise<PoizonListingResponse> {
  const response = await makePoizonRequest<PoizonListingResponse>(
    '/dop/api/v1/pop/api/v1/submit-bid/normal-autonomous-bidding',
    {
      requestId: request.requestId,
      globalSkuId: request.globalSkuId,
      skuId: request.skuId,
      price: request.price,
      quantity: request.quantity,
      deliveryCountryCode: request.deliveryCountryCode,
      countryCode: request.countryCode,
      currency: request.currency,
      refererSource: 'pop',
      language: request.language,
      timeZone: request.timeZone,
    }
  );

  return response.data;
}

/**
 * 입찰 수정 (Update Manual Listing - Ship-to-verify)
 * 
 * @param request - 입찰 수정 요청
 * @returns 수정 결과
 */
export async function updateListing(
  request: PoizonListingUpdateRequest
): Promise<PoizonListingResponse> {
  const response = await makePoizonRequest<PoizonListingResponse>(
    '/dop/api/v1/pop/api/v1/submit-bid/update-normal-autonomous-bidding',
    {
      sellerBiddingNo: request.sellerBiddingNo,
      price: request.price,
      quantity: request.quantity,
      currency: request.currency,
      language: request.language,
      timeZone: request.timeZone,
    }
  );

  return response.data;
}

/**
 * 브랜드 ID로 SPU 정보 조회 (판매량 통계 포함)
 * 
 * @param brandIdList - 브랜드 ID 배열
 * @param scrollId - 페이지네이션용 스크롤 ID (첫 요청은 null)
 * @param pageSize - 페이지 크기
 * @returns SPU 목록 (판매량 포함)
 * 
 * @reference https://open.poizon.com/doc/list/apiDetail/182?openKey=11
 */
export async function getSpusByBrandId(params: {
  brandIdList: number[];
  scrollId?: string | null;
  pageSize?: number;
  region: string;
  language?: string;
  timeZone?: string;
}): Promise<{
  contents: Array<{
    spuId: number;
    globalSpuId: number;
    title: string;
    logoUrl?: string;
    brandId: number;
    brandName: string;
    articleNumber?: string;
    categoryName?: string;
    minPrice?: Record<string, unknown>;
    // 판매량 통계
    localSoldNum?: number;
    globalSoldNum?: number;
    localMonthToMonth?: number;
    globalMonthToMonth?: number;
    averagePrice?: {
      amount?: string;
      minUnitValue?: number;
    };
  }>;
  scrollId: string | null;
}> {
  // scrollId 처리: 첫 요청이면 빈 문자열, 아니면 실제 값
  const requestParams: Record<string, any> = {
    brandIdList: params.brandIdList,
    pageSize: params.pageSize || 20,
    pageNum: 1,
    region: params.region,
    language: params.language,
    timeZone: params.timeZone,
    // 판매량 통계 데이터 요청
    statisticsDataQry: {
      language: params.language || 'en',
      region: params.region,
    },
  };
  
  // scrollId는 첫 요청에서는 빈 문자열로
  if (params.scrollId) {
    requestParams.scrollId = params.scrollId;
  } else {
    requestParams.scrollId = '';
  }
  
  console.log('');
  console.log('🔄🔄🔄 브랜드 API 요청 파라미터 🔄🔄🔄');
  console.log('brandIdList:', requestParams.brandIdList);
  console.log('scrollId:', `"${requestParams.scrollId}"`);
  console.log('pageSize:', requestParams.pageSize);
  console.log('region:', requestParams.region);
  console.log('');

  const response = await makePoizonRequest<{
    contents: any[];
    scrollId: string | null;
  }>(
    '/dop/api/v1/pop/api/v1/intl-commodity/intl/spu/spu-basic-info/scroll-by-brandId',
    requestParams
  );

  return response.data;
}

/**
 * API 연결 상태 확인
 */
export async function checkConnection(): Promise<boolean> {
  try {
    // 간단한 API 호출로 연결 테스트
    await searchByStyleCode({
      articleNumber: 'TEST',
      region: 'US',
    });
    return true;
  } catch (error) {
    console.error('POIZON API connection failed:', error);
    return false;
  }
}
