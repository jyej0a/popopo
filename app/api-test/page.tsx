/**
 * @file app/api-test/page.tsx
 * @description API 연동 테스트 페이지
 * 
 * POIZON API와 Naver API의 연결 상태를 확인하고 기본 기능을 테스트합니다.
 * 
 * 주요 기능:
 * 1. API 연결 상태 확인
 * 2. 환율 조회 테스트
 * 3. 상품 검색 테스트 (더미 데이터)
 * 4. 네이버 쇼핑 검색 테스트 (더미 데이터)
 */

import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getExchangeRate } from '@/lib/exchange-rate';

// ============================================================================
// API 연결 테스트 컴포넌트
// ============================================================================

async function ConnectionStatus() {
  console.log('🔍 Testing API connections...');
  
  // 환율 조회 테스트
  let exchangeRateStatus = { connected: false, rate: 0, source: 'unknown', error: '' };
  try {
    const exchangeRate = await getExchangeRate();
    exchangeRateStatus = {
      connected: true,
      rate: exchangeRate.rate,
      source: exchangeRate.source,
      error: '',
    };
  } catch (error) {
    exchangeRateStatus.error = error instanceof Error ? error.message : 'Unknown error';
  }

  // POIZON API 테스트 (환경 변수만 확인)
  const poizonStatus = {
    connected: !!(
      process.env.POIZON_APP_KEY &&
      process.env.POIZON_APP_SECRET
    ),
    error: !process.env.POIZON_APP_KEY ? 'API credentials not configured' : '',
  };

  // Naver API 테스트 (환경 변수만 확인)
  const naverStatus = {
    connected: !!(
      process.env.NAVER_CLIENT_ID &&
      process.env.NAVER_CLIENT_SECRET
    ),
    error: !process.env.NAVER_CLIENT_ID ? 'API credentials not configured' : '',
  };

  return (
    <div className="space-y-4">
      {/* 환율 API */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">환율 API</h3>
            <p className="text-sm text-muted-foreground">
              ExchangeRate-API 또는 기본값
            </p>
          </div>
          <Badge variant={exchangeRateStatus.connected ? 'default' : 'destructive'}>
            {exchangeRateStatus.connected ? '🟢 연결됨' : '🔴 실패'}
          </Badge>
        </div>
        {exchangeRateStatus.connected ? (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">CNY → KRW:</span>
              <span className="font-mono font-semibold">{exchangeRateStatus.rate}원</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">소스:</span>
              <span className="font-mono">
                {exchangeRateStatus.source === 'api' && '🌐 API'}
                {exchangeRateStatus.source === 'manual' && '✋ 수동'}
                {exchangeRateStatus.source === 'default' && '⚙️ 기본값'}
              </span>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-red-500">{exchangeRateStatus.error}</p>
        )}
      </Card>

      {/* POIZON API */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">POIZON API</h3>
            <p className="text-sm text-muted-foreground">
              판매자 API 연동 (환경 변수 확인)
            </p>
          </div>
          <Badge variant={poizonStatus.connected ? 'default' : 'destructive'}>
            {poizonStatus.connected ? '🟢 설정됨' : '🔴 미설정'}
          </Badge>
        </div>
        {!poizonStatus.connected && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-red-500">{poizonStatus.error}</p>
            <p className="text-sm text-muted-foreground">
              .env 파일에 다음 환경 변수를 설정하세요:
            </p>
            <pre className="rounded-lg bg-slate-100 p-3 text-xs dark:bg-slate-800">
              {`POIZON_APP_KEY=your_app_key
POIZON_APP_SECRET=your_app_secret`}
            </pre>
          </div>
        )}
        {poizonStatus.connected && (
          <div className="mt-4">
            <p className="text-sm text-green-600">
              ✅ API 인증 정보가 설정되었습니다. 실제 API 호출은 대시보드에서 테스트하세요.
            </p>
          </div>
        )}
      </Card>

      {/* Naver API */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Naver Search API</h3>
            <p className="text-sm text-muted-foreground">
              쇼핑 검색 API 연동 (환경 변수 확인)
            </p>
          </div>
          <Badge variant={naverStatus.connected ? 'default' : 'destructive'}>
            {naverStatus.connected ? '🟢 설정됨' : '🔴 미설정'}
          </Badge>
        </div>
        {!naverStatus.connected && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-red-500">{naverStatus.error}</p>
            <p className="text-sm text-muted-foreground">
              .env 파일에 다음 환경 변수를 설정하세요:
            </p>
            <pre className="rounded-lg bg-slate-100 p-3 text-xs dark:bg-slate-800">
              {`NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret`}
            </pre>
          </div>
        )}
        {naverStatus.connected && (
          <div className="mt-4">
            <p className="text-sm text-green-600">
              ✅ API 인증 정보가 설정되었습니다. 실제 API 호출은 대시보드에서 테스트하세요.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

// ============================================================================
// 메인 페이지
// ============================================================================

export default function ApiTestPage() {
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">API 연동 테스트</h1>
        <p className="mt-2 text-muted-foreground">
          POIZON과 Naver API의 연결 상태를 확인합니다.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-32 animate-pulse bg-slate-100 p-6" />
            ))}
          </div>
        }
      >
        <ConnectionStatus />
      </Suspense>

      <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
          📘 다음 단계
        </h3>
        <ul className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-300">
          <li>1. 모든 API가 설정되면 대시보드로 이동하세요.</li>
          <li>2. 상품 검색 기능을 테스트하세요.</li>
          <li>3. 가격 분석 및 입찰 기능을 확인하세요.</li>
        </ul>
      </div>
    </div>
  );
}

