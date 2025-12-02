/**
 * @file actions/settings-actions.ts
 * @description 사용자 설정 관련 Server Actions
 * 
 * 주요 기능:
 * 1. 사용자 설정 조회
 * 2. 사용자 설정 업데이트
 * 3. 기본 설정 생성
 */

'use server';

import { auth } from '@clerk/nextjs/server';
import { DEFAULT_SETTINGS, type CalculatorSettings } from '@/lib/calculator';
import { getExchangeRate } from '@/lib/exchange-rate';

// ============================================================================
// 사용자 설정 조회
// ============================================================================

/**
 * 사용자 설정을 조회합니다.
 * 
 * @returns 사용자 설정 (없으면 기본값 반환)
 */
export async function getUserSettings(): Promise<{
  success: boolean;
  data?: CalculatorSettings;
  error?: string;
}> {
  console.group('⚙️ Server Action: getUserSettings');
  
  try {
    // 인증 확인
    const { userId } = await auth();
    
    if (!userId) {
      console.warn('⚠️ Not authenticated, returning default settings');
      console.groupEnd();
      
      // 로그인하지 않은 경우 기본 설정 반환
      return {
        success: true,
        data: DEFAULT_SETTINGS,
      };
    }
    
    // TODO: Supabase에서 설정 조회
    // const { data, error } = await supabase
    //   .from('settings')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .single();
    
    // 설정이 없으면 기본값 반환
    console.log('✅ Success (using default settings)');
    console.groupEnd();
    
    return {
      success: true,
      data: DEFAULT_SETTINGS,
    };
  } catch (error) {
    console.error('❌ Error:', error);
    console.groupEnd();
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '설정 조회에 실패했습니다.',
    };
  }
}

/**
 * 사용자 설정을 업데이트합니다.
 * 
 * @param settings - 업데이트할 설정
 * @returns 업데이트 결과
 */
export async function updateUserSettings(
  settings: Partial<CalculatorSettings>
): Promise<{
  success: boolean;
  data?: CalculatorSettings;
  error?: string;
}> {
  console.group('⚙️ Server Action: updateUserSettings');
  console.log('Settings:', settings);
  
  try {
    // 인증 확인
    const { userId } = await auth();
    
    if (!userId) {
      console.error('❌ Unauthorized');
      console.groupEnd();
      return { success: false, error: '로그인이 필요합니다.' };
    }
    
    // 입력 검증
    if (settings.exchangeRate !== undefined && settings.exchangeRate <= 0) {
      console.error('❌ Invalid exchange rate');
      console.groupEnd();
      return { success: false, error: '유효한 환율을 입력해주세요.' };
    }
    
    if (settings.platformFeeRate !== undefined && (settings.platformFeeRate < 0 || settings.platformFeeRate > 1)) {
      console.error('❌ Invalid platform fee rate');
      console.groupEnd();
      return { success: false, error: '수수료율은 0~100% 사이여야 합니다.' };
    }
    
    if (settings.shippingCost !== undefined && settings.shippingCost < 0) {
      console.error('❌ Invalid shipping cost');
      console.groupEnd();
      return { success: false, error: '배송비는 0원 이상이어야 합니다.' };
    }
    
    // TODO: Supabase에 설정 저장
    // const { data, error } = await supabase
    //   .from('settings')
    //   .upsert({
    //     user_id: userId,
    //     exchange_rate: settings.exchangeRate,
    //     platform_fee_rate: settings.platformFeeRate,
    //     shipping_cost: settings.shippingCost,
    //   })
    //   .select()
    //   .single();
    
    // 임시: 기본값과 병합하여 반환
    const updatedSettings = {
      ...DEFAULT_SETTINGS,
      ...settings,
    };
    
    console.log('✅ Success');
    console.groupEnd();
    
    return {
      success: true,
      data: updatedSettings,
    };
  } catch (error) {
    console.error('❌ Error:', error);
    console.groupEnd();
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '설정 업데이트에 실패했습니다.',
    };
  }
}

/**
 * 설정을 초기화합니다 (기본값으로 리셋).
 * 
 * @returns 초기화 결과
 */
export async function resetSettings(): Promise<{
  success: boolean;
  data?: CalculatorSettings;
  error?: string;
}> {
  console.group('🔄 Server Action: resetSettings');
  
  try {
    // 인증 확인
    const { userId } = await auth();
    
    if (!userId) {
      console.error('❌ Unauthorized');
      console.groupEnd();
      return { success: false, error: '로그인이 필요합니다.' };
    }
    
    // 실시간 환율 조회
    const exchangeRate = await getExchangeRate();
    
    const defaultSettings: CalculatorSettings = {
      exchangeRate: exchangeRate.rate,
      platformFeeRate: 0.05,
      shippingCost: 3000,
    };
    
    // TODO: Supabase에 기본 설정 저장
    // const { error } = await supabase
    //   .from('settings')
    //   .upsert({
    //     user_id: userId,
    //     ...defaultSettings,
    //   });
    
    console.log('✅ Success');
    console.groupEnd();
    
    return {
      success: true,
      data: defaultSettings,
    };
  } catch (error) {
    console.error('❌ Error:', error);
    console.groupEnd();
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '설정 초기화에 실패했습니다.',
    };
  }
}

/**
 * 실시간 환율을 조회합니다.
 * 
 * @returns 환율 정보
 */
export async function fetchCurrentExchangeRate(): Promise<{
  success: boolean;
  data?: {
    rate: number;
    source: 'api' | 'manual' | 'default';
    timestamp: Date;
  };
  error?: string;
}> {
  console.group('💱 Server Action: fetchCurrentExchangeRate');
  
  try {
    const exchangeRate = await getExchangeRate({ forceRefresh: true });
    
    console.log('✅ Success:', exchangeRate.rate);
    console.groupEnd();
    
    return {
      success: true,
      data: {
        rate: exchangeRate.rate,
        source: exchangeRate.source,
        timestamp: exchangeRate.timestamp,
      },
    };
  } catch (error) {
    console.error('❌ Error:', error);
    console.groupEnd();
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '환율 조회에 실패했습니다.',
    };
  }
}

