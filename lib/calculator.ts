/**
 * @file lib/calculator.ts
 * @description 마진 계산 로직
 * 
 * POIZON 시장가와 네이버 최저가를 기반으로 예상 수익 및 ROI를 계산합니다.
 * 
 * 주요 기능:
 * 1. 예상 매출액 계산 (POIZON 가격 × 환율 × (1 - 수수료))
 * 2. 예상 매입가 계산 (네이버 최저가 + 배송비)
 * 3. 예상 수익 계산 (매출 - 매입)
 * 4. ROI 계산 ((수익 / 매입) × 100)
 * 
 * @dependencies
 * - lib/exchange-rate: 환율 조회
 */

import type { Settings } from '@/types/database';

// ============================================================================
// 설정 타입
// ============================================================================

export interface CalculatorSettings {
  exchangeRate: number; // CNY → KRW 환율
  platformFeeRate: number; // 플랫폼 수수료율 (0.05 = 5%)
  shippingCost: number; // 배송비 (KRW)
}

export interface PriceInput {
  poizonPrice: number; // POIZON 시장 최저가 (CNY)
  naverPrice: number; // 네이버 최저가 (KRW)
}

export interface MarginResult {
  expectedRevenue: number; // 예상 매출액 (KRW)
  expectedCost: number; // 예상 매입가 (KRW)
  profit: number; // 예상 수익 (KRW)
  roi: number; // ROI (%)
  isProfitable: boolean; // 수익 가능 여부
}

// ============================================================================
// 기본 설정값
// ============================================================================

export const DEFAULT_SETTINGS: CalculatorSettings = {
  exchangeRate: 190, // 기본 환율 190원
  platformFeeRate: 0.05, // 5% 수수료
  shippingCost: 3000, // 3,000원 배송비
};

// ============================================================================
// 마진 계산 함수
// ============================================================================

/**
 * 예상 매출액을 계산합니다.
 * 
 * 공식: POIZON 가격 (CNY) × 환율 × (1 - 수수료율)
 * 
 * @param poizonPrice - POIZON 시장 최저가 (CNY)
 * @param exchangeRate - 환율 (CNY → KRW)
 * @param platformFeeRate - 플랫폼 수수료율 (0.05 = 5%)
 * @returns 예상 매출액 (KRW)
 * 
 * @example
 * ```typescript
 * const revenue = calculateExpectedRevenue(850, 190, 0.05);
 * // 850 × 190 × (1 - 0.05) = 153,425원
 * ```
 */
export function calculateExpectedRevenue(
  poizonPrice: number,
  exchangeRate: number,
  platformFeeRate: number
): number {
  if (poizonPrice <= 0 || exchangeRate <= 0) {
    return 0;
  }
  
  const revenue = poizonPrice * exchangeRate * (1 - platformFeeRate);
  return Math.round(revenue); // 원 단위로 반올림
}

/**
 * 예상 매입가를 계산합니다.
 * 
 * 공식: 네이버 최저가 + 배송비
 * 
 * @param naverPrice - 네이버 최저가 (KRW)
 * @param shippingCost - 배송비 (KRW)
 * @returns 예상 매입가 (KRW)
 * 
 * @example
 * ```typescript
 * const cost = calculateExpectedCost(145000, 3000);
 * // 145,000 + 3,000 = 148,000원
 * ```
 */
export function calculateExpectedCost(
  naverPrice: number,
  shippingCost: number
): number {
  if (naverPrice <= 0) {
    return 0;
  }
  
  return Math.round(naverPrice + shippingCost);
}

/**
 * 예상 수익을 계산합니다.
 * 
 * 공식: 예상 매출액 - 예상 매입가
 * 
 * @param expectedRevenue - 예상 매출액 (KRW)
 * @param expectedCost - 예상 매입가 (KRW)
 * @returns 예상 수익 (KRW, 양수면 이익, 음수면 손실)
 * 
 * @example
 * ```typescript
 * const profit = calculateProfit(153425, 148000);
 * // 153,425 - 148,000 = 5,425원
 * ```
 */
export function calculateProfit(
  expectedRevenue: number,
  expectedCost: number
): number {
  return Math.round(expectedRevenue - expectedCost);
}

/**
 * ROI (Return on Investment)를 계산합니다.
 * 
 * 공식: (예상 수익 / 예상 매입가) × 100
 * 
 * @param profit - 예상 수익 (KRW)
 * @param expectedCost - 예상 매입가 (KRW)
 * @returns ROI (%)
 * 
 * @example
 * ```typescript
 * const roi = calculateRoi(5425, 148000);
 * // (5,425 / 148,000) × 100 = 3.67%
 * ```
 */
export function calculateRoi(profit: number, expectedCost: number): number {
  if (expectedCost <= 0) {
    return 0;
  }
  
  const roi = (profit / expectedCost) * 100;
  return Math.round(roi * 100) / 100; // 소수점 2자리
}

