/**
 * @file lib/exchange-rate.ts
 * @description 환율 조회 함수
 * 
 * CNY/KRW 환율을 조회합니다.
 * 여러 소스에서 환율을 가져올 수 있으며, Fallback 메커니즘을 제공합니다.
 * 
 * 주요 기능:
 * 1. 실시간 환율 조회 (ExchangeRate-API 또는 한국수출입은행 API)
 * 2. 환율 캐싱 (1시간 단위)
 * 3. Fallback: 수동 설정값 또는 기본값 사용
 * 
 * @dependencies
 * - ky: HTTP 클라이언트
 * 
 * @security
 * API 키가 필요한 경우 반드시 서버 사이드에서만 사용해야 합니다.
 */

import ky from 'ky';

// ============================================================================
// 타입 정의
// ============================================================================

export interface ExchangeRate {
  from: string; // 기준 통화 (CNY)
  to: string; // 대상 통화 (KRW)
  rate: number; // 환율
  timestamp: Date; // 조회 시각
  source: 'api' | 'manual' | 'default'; // 소스
}

export interface ExchangeRateApiResponse {
  result: string;
  conversion_rates: {
    [key: string]: number;
  };
}

export interface KoreximApiResponse {
  result: number;
  cur_unit: string;
  cur_nm: string;
  ttb: string;
  tts: string;
  deal_bas_r: string;
  bkpr: string;
  yy_efee_r: string;
  ten_dd_efee_r: string;
  kftc_deal_bas_r: string;
  kftc_bkpr: string;
}

// ============================================================================
// 설정
// ============================================================================

const DEFAULT_EXCHANGE_RATE = 190; // 기본 환율 (CNY → KRW)
const CACHE_DURATION = 60 * 60 * 1000; // 1시간 (밀리초)

// 캐시 변수
let cachedRate: ExchangeRate | null = null;
let cacheExpiry: number = 0;

// ============================================================================
// 환율 조회 함수들
// ============================================================================

/**
 * ExchangeRate-API에서 환율을 조회합니다.
 * 
 * @returns 환율 정보
 * @throws {Error} API 호출 실패 시
 * 
 * @see https://www.exchangerate-api.com/
 */
async function fetchFromExchangeRateApi(): Promise<ExchangeRate> {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  
  if (!apiKey) {
    throw new Error('EXCHANGE_RATE_API_KEY not found in environment variables');
  }
  
  const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/CNY`;
  
  const response = await ky.get(url).json<ExchangeRateApiResponse>();
  
  if (response.result !== 'success') {
    throw new Error('ExchangeRate-API request failed');
  }
  
  const rate = response.conversion_rates.KRW;
  
  if (!rate) {
    throw new Error('KRW rate not found in API response');
  }
  
  return {
    from: 'CNY',
    to: 'KRW',
    rate,
    timestamp: new Date(),
    source: 'api',
  };
}

/**
 * 한국수출입은행 API에서 환율을 조회합니다.
 * 
 * @returns 환율 정보
 * @throws {Error} API 호출 실패 시
 * 
 * @see https://www.koreaexim.go.kr/site/program/financial/exchangeJSON
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function fetchFromKoreximApi(): Promise<ExchangeRate> {
  // 한국수출입은행 API는 무료이며 인증키가 필요 없는 경우도 있음
  // 필요시 환경 변수로 API 키 추가
  
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const url = `https://www.koreaexim.go.kr/site/program/financial/exchangeJSON?authkey=YOUR_AUTH_KEY&searchdate=${today}&data=AP01`;
  
  // 이 API는 인증키가 필요하므로, 실제로는 사용하기 어려움
  // 구현 예시만 제공
  
  throw new Error('Korexim API not implemented (requires auth key)');
}

/**
 * 수동으로 설정된 환율을 반환합니다.
 * 
 * @param manualRate - 수동 설정 환율
 * @returns 환율 정보
 */
function getManualRate(manualRate: number): ExchangeRate {
  return {
    from: 'CNY',
    to: 'KRW',
    rate: manualRate,
    timestamp: new Date(),
    source: 'manual',
  };
}

/**
 * 기본 환율을 반환합니다.
 * 
 * @returns 환율 정보
 */
