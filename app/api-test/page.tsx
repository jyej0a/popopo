/**
 * @file app/api-test/page.tsx
 * @description API 연동 테스트 페이지
 * 
 * POIZON API와 Naver API의 실제 동작을 테스트합니다.
 * 
 * 주요 기능:
 * 1. API 연결 상태 확인
 * 2. 환율 조회 테스트
 * 3. POIZON API 실제 호출 테스트
 * 4. Naver API 실제 호출 테스트
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { searchProduct, searchProductByCustomCode } from '@/actions/product-actions';
import { fetchNaverPrice } from '@/actions/price-actions';
import { fetchCurrentExchangeRate } from '@/actions/settings-actions';
import { toast } from 'sonner';

// ============================================================================
// API 테스트 컴포넌트
// ============================================================================

export default function ApiTestPage() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, any>>({});
  const [testInputs, setTestInputs] = useState({
    styleCode: 'DD1503-101',
    naverQuery: '나이키 덩크 로우',
  });

  // 로딩 상태 설정
  const setLoadingState = (key: string, value: boolean) => {
    setLoading((prev) => ({ ...prev, [key]: value }));
  };

  // 결과 저장
  const setResult = (key: string, value: any) => {
    setResults((prev) => ({ ...prev, [key]: value }));
  };

  // POIZON API - 품번 검색 테스트
  const testPoizonSearch = async () => {
    setLoadingState('poizonSearch', true);
    try {
      const result = await searchProduct(testInputs.styleCode, 'US');
      setResult('poizonSearch', result);

      if (result.success) {
        toast.success(`POIZON 검색 성공! ${result.data?.length || 0}개 상품 발견`);
      } else {
        toast.error(`POIZON 검색 실패: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      setResult('poizonSearch', { success: false, error: errorMessage });
      toast.error(`POIZON 검색 오류: ${errorMessage}`);
    } finally {
      setLoadingState('poizonSearch', false);
    }
  };

  // POIZON API - 커스텀 코드 검색 테스트
  const testPoizonCustomCode = async () => {
    setLoadingState('poizonCustomCode', true);
    try {
      const result = await searchProductByCustomCode(testInputs.styleCode, 'US');
      setResult('poizonCustomCode', result);

      if (result.success) {
        toast.success(`POIZON 커스텀 코드 검색 성공!`);
      } else {
        toast.error(`POIZON 커스텀 코드 검색 실패: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      setResult('poizonCustomCode', { success: false, error: errorMessage });
      toast.error(`POIZON 커스텀 코드 검색 오류: ${errorMessage}`);
    } finally {
      setLoadingState('poizonCustomCode', false);
    }
  };

  // Naver API - 쇼핑 검색 테스트
  const testNaverSearch = async () => {
    setLoadingState('naverSearch', true);
    try {
      const result = await fetchNaverPrice(testInputs.naverQuery);
      setResult('naverSearch', result);

      if (result.success && result.data) {
        toast.success(`Naver 검색 성공! 최저가: ₩${result.data.lowestPrice.toLocaleString()}`);
      } else {
        toast.error(`Naver 검색 실패: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      setResult('naverSearch', { success: false, error: errorMessage });
      toast.error(`Naver 검색 오류: ${errorMessage}`);
    } finally {
      setLoadingState('naverSearch', false);
    }
  };

  // 환율 조회 테스트
  const testExchangeRate = async () => {
    setLoadingState('exchangeRate', true);
    try {
      const result = await fetchCurrentExchangeRate();
      setResult('exchangeRate', result);

      if (result.success && result.data) {
        toast.success(`환율 조회 성공! CNY → KRW: ${result.data.rate}원`);
      } else {
        toast.error(`환율 조회 실패: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      setResult('exchangeRate', { success: false, error: errorMessage });
      toast.error(`환율 조회 오류: ${errorMessage}`);
    } finally {
      setLoadingState('exchangeRate', false);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">API 연동 테스트</h1>
        <p className="mt-2 text-muted-foreground">
          각 API의 실제 동작을 테스트하고 결과를 확인합니다.
        </p>
      </div>

      <div className="space-y-6">
        {/* 입력 필드 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">테스트 입력값</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="styleCode">POIZON 품번 (Style Code)</Label>
              <Input
                id="styleCode"
                value={testInputs.styleCode}
                onChange={(e) => setTestInputs((prev) => ({ ...prev, styleCode: e.target.value }))}
                placeholder="예: DD1503-101"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="naverQuery">Naver 검색어</Label>
              <Input
                id="naverQuery"
                value={testInputs.naverQuery}
                onChange={(e) => setTestInputs((prev) => ({ ...prev, naverQuery: e.target.value }))}
                placeholder="예: 나이키 덩크 로우"
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        {/* POIZON API 테스트 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">POIZON API</h3>
              <p className="text-sm text-muted-foreground">
                품번으로 상품 검색 및 SKU 정보 조회
              </p>
            </div>
            <Badge variant="default">판매자 API</Badge>
          </div>

          <div className="space-y-4">
            {/* 품번 검색 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Button
                  onClick={testPoizonSearch}
                  disabled={loading.poizonSearch}
                  size="sm"
                >
                  {loading.poizonSearch ? '테스트 중...' : '품번 검색 테스트'}
                </Button>
                <span className="text-sm text-muted-foreground">
                  Article Number API
                </span>
              </div>
              {results.poizonSearch && (
                <div className="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={results.poizonSearch.success ? 'default' : 'destructive'}>
                      {results.poizonSearch.success ? '✅ 성공' : '❌ 실패'}
                    </Badge>
                    {results.poizonSearch.success && (
                      <span className="text-sm">
                        {results.poizonSearch.data?.length || 0}개 상품 발견
                      </span>
                    )}
                  </div>
                  {results.poizonSearch.error && (
                    <p className="text-sm text-red-500">{results.poizonSearch.error}</p>
                  )}
                  {results.poizonSearch.success && results.poizonSearch.data && results.poizonSearch.data.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm cursor-pointer text-muted-foreground">
                        응답 데이터 보기
                      </summary>
                      <pre className="mt-2 p-2 text-xs overflow-auto max-h-60 rounded bg-slate-100 dark:bg-slate-800">
                        {JSON.stringify(results.poizonSearch.data[0], null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>

            {/* 커스텀 코드 검색 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Button
                  onClick={testPoizonCustomCode}
                  disabled={loading.poizonCustomCode}
                  size="sm"
                  variant="outline"
                >
                  {loading.poizonCustomCode ? '테스트 중...' : '커스텀 코드 검색 테스트'}
                </Button>
                <span className="text-sm text-muted-foreground">
                  Custom Code API (판매량 포함)
                </span>
              </div>
              {results.poizonCustomCode && (
                <div className="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={results.poizonCustomCode.success ? 'default' : 'destructive'}>
                      {results.poizonCustomCode.success ? '✅ 성공' : '❌ 실패'}
                    </Badge>
                  </div>
                  {results.poizonCustomCode.error && (
                    <p className="text-sm text-red-500">{results.poizonCustomCode.error}</p>
                  )}
                  {results.poizonCustomCode.success && results.poizonCustomCode.data && (
                    <details className="mt-2">
                      <summary className="text-sm cursor-pointer text-muted-foreground">
                        응답 데이터 보기
                      </summary>
                      <pre className="mt-2 p-2 text-xs overflow-auto max-h-60 rounded bg-slate-100 dark:bg-slate-800">
                        {JSON.stringify(results.poizonCustomCode.data[0], null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Naver API 테스트 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Naver Search API</h3>
              <p className="text-sm text-muted-foreground">
                쇼핑 검색 및 최저가 조회
              </p>
            </div>
            <Badge variant="default">검색 API</Badge>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button
                onClick={testNaverSearch}
                disabled={loading.naverSearch}
                size="sm"
              >
                {loading.naverSearch ? '테스트 중...' : 'Naver 검색 테스트'}
              </Button>
            </div>
            {results.naverSearch && (
              <div className="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={results.naverSearch.success ? 'default' : 'destructive'}>
                    {results.naverSearch.success ? '✅ 성공' : '❌ 실패'}
                  </Badge>
                  {results.naverSearch.success && results.naverSearch.data && (
                    <span className="text-sm">
                      최저가: ₩{results.naverSearch.data.lowestPrice.toLocaleString()}
                      {results.naverSearch.data.averagePrice && (
                        <span className="ml-2 text-muted-foreground">
                          평균가: ₩{results.naverSearch.data.averagePrice.toLocaleString()}
                        </span>
                      )}
                    </span>
                  )}
                </div>
                {results.naverSearch.error && (
                  <p className="text-sm text-red-500">{results.naverSearch.error}</p>
                )}
                {results.naverSearch.success && results.naverSearch.data && (
                  <details className="mt-2">
                    <summary className="text-sm cursor-pointer text-muted-foreground">
                      응답 데이터 보기
                    </summary>
                    <div className="mt-2 space-y-2">
                      <pre className="p-2 text-xs overflow-auto max-h-60 rounded bg-slate-100 dark:bg-slate-800">
                        {JSON.stringify(results.naverSearch.data, null, 2)}
                      </pre>
                      {results.naverSearch.data.items && results.naverSearch.data.items.length > 0 && (
                        <div className="text-sm">
                          <p className="font-semibold mb-1">상위 상품:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {results.naverSearch.data.items.slice(0, 3).map((item: any, idx: number) => (
                              <li key={idx}>
                                {item.title} - ₩{item.price.toLocaleString()} ({item.mallName})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* 환율 API 테스트 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">환율 API</h3>
              <p className="text-sm text-muted-foreground">
                CNY/KRW 환율 조회
              </p>
            </div>
            <Badge variant="default">ExchangeRate-API</Badge>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button
                onClick={testExchangeRate}
                disabled={loading.exchangeRate}
                size="sm"
              >
                {loading.exchangeRate ? '테스트 중...' : '환율 조회 테스트'}
              </Button>
            </div>
            {results.exchangeRate && (
              <div className="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={results.exchangeRate.success ? 'default' : 'destructive'}>
                    {results.exchangeRate.success ? '✅ 성공' : '❌ 실패'}
                  </Badge>
                  {results.exchangeRate.success && results.exchangeRate.data && (
                    <span className="text-sm">
                      CNY → KRW: {results.exchangeRate.data.rate}원
                      <span className="ml-2 text-muted-foreground">
                        (소스: {results.exchangeRate.data.source === 'api' ? '🌐 API' :
                          results.exchangeRate.data.source === 'manual' ? '✋ 수동' :
                            '⚙️ 기본값'})
                      </span>
                    </span>
                  )}
                </div>
                {results.exchangeRate.error && (
                  <p className="text-sm text-red-500">{results.exchangeRate.error}</p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* 안내 메시지 */}
        <Card className="p-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📘 테스트 안내
          </h3>
          <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
            <li>• 각 버튼을 클릭하여 실제 API를 호출하고 결과를 확인하세요.</li>
            <li>• POIZON API는 실제 품번을 입력해야 정확한 결과를 얻을 수 있습니다.</li>
            <li>• Naver API는 검색어를 입력하여 국내 최저가를 조회합니다.</li>
            <li>• 환율 API는 ExchangeRate-API를 사용하며, 실패 시 기본값(190원)을 반환합니다.</li>
            <li>• 모든 API 호출은 서버 사이드에서 실행되므로 API 키가 안전하게 보호됩니다.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