/**
 * 전체 마진 분석을 수행합니다.
 * 
 * @param input - 가격 입력 (POIZON 가격, 네이버 가격)
 * @param settings - 계산 설정 (환율, 수수료, 배송비)
 * @returns 마진 분석 결과
 * 
 * @example
 * ```typescript
 * const result = calculateMargin(
 *   { poizonPrice: 850, naverPrice: 145000 },
 *   { exchangeRate: 190, platformFeeRate: 0.05, shippingCost: 3000 }
 * );
 * 
 * console.log(result);
 * // {
 * //   expectedRevenue: 153425,
 * //   expectedCost: 148000,
 * //   profit: 5425,
 * //   roi: 3.67,
 * //   isProfitable: true
 * // }
 * ```
 */
export function calculateMargin(
  input: PriceInput,
  settings: CalculatorSettings = DEFAULT_SETTINGS
): MarginResult {
  console.group('🧮 Calculator: calculateMargin');
  console.log('Input:', input);
  console.log('Settings:', settings);
  
  try {
    // 1. 예상 매출액 계산
    const expectedRevenue = calculateExpectedRevenue(
      input.poizonPrice,
      settings.exchangeRate,
      settings.platformFeeRate
    );
    
    // 2. 예상 매입가 계산
    const expectedCost = calculateExpectedCost(
      input.naverPrice,
      settings.shippingCost
    );
    
    // 3. 예상 수익 계산
    const profit = calculateProfit(expectedRevenue, expectedCost);
    
    // 4. ROI 계산
    const roi = calculateRoi(profit, expectedCost);
    
    // 5. 수익 가능 여부
    const isProfitable = profit > 0;
    
    const result: MarginResult = {
      expectedRevenue,
      expectedCost,
      profit,
      roi,
      isProfitable,
    };
    
    console.log('✅ Result:', result);
    console.groupEnd();
    
    return result;
  } catch (error) {
    console.error('❌ Error:', error);
    console.groupEnd();
    
    // 에러 시 안전한 기본값 반환
    return {
      expectedRevenue: 0,
      expectedCost: 0,
      profit: 0,
      roi: 0,
      isProfitable: false,
    };
  }
}

/**
 * 여러 상품의 마진을 일괄 계산합니다.
 * 
 * @param inputs - 가격 입력 배열
 * @param settings - 계산 설정
 * @returns 마진 분석 결과 배열
 * 
 * @example
 * ```typescript
 * const results = calculateBulkMargins(
 *   [
 *     { poizonPrice: 850, naverPrice: 145000 },
 *     { poizonPrice: 880, naverPrice: 148000 },
 *   ],
 *   settings
 * );
 * ```
 */
export function calculateBulkMargins(
  inputs: PriceInput[],
  settings: CalculatorSettings = DEFAULT_SETTINGS
): MarginResult[] {
  console.group('🧮🧮 Calculator: calculateBulkMargins');
  console.log('Count:', inputs.length);
  
  const results = inputs.map((input) => calculateMargin(input, settings));
  
  console.log('✅ Completed:', results.length);
  console.groupEnd();
  
  return results;
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * Supabase Settings 타입을 CalculatorSettings로 변환합니다.
 * 
 * @param dbSettings - Supabase Settings 객체
 * @returns CalculatorSettings
 */
export function settingsFromDb(dbSettings: Settings): CalculatorSettings {
  return {
    exchangeRate: Number(dbSettings.exchange_rate),
    platformFeeRate: Number(dbSettings.platform_fee_rate),
    shippingCost: Number(dbSettings.shipping_cost),
  };
}

/**
 * 최적 입찰가를 계산합니다.
 * 
 * 옵션 A: 시장 최저가 - 1위안
 * 
 * @param marketLowestAsk - 시장 최저가 (CNY)
 * @returns 추천 입찰가 (CNY)
 */
export function calculateOptimalBidPrice(marketLowestAsk: number): number {
  if (marketLowestAsk <= 1) {
    return marketLowestAsk; // 1위안 이하면 그대로 반환
  }
  
  return Math.round((marketLowestAsk - 1) * 100) / 100; // 소수점 2자리
}

/**
 * 목표 마진을 달성하기 위한 최대 입찰가를 계산합니다.
 * 
 * 옵션 B: (네이버 최저가 + 목표 마진 + 배송비) / 환율 / (1 - 수수료)
 * 
 * @param naverPrice - 네이버 최저가 (KRW)
 * @param targetProfit - 목표 수익 (KRW)
 * @param settings - 계산 설정
 * @returns 최대 입찰가 (CNY)
 */
export function calculateMaxBidPrice(
  naverPrice: number,
  targetProfit: number,
  settings: CalculatorSettings = DEFAULT_SETTINGS
): number {
  // (네이버가 + 목표수익 + 배송비) = POIZON가 × 환율 × (1 - 수수료)
  // POIZON가 = (네이버가 + 목표수익 + 배송비) / 환율 / (1 - 수수료)
  
  const totalCost = naverPrice + targetProfit + settings.shippingCost;
  const maxBid = totalCost / settings.exchangeRate / (1 - settings.platformFeeRate);
  
  return Math.round(maxBid * 100) / 100; // 소수점 2자리
}

