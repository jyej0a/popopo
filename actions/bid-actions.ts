/**
 * @file actions/bid-actions.ts
 * @description 입찰 관련 Server Actions
 * 
 * 주요 기능:
 * 1. 입찰 실행 (POIZON API 호출)
 * 2. 입찰 내역 조회
 * 3. 입찰 상태 업데이트
 */

'use server';

import { auth } from '@clerk/nextjs/server';
import { createListing, updateListing } from '@/lib/poizon-api';
import type { PoizonListingRequest, PoizonListingUpdateRequest } from '@/types/poizon';

// ============================================================================
// 상수
// ============================================================================

const DEFAULT_REGION = 'US';
const DEFAULT_CURRENCY = 'USD';
const DEFAULT_QUANTITY = 1;

// ============================================================================
// 입찰 실행
// ============================================================================

/**
 * 단일 SKU에 대해 입찰합니다 (신규 등록).
 * 
 * @param params - 입찰 파라미터
 * @returns 입찰 결과
 */
export async function placeBid(params: {
  globalSkuId: number;
  bidPrice: number;
  quantity?: number;
  region?: string;
  currency?: string;
}): Promise<{
  success: boolean;
  data?: { sellerBiddingNo: string; tips: string };
  error?: string;
}> {
  console.group('💰 Server Action: placeBid');
  console.log('Params:', params);
  
  try {
    // 인증 확인
    const { userId } = await auth();
    
    if (!userId) {
      console.error('❌ Unauthorized');
      console.groupEnd();
      return { success: false, error: '로그인이 필요합니다.' };
    }
    
    // 입력 검증
    if (!params.globalSkuId || params.bidPrice <= 0) {
      console.error('❌ Invalid input');
      console.groupEnd();
      return { success: false, error: '유효한 입찰 정보를 입력해주세요.' };
    }
    
    // 고유 요청 ID 생성
    const requestId = `bid-${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // POIZON API 호출
    const request: PoizonListingRequest = {
      requestId,
      globalSkuId: params.globalSkuId,
      price: params.bidPrice,
      quantity: params.quantity || DEFAULT_QUANTITY,
      countryCode: params.region || DEFAULT_REGION,
      deliveryCountryCode: params.region || DEFAULT_REGION,
      currency: params.currency || DEFAULT_CURRENCY,
    };
    
    const result = await createListing(request);
    
    console.log('✅ Success');
    console.groupEnd();
    
    return {
      success: true,
      data: {
        sellerBiddingNo: result.sellerBiddingNo,
        tips: result.tips,
      },
    };
  } catch (error) {
    console.error('❌ Error:', error);
    console.groupEnd();
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '입찰에 실패했습니다.',
    };
  }
}

/**
 * 기존 입찰을 수정합니다.
 * 
 * @param params - 입찰 수정 파라미터
 * @returns 수정 결과
 */
export async function updateBid(params: {
  sellerBiddingNo: string;
  bidPrice: number;
  quantity?: number;
  currency?: string;
}): Promise<{
  success: boolean;
  data?: { sellerBiddingNo: string; tips: string };
  error?: string;
}> {
  console.group('💰 Server Action: updateBid');
  console.log('Params:', params);
  
  try {
    // 인증 확인
    const { userId } = await auth();
    
    if (!userId) {
      console.error('❌ Unauthorized');
      console.groupEnd();
      return { success: false, error: '로그인이 필요합니다.' };
    }
    
    // 입력 검증
    if (!params.sellerBiddingNo || params.bidPrice <= 0) {
      console.error('❌ Invalid input');
      console.groupEnd();
      return { success: false, error: '유효한 입찰 정보를 입력해주세요.' };
    }
    
    // 고유 요청 ID 생성
    const requestId = `update-${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // POIZON API 호출
    const request: PoizonListingUpdateRequest = {
      requestId,
      sellerBiddingNo: params.sellerBiddingNo,
      globalSkuId: 0, // 수정 시 필요 없음
      price: params.bidPrice,
      quantity: params.quantity || DEFAULT_QUANTITY,
      countryCode: DEFAULT_REGION,
      deliveryCountryCode: DEFAULT_REGION,
      currency: params.currency || DEFAULT_CURRENCY,
    };
    
    const result = await updateListing(request);
    
    console.log('✅ Success');
    console.groupEnd();
    
    return {
      success: true,
      data: {
        sellerBiddingNo: result.sellerBiddingNo,
        tips: result.tips,
      },
    };
  } catch (error) {
    console.error('❌ Error:', error);
    console.groupEnd();
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '입찰 수정에 실패했습니다.',
    };
  }
}