function getDefaultRate(): ExchangeRate {
  return {
    from: 'CNY',
    to: 'KRW',
    rate: DEFAULT_EXCHANGE_RATE,
    timestamp: new Date(),
    source: 'default',
  };
}

// ============================================================================
// 공개 API
// ============================================================================

/**
 * CNY/KRW 환율을 조회합니다.
 * 캐시가 유효한 경우 캐시된 값을 반환합니다.
 * 
 * @param options - 옵션
 * @param options.manualRate - 수동 설정 환율 (우선순위 최상)
 * @param options.forceRefresh - 캐시 무시하고 강제로 새로 조회
 * @returns 환율 정보
 * 
 * @example
 * ```typescript
 * // 기본 사용
 * const rate1 = await getExchangeRate();
 * 
 * // 수동 환율 사용
 * const rate2 = await getExchangeRate({ manualRate: 195 });
 * 
 * // 캐시 무시하고 새로 조회
 * const rate3 = await getExchangeRate({ forceRefresh: true });
 * ```
 */
export async function getExchangeRate(
  options: { manualRate?: number; forceRefresh?: boolean } = {}
): Promise<ExchangeRate> {
  console.group('💱 Exchange Rate: getExchangeRate');
  console.log('Options:', options);
  
  try {
    // 1. 수동 환율이 제공된 경우 우선 사용
    if (options.manualRate) {
      const rate = getManualRate(options.manualRate);
      console.log('✅ Using manual rate:', rate);
      console.groupEnd();
      return rate;
    }
    
    // 2. 캐시 확인 (forceRefresh가 false이고 캐시가 유효한 경우)
    if (!options.forceRefresh && cachedRate && Date.now() < cacheExpiry) {
      console.log('✅ Using cached rate:', cachedRate);
      console.groupEnd();
      return cachedRate;
    }
    
    // 3. API에서 환율 조회 시도
    try {
      const rate = await fetchFromExchangeRateApi();
      
      // 캐시 저장
      cachedRate = rate;
      cacheExpiry = Date.now() + CACHE_DURATION;
      
      console.log('✅ Fetched from API:', rate);
      console.groupEnd();
      return rate;
    } catch (apiError) {
      console.warn('⚠️ API fetch failed:', apiError);
      
      // 4. API 실패 시 기본값 사용
      const rate = getDefaultRate();
      console.log('⚠️ Using default rate:', rate);
      console.groupEnd();
      return rate;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    console.groupEnd();
    
    // 최종 Fallback: 기본값
    return getDefaultRate();
  }
}

/**
 * 캐시된 환율을 초기화합니다.
 */
export function clearExchangeRateCache(): void {
  cachedRate = null;
  cacheExpiry = 0;
  console.log('🗑️ Exchange rate cache cleared');
}

/**
 * 위안을 원화로 변환합니다.
 * 
 * @param cnyAmount - 위안 금액
 * @param exchangeRate - 환율 (선택적, 없으면 자동 조회)
 * @returns 원화 금액
 * 
 * @example
 * ```typescript
 * const krw1 = await convertCnyToKrw(850); // 850위안을 원화로
 * const krw2 = await convertCnyToKrw(850, 195); // 환율 195로 고정하여 변환
 * ```
 */
export async function convertCnyToKrw(
  cnyAmount: number,
  exchangeRate?: number
): Promise<number> {
  const rate = exchangeRate || (await getExchangeRate()).rate;
  return Math.round(cnyAmount * rate);
}

/**
 * 원화를 위안으로 변환합니다.
 * 
 * @param krwAmount - 원화 금액
 * @param exchangeRate - 환율 (선택적, 없으면 자동 조회)
 * @returns 위안 금액
 * 
 * @example
 * ```typescript
 * const cny1 = await convertKrwToCny(162000); // 162000원을 위안으로
 * const cny2 = await convertKrwToCny(162000, 195); // 환율 195로 고정하여 변환
 * ```
 */
export async function convertKrwToCny(
  krwAmount: number,
  exchangeRate?: number
): Promise<number> {
  const rate = exchangeRate || (await getExchangeRate()).rate;
  return Math.round((krwAmount / rate) * 100) / 100; // 소수점 2자리
}

