/**
 * @file actions/product-actions.ts
 * @description 상품 관련 Server Actions
 * 
 * 주요 기능:
 * 1. 상품 검색 (POIZON API - 품번으로 검색)
 * 2. SKU 목록 조회
 * 3. 데이터베이스 저장 및 동기화
 */

'use server';

import { searchByStyleCode, searchByCustomCode, getSkusBySpuId, getSpusByBrandId } from '@/lib/poizon-api';
import type {
  PoizonSkuSearchResponse,
  PoizonSkuListResponse,
  PoizonSkuInfo,
} from '@/types/poizon';

// ============================================================================
// 상수
// ============================================================================

const DEFAULT_REGION = 'US'; // 기본 판매 지역
const DEFAULT_LANGUAGE = 'en'; // 기본 언어
const DEFAULT_TIMEZONE = 'Asia/Shanghai'; // 기본 타임존

// ============================================================================
// 상품 검색
// ============================================================================

/**
 * 품번(스타일 코드)으로 상품을 검색합니다.
 * 
 * @param styleCode - 품번 (예: DD1503-101)
 * @param region - 판매 지역 (기본값: US)
 * @returns SKU 목록 (사이즈별)
 */
export async function searchProduct(
  styleCode: string,
  region: string = DEFAULT_REGION
): Promise<{
  success: boolean;
  data?: PoizonSkuSearchResponse;
  error?: string;
}> {
  console.group('🔍 Server Action: searchProduct');
  console.log('Style Code:', styleCode);
  console.log('Region:', region);
  
  try {
    // 입력 검증
    if (!styleCode || styleCode.trim().length === 0) {
      console.error('❌ Style code is required');
      console.groupEnd();
      return { success: false, error: '품번을 입력해주세요.' };
    }
    
    // POIZON API 호출 (결과는 배열)
    const result = await searchByStyleCode({
      articleNumber: styleCode.trim(),
      region,
      language: DEFAULT_LANGUAGE,
      timeZone: DEFAULT_TIMEZONE,
    });
    
    console.log('✅ Success:', result?.length || 0, 'product(s) found');
    if (result && result.length > 0) {
      console.log('  └─ Total SKUs:', result.reduce((sum, item) => sum + (item.skuInfoList?.length || 0), 0));
    }
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
      error: error instanceof Error ? error.message : '상품 검색에 실패했습니다.',
    };
  }
}

/**
 * 판매자 커스텀 코드로 상품을 검색합니다 (판매량 포함).
 * 
 * @param customCode - 커스텀 코드 (예: DD1503-101)
 * @param region - 판매 지역 (기본값: US)
 * @returns SKU 목록 (사이즈별, 판매량 포함)
 */
export async function searchProductByCustomCode(
  customCode: string,
  region: string = DEFAULT_REGION
): Promise<{
  success: boolean;
  data?: PoizonSkuSearchResponse;
  error?: string;
}> {
  console.group('🎯 Server Action: searchProductByCustomCode');
  console.log('Custom Code:', customCode);
  console.log('Region:', region);
  
  try {
    // 입력 검증
    if (!customCode || customCode.trim().length === 0) {
      console.error('❌ Custom code is required');
      console.groupEnd();
      return { success: false, error: '커스텀 코드를 입력해주세요.' };
    }
    
    // POIZON Custom Code API 호출
    const result = await searchByCustomCode({
      articleNumber: customCode.trim(), // articleNumber를 customCode로 사용
      region,
      language: DEFAULT_LANGUAGE,
      timeZone: DEFAULT_TIMEZONE,
    });
    
    console.log('✅ Success: Product found');
    console.log('  └─ Total SKUs:', result.skuInfoList?.length || 0);
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
      error: error instanceof Error ? error.message : '상품 검색에 실패했습니다.',
    };
  }
}

/**
 * globalSpuId로 SKU 목록을 조회합니다.
 * 
 * @param globalSpuId - POIZON 글로벌 상품 ID
 * @param region - 판매 지역 (기본값: US)
 * @returns SKU 목록
 */
export async function getProductSkus(
  globalSpuId: number,
  region: string = DEFAULT_REGION
): Promise<{
  success: boolean;
  data?: PoizonSkuListResponse;
  error?: string;
}> {
  console.group('📦 Server Action: getProductSkus');
  console.log('Global SPU ID:', globalSpuId);
  console.log('Region:', region);
  
  try {
    // 입력 검증
    if (!globalSpuId || globalSpuId <= 0) {
      console.error('❌ Valid Global SPU ID is required');
      console.groupEnd();
      return { success: false, error: '유효한 상품 ID가 필요합니다.' };
    }
    
    // POIZON API 호출 (최대 5개까지 가능하지만 여기서는 1개만)
    const result = await getSkusBySpuId({
      globalSpuIds: [globalSpuId],
      region,
      language: DEFAULT_LANGUAGE,
      timeZone: DEFAULT_TIMEZONE,
    });
    
    console.log('✅ Success:', result.contents?.length || 0, 'SPU(s) found');
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
      error: error instanceof Error ? error.message : 'SKU 목록 조회에 실패했습니다.',
    };
  }
}