/**
 * 여러 SKU에 대해 일괄 입찰합니다.
 * 
 * @param bids - 입찰 목록
 * @returns 입찰 결과
 */
export async function placeBulkBids(
  bids: Array<{
    globalSkuId: number;
    bidPrice: number;
    quantity?: number;
    region?: string;
    currency?: string;
  }>
): Promise<{
  success: boolean;
  data?: {
    successCount: number;
    failCount: number;
    results: Array<{ globalSkuId: number; success: boolean; message: string }>;
  };
  error?: string;
}> {
  console.group('💰💰 Server Action: placeBulkBids');
  console.log('Bid Count:', bids.length);
  
  try {
    // 인증 확인
    const { userId } = await auth();
    
    if (!userId) {
      console.error('❌ Unauthorized');
      console.groupEnd();
      return { success: false, error: '로그인이 필요합니다.' };
    }
    
    // 입력 검증
    if (bids.length === 0) {
      console.error('❌ No bids provided');
      console.groupEnd();
      return { success: false, error: '입찰할 상품을 선택해주세요.' };
    }
    
    // 각 입찰을 순차적으로 실행
    const results = [];
    let successCount = 0;
    let failCount = 0;
    
    for (const bid of bids) {
      const result = await placeBid(bid);
      
      if (result.success) {
        successCount++;
        results.push({
          globalSkuId: bid.globalSkuId,
          success: true,
          message: result.data?.tips || '입찰 성공',
        });
      } else {
        failCount++;
        results.push({
          globalSkuId: bid.globalSkuId,
          success: false,
          message: result.error || '입찰 실패',
        });
      }
    }
    
    console.log('✅ Complete:', successCount, 'success,', failCount, 'fail');
    console.groupEnd();
    
    return {
      success: true,
      data: {
        successCount,
        failCount,
        results,
      },
    };
  } catch (error) {
    console.error('❌ Error:', error);
    console.groupEnd();
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '일괄 입찰에 실패했습니다.',
    };
  }
}

// ============================================================================
// 입찰 내역 조회 (TODO: Supabase 연동 후 구현)
// ============================================================================

/**
 * 사용자의 입찰 내역을 조회합니다.
 * 
 * @returns 입찰 내역
 */
export async function getMyBids(): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    globalSkuId: number;
    sellerBiddingNo: string;
    bidPrice: number;
    status: string;
    createdAt: string;
  }>;
  error?: string;
}> {
  console.group('📋 Server Action: getMyBids');
  
  try {
    // 인증 확인
    const { userId } = await auth();
    
    if (!userId) {
      console.error('❌ Unauthorized');
      console.groupEnd();
      return { success: false, error: '로그인이 필요합니다.' };
    }
    
    // TODO: Supabase에서 입찰 내역 조회
    // const { data, error } = await supabase
    //   .from('my_bids')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .order('created_at', { ascending: false });
    
    console.log('✅ Success (placeholder)');
    console.groupEnd();
    
    return {
      success: true,
      data: [], // TODO: 실제 데이터 반환
    };
  } catch (error) {
    console.error('❌ Error:', error);
    console.groupEnd();
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '입찰 내역 조회에 실패했습니다.',
    };
  }
}

/**
 * 입찰을 취소합니다.
 * 
 * @param sellerBiddingNo - POIZON 입찰 번호
 * @returns 취소 결과
 */
export async function cancelBid(sellerBiddingNo: string): Promise<{
  success: boolean;
  error?: string;
}> {
  console.group('❌ Server Action: cancelBid');
  console.log('Seller Bidding No:', sellerBiddingNo);
  
  try {
    // 인증 확인
    const { userId } = await auth();
    
    if (!userId) {
      console.error('❌ Unauthorized');
      console.groupEnd();
      return { success: false, error: '로그인이 필요합니다.' };
    }
    
    // TODO: POIZON API 입찰 취소 호출
    // await cancelListing({ sellerBiddingNo });
    
    // TODO: Supabase에서 입찰 상태 업데이트
    // const { error } = await supabase
    //   .from('my_bids')
    //   .update({ status: 'cancelled' })
    //   .eq('seller_bidding_no', sellerBiddingNo)
    //   .eq('user_id', userId);
    
    console.log('✅ Success (placeholder)');
    console.groupEnd();
    
    return {
      success: true,
    };
  } catch (error) {
    console.error('❌ Error:', error);
    console.groupEnd();
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '입찰 취소에 실패했습니다.',
    };
  }
}
