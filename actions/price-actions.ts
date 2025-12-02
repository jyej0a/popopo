/**
 * @file actions/price-actions.ts
 * @description 가격 조회 및 마진 계산 Server Actions
 * 
 * 주요 기능:
 * 1. POIZON 가격 조회
 * 2. 네이버 최저가 조회
 * 3. 마진 계산
 * 4. 가격 분석 데이터 통합
 */

'use server';

import { getMarketPrice } from '@/lib/poizon-api';
import { getNaverPriceSummary, buildSearchQuery } from '@/lib/naver-api';
import { calculateMargin, type CalculatorSettings } from '@/lib/calculator';
import type { NaverPriceSummary } from '@/types/naver';
import type { PoizonMarketPriceResponse } from '@/types/poizon';

// ============================================================================
// 상수
// ============================================================================

const DEFAULT_REGION = 'US';
const DEFAULT_CURRENCY = 'USD';
const BIDDING_TYPE_SHIP_TO_VERIFY = 20;

// ============================================================================
// 가격 조회
// ============================================================================

/**
 * POIZON 시장 최저가를 조회합니다.
 * 
 * @param globalSkuId - 글로벌 SKU ID
 * @param region - 판매 지역
 * @param currency - 통화
 * @returns POIZON 시장가 정보
 */
export async function fetchPoizonMarketPrice(
  globalSkuId: number,
  region: string = DEFAULT_REGION,
  currency: string = DEFAULT_CURRENCY
): Promise<{
  success: boolean;
  data?: PoizonMarketPriceResponse;
  error?: string;
}> {
  console.group('🎨 Server Action: fetchPoizonMarketPrice');
  console.log('Global SKU ID:', globalSkuId);
  console.log('Region:', region);
  console.log('Currency:', currency);
  
  try {
    // POIZON API 호출
    const result = await getMarketPrice({
      globalSkuId,
      biddingType: BIDDING_TYPE_SHIP_TO_VERIFY,
      region,
      currency,
    });
    
    console.log('✅ Success');
    console.groupEnd();
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('❌ Error:', error);
    console.groupEnd();
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'POIZON 가격 조회에 실패했습니다.',
    };
  }
}

/**
 * 네이버 최저가를 조회합니다.
 * 
 * @param styleCode - 품번
 * @param size - 사이즈 (선택적)
 * @returns 네이버 가격 정보
 */
export async function fetchNaverPrice(
  styleCode: string,
  size?: string
): Promise<{
  success: boolean;
  data?: NaverPriceSummary;
  error?: string;
}> {
  console.group('🛍️ Server Action: fetchNaverPrice');
  console.log('Style Code:', styleCode);
  console.log('Size:', size);
  
  try {
    // 검색어 생성
    const query = buildSearchQuery(styleCode, size);
    
    // 네이버 API 호출
    const result = await getNaverPriceSummary(query, {
      excludeOverseas: true, // 해외직구 제외
    });
    
    console.log('✅ Success');
    console.groupEnd();
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('❌ Error:', error);
    console.groupEnd();
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '네이버 가격 조회에 실패했습니다.',
    };
  }
}

/**
 * 여러 사이즈의 네이버 최저가를 일괄 조회합니다.
 * 
 * @param styleCode - 품번
 * @param sizes - 사이즈 배열
 * @returns 사이즈별 네이버 가격 정보
 */
export async function fetchBulkNaverPrices(
  styleCode: string,
  sizes: string[]
): Promise<{
  success: boolean;
  data?: Map<string, NaverPriceSummary>;
  error?: string;
}> {
  console.group('🛍️🛍️ Server Action: fetchBulkNaverPrices');
  console.log('Style Code:', styleCode);
  console.log('Sizes:', sizes);
  
  try {
    const priceMap = new Map<string, NaverPriceSummary>();
    
    // 각 사이즈별로 가격 조회
    for (const size of sizes) {
      const result = await fetchNaverPrice(styleCode, size);
      
      if (result.success && result.data) {
        priceMap.set(size, result.data);
      }
    }
    
    console.log('✅ Success:', priceMap.size, 'prices fetched');
    console.groupEnd();
    
    return {
      success: true,
      data: priceMap,
    };
  } catch (error) {
    console.error('❌ Error:', error);
    console.groupEnd();
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '가격 일괄 조회에 실패했습니다.',
    };
  }
}

// ============================================================================
// 마진 계산
// ============================================================================

/**
 * 단일 상품의 마진을 계산합니다.
 * 
 * @param poizonPrice - POIZON 가격 (CNY)
 * @param naverPrice - 네이버 가격 (KRW)
 * @param settings - 계산 설정 (환율, 수수료, 배송비)
 * @returns 마진 분석 결과
 */
export async function calculateSingleMargin(
  poizonPrice: number,
  naverPrice: number,
  settings: CalculatorSettings
): Promise<{
  success: boolean;
  data?: ReturnType<typeof calculateMargin>;
  error?: string;
}> {
  console.group('🧮 Server Action: calculateSingleMargin');
  console.log('POIZON Price:', poizonPrice);
  console.log('Naver Price:', naverPrice);
  
  try {
    // 입력 검증
    if (poizonPrice <= 0 || naverPrice <= 0) {
      console.error('❌ Invalid prices');
      console.groupEnd();
      return { success: false, error: '유효한 가격을 입력해주세요.' };
    }
    
    // 마진 계산
    const result = calculateMargin(
      { poizonPrice, naverPrice },
      settings
    );
    
    console.log('✅ Success');
    console.groupEnd();
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('❌ Error:', error);
    console.groupEnd();
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '마진 계산에 실패했습니다.',
    };
  }
}

// ============================================================================
// 통합 분석
// ============================================================================

/**
 * 전체 가격 분석을 수행합니다.
 * POIZON 가격, 네이버 가격, 마진을 모두 계산합니다.
 * 
 * @param styleCode - 품번
 * @param skuData - SKU 데이터 (사이즈, POIZON 가격 등)
 * @param settings - 계산 설정
 * @returns 가격 분석 결과
 */
export async function analyzePrices(
  styleCode: string,
  skuData: Array<{
    size: string;
    poizonPrice: number;
  }>,
  settings: CalculatorSettings
): Promise<{
  success: boolean;
  data?: Array<{
    size: string;
    poizonPrice: number;
    naverPrice: number;
    margin: ReturnType<typeof calculateMargin>;
  }>;
  error?: string;
}> {
  console.group('📊 Server Action: analyzePrices');
  console.log('Style Code:', styleCode);
  console.log('SKU Count:', skuData.length);
  
  try {
    const results = [];
    
    // 각 SKU별로 분석
    for (const sku of skuData) {
      // 1. 네이버 가격 조회
      const naverResult = await fetchNaverPrice(styleCode, sku.size);
      
      if (!naverResult.success || !naverResult.data) {
        console.warn(`⚠️ Failed to fetch Naver price for size ${sku.size}`);
        continue;
      }
      
      // 2. 마진 계산
      const margin = calculateMargin(
        {
          poizonPrice: sku.poizonPrice,
          naverPrice: naverResult.data.lowestPrice,
        },
        settings
      );
      
      results.push({
        size: sku.size,
        poizonPrice: sku.poizonPrice,
        naverPrice: naverResult.data.lowestPrice,
        margin,
      });
    }
    
    console.log('✅ Success:', results.length, 'analyzed');
    console.groupEnd();
    
    return {
      success: true,
      data: results,
    };
  } catch (error) {
    console.error('❌ Error:', error);
    console.groupEnd();
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '가격 분석에 실패했습니다.',
    };
  }
}