/**
 * 여러 globalSpuId로 SKU 목록을 일괄 조회합니다.
 * 
 * @param globalSpuIds - POIZON 글로벌 상품 ID 목록 (최대 5개)
 * @param region - 판매 지역 (기본값: US)
 * @returns SKU 목록
 */
export async function getBulkProductSkus(
  globalSpuIds: number[],
  region: string = DEFAULT_REGION
): Promise<{
  success: boolean;
  data?: PoizonSkuListResponse;
  error?: string;
}> {
  console.group('📦 Server Action: getBulkProductSkus');
  console.log('Global SPU IDs:', globalSpuIds);
  console.log('Region:', region);
  
  try {
    // 입력 검증
    if (!globalSpuIds || globalSpuIds.length === 0) {
      console.error('❌ At least one Global SPU ID is required');
      console.groupEnd();
      return { success: false, error: '최소 1개의 상품 ID가 필요합니다.' };
    }
    
    if (globalSpuIds.length > 5) {
      console.warn('⚠️ Maximum 5 SPU IDs allowed, truncating...');
      globalSpuIds = globalSpuIds.slice(0, 5);
    }
    
    // POIZON API 호출
    const result = await getSkusBySpuId({
      globalSpuIds,
      region,
      language: DEFAULT_LANGUAGE,
      timeZone: DEFAULT_TIMEZONE,
    });
    
    console.log('✅ Success:', result.contents?.length || 0, 'SPU(s) found');
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
      error: error instanceof Error ? error.message : 'SKU 목록 조회에 실패했습니다.',
    };
  }
}

/**
 * 브랜드 ID로 SPU 정보를 조회합니다 (판매량 포함).
 * 
 * @param brandId - 브랜드 ID
 * @param region - 판매 지역 (기본값: US)
 * @returns SPU 목록 (판매량 포함)
 */
export async function getSpusWithSalesVolume(
  brandId: number,
  region: string = DEFAULT_REGION
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  console.group('📊 Server Action: getSpusWithSalesVolume');
  console.log('Brand ID:', brandId);
  console.log('Region:', region);
  
  try {
    if (!brandId || brandId <= 0) {
      console.error('❌ Valid Brand ID is required');
      console.groupEnd();
      return { success: false, error: '유효한 브랜드 ID가 필요합니다.' };
    }
    
    // POIZON API 호출
    const result = await getSpusByBrandId({
      brandIdList: [brandId],
      scrollId: null,
      pageSize: 20,
      region,
      language: DEFAULT_LANGUAGE,
      timeZone: DEFAULT_TIMEZONE,
    });
    
    console.log('✅ Success:', result.contents?.length || 0, 'SPU(s) found');
    if (result.contents && result.contents.length > 0) {
      const firstSpu = result.contents[0];
      console.log('📊 판매량 데이터 확인:', {
        localSoldNum: firstSpu.localSoldNum ?? 'X',
        globalSoldNum: firstSpu.globalSoldNum ?? 'X',
        averagePrice: firstSpu.averagePrice ?? 'X',
      });
    }
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
      error: error instanceof Error ? error.message : 'SPU 목록 조회에 실패했습니다.',
    };
  }
}

/**
 * 상품 전체 정보를 조회합니다 (SKU 기본 정보 포함).
 * 
 * @param skuInfo - SKU 기본 정보 (검색 결과에서 가져온 것)
 * @param region - 판매 지역 (기본값: US)
 * @returns 상품 정보 및 SKU 목록
 */
export async function getProductDetails(
  skuInfo: PoizonSkuInfo,
  region: string = DEFAULT_REGION
): Promise<{
  success: boolean;
  data?: {
    productInfo: PoizonSkuInfo;
    allSkus: PoizonSkuListResponse;
  };
  error?: string;
}> {
  console.group('📋 Server Action: getProductDetails');
  console.log('SKU Info:', skuInfo);
  console.log('Region:', region);
  
  try {
    // globalSpuId가 있으면 해당 상품의 모든 SKU 조회
    if (skuInfo.globalSpuId) {
      const skusResult = await getProductSkus(skuInfo.globalSpuId, region);
      
      if (!skusResult.success || !skusResult.data) {
        console.error('❌ Failed to fetch SKUs');
        console.groupEnd();
        return {
          success: false,
          error: skusResult.error || 'SKU 목록 조회에 실패했습니다.',
        };
      }
      
      console.log('✅ Success');
      console.groupEnd();
      
      return {
        success: true,
        data: {
          productInfo: skuInfo,
          allSkus: skusResult.data,
        },
      };
    } else {
      console.warn('⚠️ No globalSpuId available, returning only SKU info');
      console.groupEnd();
      
      return {
        success: true,
        data: {
          productInfo: skuInfo,
          allSkus: { contents: [] },
        },
      };
    }
  } catch (error) {
    console.error('❌ Error:', error);
    console.groupEnd();
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '상품 정보 조회에 실패했습니다.',
    };
  }
}
