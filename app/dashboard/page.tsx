/**
 * @file app/dashboard/page.tsx
 * @description 메인 대시보드 페이지
 * 
 * POIZON 차익 분석 및 자동 입찰 대시보드의 메인 페이지입니다.
 */

'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { ProductSearch, type SearchMode } from '@/components/dashboard/product-search';
import { ProductCard } from '@/components/dashboard/product-card';
import { PriceAnalysisTable, type PriceAnalysisRow } from '@/components/dashboard/price-analysis-table';
import { BulkActionBar } from '@/components/dashboard/bulk-action-bar';
import { SettingsSidebar } from '@/components/dashboard/settings-sidebar';
import { searchProduct, searchProductByCustomCode, /* getProductSkus, */ getSpusWithSalesVolume } from '@/actions/product-actions';
import { /* fetchNaverPrice, */ fetchPoizonMarketPrice } from '@/actions/price-actions';
import { placeBid, placeBulkBids } from '@/actions/bid-actions';
import { DEFAULT_SETTINGS, calculateMargin, type CalculatorSettings } from '@/lib/calculator';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  // 상태 관리
  const [products, setProducts] = useState<any[]>([]);
  const [analysisData, setAnalysisData] = useState<PriceAnalysisRow[]>([]);
  const [settings, setSettings] = useState<CalculatorSettings>(DEFAULT_SETTINGS);
  const [selectedSkus, setSelectedSkus] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 상품 검색 (여러 개 지원 + 더미 데이터)
  const handleSearch = async (query: string, mode: SearchMode) => {
    console.group('🔍 Dashboard: handleSearch');
    console.log('Query:', query);
    console.log('Mode:', mode);
    
    setIsSearching(true);
    setProducts([]);
    setAnalysisData([]);
    
    try {
      // 더미 데이터 모드
      if (mode === 'demo') {
        toast.info('더미 데이터를 불러오고 있습니다...');
        
        const demoProducts = [
          {
            spuId: 'demo-001',
            styleCode: 'DD1503-101',
            brand: 'Nike',
            title: '나이키 덩크 로우 범고래',
            titleCn: '耐克 Dunk Low 熊猫',
            logoUrl: 'https://placehold.co/600x600/e2e8f0/1e293b?text=Nike+Dunk',
          },
          {
            spuId: 'demo-002',
            styleCode: 'CW2288-111',
            brand: 'Nike',
            title: '나이키 에어포스 1 화이트',
            titleCn: '耐克 Air Force 1 白色',
            logoUrl: 'https://placehold.co/600x600/e2e8f0/1e293b?text=Nike+AF1',
          },
        ];
        
        const demoAnalysis: PriceAnalysisRow[] = [
          {
            skuId: 'demo-sku-001',
            productName: '나이키 덩크 로우 범고래',
            size: '260',
            poizonPrice: 850,
            salesVolume: 12000,
            naverPrice: 145000,
            ...calculateMargin({ poizonPrice: 850, naverPrice: 145000 }, settings),
          },
          {
            skuId: 'demo-sku-002',
            productName: '나이키 덩크 로우 범고래',
            size: '265',
            poizonPrice: 880,
            salesVolume: 8000,
            naverPrice: 148000,
            ...calculateMargin({ poizonPrice: 880, naverPrice: 148000 }, settings),
          },
          {
            skuId: 'demo-sku-003',
            productName: '나이키 덩크 로우 범고래',
            size: '270',
            poizonPrice: 920,
            salesVolume: 5000,
            naverPrice: 152000,
            ...calculateMargin({ poizonPrice: 920, naverPrice: 152000 }, settings),
          },
          {
            skuId: 'demo-sku-004',
            productName: '나이키 에어포스 1 화이트',
            size: '260',
            poizonPrice: 650,
            salesVolume: 25000,
            naverPrice: 118000,
            ...calculateMargin({ poizonPrice: 650, naverPrice: 118000 }, settings),
          },
          {
            skuId: 'demo-sku-005',
            productName: '나이키 에어포스 1 화이트',
            size: '265',
            poizonPrice: 680,
            salesVolume: 20000,
            naverPrice: 122000,
            ...calculateMargin({ poizonPrice: 680, naverPrice: 122000 }, settings),
          },
        ];
        
        setProducts(demoProducts);
        setAnalysisData(demoAnalysis);
        toast.success('더미 데이터가 로드되었습니다! UI 테스트를 진행하세요.');
        
        console.log('✅ Demo data loaded');
        console.groupEnd();
        setIsSearching(false);
        return;
      }
      
      let styleCodesToSearch: string[] = [];
      
      if (mode === 'stylecode') {
        // 품번 검색: 콤마로 구분하여 여러 개 처리
        styleCodesToSearch = query
          .split(',')
          .map((code) => code.trim())
          .filter((code) => code.length > 0);
        
        toast.info(`${styleCodesToSearch.length}개 품번을 검색하고 있습니다...`);
      } else {
        // 브랜드 검색
        toast.info(`${query} 브랜드 상품을 검색하고 있습니다...`);
        styleCodesToSearch = [query];
      }
      
      const allProducts: any[] = [];
      const allAnalysis: PriceAnalysisRow[] = [];
      
      // 각 품번별로 검색
      for (const styleCode of styleCodesToSearch) {
        try {
          console.log(`\n🔎 Searching for styleCode: ${styleCode}`);
          
          // 1. 상품 검색 (2단계 전략)
          console.log('');
          console.log('🔄 API 호출 전략: Custom Code → Article Number (Fallback)');
          
          let searchResult;
          
          // 1-1. Custom Code API 먼저 시도 (판매량 포함)
          try {
            console.log('  ✅ Step 1: Custom Code API 시도...');
            const customCodeResult = await searchProductByCustomCode(styleCode);
            
            // 결과가 있는지 확인 (빈 배열이면 실패로 간주)
            if (customCodeResult.success && customCodeResult.data && Array.isArray(customCodeResult.data) && customCodeResult.data.length > 0) {
              console.log('  🎉 Custom Code API 성공! (결과 있음)');
              searchResult = customCodeResult;
            } else {
              console.warn('  ⚠️ Custom Code API 결과 없음 (빈 배열)');
              throw new Error('No results from Custom Code API');
            }
          } catch (error) {
            console.warn('  ⚠️ Custom Code API 실패 또는 결과 없음:', error instanceof Error ? error.message : error);
            
            // 1-2. 실패하거나 결과 없으면 원래 Article Number API 사용 (기존 방식)
            console.log('  ✅ Step 2: Article Number API로 Fallback...');
            searchResult = await searchProduct(styleCode);
            console.log('  🎉 Article Number API 성공! (기존 방식)');
          }
          
          console.log('');
          console.log('');
          console.log('█'.repeat(100));
          console.log('🔥🔥🔥 API 전체 응답 🔥🔥🔥');
          console.log('█'.repeat(100));
          console.log(JSON.stringify(searchResult, null, 2));
          console.log('█'.repeat(100));
          console.log('');
          
          // ===== 🔥 긴급 진단: 전체 응답 구조 출력 =====
          if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
            const firstProduct = searchResult.data[0];
            const firstSku = firstProduct.skuInfoList?.[0];
            
            console.group('🔥 긴급 진단 - 전체 데이터 구조');
            console.log('=== SPU 정보 ===');
            console.log('brandId:', firstProduct.spuInfo?.brandId);
            console.log('brandName:', firstProduct.spuInfo?.brandName);
            console.log('globalSpuId:', firstProduct.globalSpuId);
            console.log('title:', firstProduct.spuInfo?.title);
            
            console.log('\n=== 첫 번째 SKU 정보 ===');
            console.log('globalSkuId:', firstSku?.globalSkuId);
            console.log('properties:', firstSku?.properties);
            
            console.log('\n=== 가격 관련 모든 필드 ===');
            console.log('price:', firstSku?.price);
            console.log('minPrice (전체):', JSON.stringify(firstSku?.minPrice, null, 2));
            console.log('salePrice:', (firstSku as any)?.salePrice);
            console.log('marketPrice:', (firstSku as any)?.marketPrice);
            console.log('costPrice:', (firstSku as any)?.costPrice);
            
            console.log('\n=== 판매량 관련 모든 필드 ===');
            console.log('localSoldNum:', firstSku?.localSoldNum);
            console.log('globalSoldNum:', firstSku?.globalSoldNum);
            console.log('localMonthToMonth:', firstSku?.localMonthToMonth);
            console.log('globalMonthToMonth:', firstSku?.globalMonthToMonth);
            console.log('averagePrice (전체):', JSON.stringify(firstSku?.averagePrice, null, 2));
            console.log('salesVolume:', (firstSku as any)?.salesVolume);
            console.log('soldNum:', (firstSku as any)?.soldNum);
            console.log('sales:', (firstSku as any)?.sales);
            console.log('commoditySalesInfo:', JSON.stringify((firstSku as any)?.commoditySalesInfo, null, 2));
            
            console.log('\n=== SKU 객체의 모든 키 ===');
            console.log('전체 필드 목록:', Object.keys(firstSku || {}).sort());
            
            console.log('\n=== 전체 SKU 객체 (JSON) ===');
            console.log(JSON.stringify(firstSku, null, 2));
            
            console.groupEnd();
          }
          
          // 판매량 데이터를 담을 Map (globalSpuId -> 판매량 데이터)
          const salesVolumeMap = new Map<number, {
            localSoldNum?: number;
            globalSoldNum?: number;
            localMonthToMonth?: number;
            globalMonthToMonth?: number;
            averagePrice?: any;
          }>();
          
          // SKU 응답에 판매량 필드가 있는지 확인
          if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
            const firstSku = searchResult.data[0].skuInfoList?.[0];
            const spuInfo = searchResult.data[0].spuInfo;
            
            console.log('📊 SKU 판매량 필드 확인:', {
              localSoldNum: firstSku?.localSoldNum ?? 'X',
              globalSoldNum: firstSku?.globalSoldNum ?? 'X',
              localMonthToMonth: firstSku?.localMonthToMonth ?? 'X',
              globalMonthToMonth: firstSku?.globalMonthToMonth ?? 'X',
              averagePrice: firstSku?.averagePrice ? JSON.stringify(firstSku.averagePrice) : 'X',
              전체필드: Object.keys(firstSku || {}).sort()
            });
            
            // 브랜드 ID로 판매량 조회 (무조건 시도)
            console.log('');
            console.log('='.repeat(80));
            console.log('🔎🔎🔎 브랜드 ID 확인 🔎🔎🔎');
            console.log('spuInfo?.brandId:', spuInfo?.brandId);
            console.log('firstSku?.globalSoldNum:', firstSku?.globalSoldNum);
            console.log('조건 충족:', !!spuInfo?.brandId);
            console.log('='.repeat(80));
            console.log('');
            
            // ⚠️ 브랜드 API는 401 권한 에러 발생 중
            // 대안: getMarketPrice API를 각 SKU마다 호출하여 가격 획득
            console.log('⚠️ 브랜드 API는 401 권한 에러로 사용 불가');
            console.log('✅ 대안: 각 SKU마다 시장 최저가 API 호출 (getMarketPrice)');
            
            if (false && spuInfo?.brandId) {  // 브랜드 API 비활성화
              console.group('🔄 브랜드 ID로 판매량 조회 시도');
              console.log('brandId:', spuInfo.brandId);
              console.log('globalSpuId:', searchResult.data[0].globalSpuId);
              
              try {
                const brandResult = await getSpusWithSalesVolume(spuInfo.brandId, 'US');
                console.log('📊 브랜드 API 응답:', {
                  success: brandResult.success,
                  hasData: !!brandResult.data,
                  hasContents: !!brandResult.data?.contents,
                  contentsLength: brandResult.data?.contents?.length || 0,
                  error: brandResult.error
                });
                
                if (brandResult.success && brandResult.data?.contents) {
                  console.log('📦 받은 SPU 목록:', brandResult.data.contents.map((spu: any) => ({
                    globalSpuId: spu.globalSpuId,
                    title: spu.title,
                    localSoldNum: spu.localSoldNum,
                    globalSoldNum: spu.globalSoldNum,
                  })));
                  
                  // 현재 상품과 일치하는 SPU 찾기
                  const matchingSpu = brandResult.data.contents.find(
                    (spu: any) => spu.globalSpuId === searchResult.data[0].globalSpuId
                  );
                  
                  if (matchingSpu) {
                    console.log('✅ 일치하는 SPU 발견!');
                    console.log('판매량 데이터:', {
                      localSoldNum: matchingSpu.localSoldNum,
                      globalSoldNum: matchingSpu.globalSoldNum,
                      localMonthToMonth: matchingSpu.localMonthToMonth,
                      globalMonthToMonth: matchingSpu.globalMonthToMonth,
                      averagePrice: matchingSpu.averagePrice,
                      minPrice: matchingSpu.minPrice,
                    });
                    
                    // Map에 저장
                    salesVolumeMap.set(searchResult.data[0].globalSpuId, {
                      localSoldNum: matchingSpu.localSoldNum,
                      globalSoldNum: matchingSpu.globalSoldNum,
                      localMonthToMonth: matchingSpu.localMonthToMonth,
                      globalMonthToMonth: matchingSpu.globalMonthToMonth,
                      averagePrice: matchingSpu.averagePrice,
                    });
                    
                    console.log('💾 Map에 저장 완료. Map 크기:', salesVolumeMap.size);
                  } else {
                    console.warn('⚠️ 일치하는 SPU를 찾을 수 없음');
                    console.log('찾으려는 globalSpuId:', searchResult.data[0].globalSpuId);
                    console.log('받은 globalSpuIds:', brandResult.data.contents.map((s: any) => s.globalSpuId));
                  }
                } else {
                  console.error('❌ 브랜드 API 호출 실패 또는 데이터 없음');
                  if (brandResult.error) {
                    console.error('에러 메시지:', brandResult.error);
                  }
                }
              } catch (err) {
                console.error('❌ 브랜드 조회 중 예외 발생:', err);
                if (err instanceof Error) {
                  console.error('에러 스택:', err.stack);
                }
              }
              
              console.groupEnd();
            } else if (firstSku?.globalSoldNum) {
              // SKU 데이터에 판매량이 있으면 바로 저장
              salesVolumeMap.set(searchResult.data[0].globalSpuId, {
                localSoldNum: firstSku.localSoldNum,
                globalSoldNum: firstSku.globalSoldNum,
                localMonthToMonth: firstSku.localMonthToMonth,
                globalMonthToMonth: firstSku.globalMonthToMonth,
                averagePrice: firstSku.averagePrice,
              });
            }
          }
      
          if (!searchResult.success || !searchResult.data) {
            console.error(`❌ 품번 ${styleCode} 검색 실패:`, searchResult.error);
            toast.error(`"${styleCode}" 검색 실패: ${searchResult.error || '알 수 없는 오류'}`);
            continue;
          }
          
          // API 응답은 배열이므로 첫 번째 항목을 가져옴
          if (!searchResult.data || searchResult.data.length === 0) {
            console.warn(`⚠️ 품번 ${styleCode} 검색 결과 없음`);
            toast.warning(`"${styleCode}" 검색 결과가 없습니다.`);
            continue;
          }
          
          const productData = searchResult.data[0]; // 배열의 첫 번째 항목
          
          if (!productData.skuInfoList || productData.skuInfoList.length === 0) {
            console.warn(`⚠️ 품번 ${styleCode}의 SKU 정보 없음`);
            toast.warning(`"${styleCode}"의 사이즈 정보가 없습니다.`);
            continue;
          }
          
          console.log(`✅ Found ${productData.skuInfoList.length} SKUs for ${styleCode}`);
          
          // 2. 각 SKU별 가격 분석 (시장 최저가 조회 포함)
          for (const skuInfo of productData.skuInfoList) {
            try {
              // 2-1. POIZON 시장 최저가 조회 (권한 있는 API 사용)
              let poizonMarketPriceData: any = null;
              if (skuInfo.globalSkuId) {
                console.log(`💰 시장 최저가 조회 중... (globalSkuId: ${skuInfo.globalSkuId})`);
                const marketPriceResult = await fetchPoizonMarketPrice(skuInfo.globalSkuId, 'US', 'USD');
                
                if (marketPriceResult.success && marketPriceResult.data) {
                  poizonMarketPriceData = marketPriceResult.data;
                  console.log(`  ✅ 시장 최저가 획득:`, {
                    globalMinPrice: poizonMarketPriceData.globalMinPrice,
                    localMinPrice: poizonMarketPriceData.localMinPrice,
                    usMinPrice: poizonMarketPriceData.usMinPrice,
                  });
                } else {
                  console.warn(`  ⚠️ 시장 최저가 조회 실패:`, marketPriceResult.error);
                }
              }
              // 상품 정보 저장 (중복 방지)
              if (!allProducts.find(p => p.globalSpuId === productData.globalSpuId)) {
                allProducts.push({
                  globalSpuId: productData.globalSpuId,
                  title: productData.spuInfo?.title || `${styleCode} - ${productData.spuInfo?.brandName || 'Unknown'}`,
                  logoUrl: productData.spuInfo?.logoUrl,
                  brand: productData.spuInfo?.brandName,
                  styleCode: styleCode,
                });
              }
              
              // 속성 정보 추출 (regionSalePvInfoList에서)
              const colorInfo = skuInfo.regionSalePvInfoList?.find(pv => pv.name === 'Color' || pv.definitionId === 1);
              const colorValue = colorInfo?.value || '';
              
              const sizeInfo = skuInfo.regionSalePvInfoList?.find(pv => pv.name === 'Size' || pv.definitionId === 6);
              const sizeValue = sizeInfo?.value || skuInfo.properties || 'N/A';
              
              // 모든 사이즈 정보 추출
              const allSizeInfo = sizeInfo?.sizeInfos?.reduce((acc, size) => {
                acc[size.sizeKey] = size.value;
                return acc;
              }, {} as Record<string, string>) || {};
              
              // 기타 모든 속성 추출
              const otherProperties = skuInfo.regionSalePvInfoList
                ?.filter(pv => pv.name !== 'Size' && pv.name !== 'Color')
                .map(pv => `${pv.name}: ${pv.value}`)
                .join(', ') || '';
              
              // POIZON 시장가 추출
              const poizonPrice = (() => {
                console.log(`💰 가격 추출 시도 (SKU: ${skuInfo.globalSkuId}, 사이즈: ${sizeValue}):`, {
                  'marketPriceData': poizonMarketPriceData ? 'API에서 획득' : '없음',
                  'skuInfo.price': skuInfo.price,
                  'skuInfo.minPrice': skuInfo.minPrice,
                });
                
                // 1순위: 시장 최저가 API 응답 (getMarketPrice)
                if (poizonMarketPriceData) {
                  // USD 기준 최저가 (센트 단위)
                  const marketPrice = poizonMarketPriceData.usMinPrice 
                    || poizonMarketPriceData.localMinPrice 
                    || poizonMarketPriceData.globalMinPrice;
                  
                  if (marketPrice && marketPrice > 0) {
                    console.log(`  ✅ 시장 최저가 API 사용: ${marketPrice} (센트 단위)`);
                    // USD 센트 → CNY 위안 변환 (임시: 1 USD = 7 CNY, 100 센트 = 1 USD)
                    const priceInYuan = Math.round(marketPrice / 100 * 7);
                    console.log(`  → CNY 환산: ¥${priceInYuan}`);
                    return priceInYuan;
                  }
                }
                
                // 2순위: price 필드
                if (skuInfo.price && skuInfo.price > 0) {
                  console.log(`  ✅ price 필드 사용: ${skuInfo.price}`);
                  return skuInfo.price;
                }
                
                // 3순위: minPrice 객체에서 추출
                if (skuInfo.minPrice) {
                  const minPriceObj = skuInfo.minPrice as any;
                  console.log(`  📦 minPrice 객체:`, minPriceObj);
                  
                  if (typeof minPriceObj === 'number') {
                    console.log(`  ✅ minPrice(number) 사용: ${minPriceObj}`);
                    return minPriceObj;
                  }
                  
                  if (minPriceObj.CNY) {
                    console.log(`  ✅ minPrice.CNY 사용: ${minPriceObj.CNY}`);
                    return minPriceObj.CNY;
                  }
                  if (minPriceObj.USD) {
                    console.log(`  ✅ minPrice.USD 사용: ${minPriceObj.USD}`);
                    return minPriceObj.USD;
                  }
                }
                
                console.warn(`  ⚠️ 가격 정보 없음!`);
                return 0;
              })();
              
              // ===== 네이버 API는 추후 별도 버튼 또는 일괄 처리로 구현 =====
              // TODO: 네이버 가격 조회 기능은 별도로 구현
              // const naverResult = await fetchNaverPrice(styleCode, sizeValue);
              
              // POIZON 데이터만으로 테이블 구성
              allAnalysis.push({
                // UI 식별자
                skuId: String(skuInfo.globalSkuId),
                
                // POIZON API 데이터
                globalSkuId: skuInfo.globalSkuId,
                globalSpuId: productData.globalSpuId,
                regionSkuId: skuInfo.regionSkuId,
                dwSkuId: skuInfo.dwSkuId,
                
                // ========================================
                // 🔥 RAW DATA: 3개 API 원본 응답 (변환 없음!)
                // ========================================
                rawSkuInfo: skuInfo,                    // API 1: SKU 기본 정보 (전체)
                rawMarketPrice: poizonMarketPriceData,  // API 2: 시장 최저가 (전체)
                rawBrandStats: salesVolumeMap.get(productData.globalSpuId), // API 3: 판매량 (전체)
                
                // ========================================
                // 기존 매핑 데이터 (참고용, 정확하지 않을 수 있음)
                // ========================================
                brand: productData.spuInfo?.brandName || 'Unknown',
                productName: productData.spuInfo?.title || `${styleCode} - Unknown`,
                articleNumber: styleCode,
                categoryName: productData.spuInfo?.categoryName,
                fit: productData.spuInfo?.fit || '', // 남성용/여성용
                
                // 옵션 정보
                color: colorValue,
                otherOptions: otherProperties,
                
                // 사이즈 정보
                size: sizeValue,
                sizeUS: allSizeInfo['US Women'] || allSizeInfo['US Men'] || allSizeInfo['US'] || '',
                sizeEU: allSizeInfo['EU'] || '',
                sizeUK: allSizeInfo['UK'] || '',
                sizeJP: allSizeInfo['JP'] || '',
                sizeKR: allSizeInfo['KR'] || '',
                
                // 가격 정보 (임시 추측 - 정확하지 않음!)
                poizonPrice,
                minPrice: skuInfo.minPrice ? JSON.stringify(skuInfo.minPrice) : '', // 최저가 정보
                
                // 상태 정보
                status: skuInfo.status === 1 ? '활성' : '비활성',
                buyStatus: skuInfo.buyStatus === 1 ? '구매가능' : '구매불가',
                userHasBid: skuInfo.userHasBid ? '입찰함' : '미입찰',
                
                // 바코드 정보 (여러 개일 수 있음)
                barCode: skuInfo.barCode || '',
                barcodeList: skuInfo.barcodeInfoList?.map(bc => `${bc.codeTypeStr}: ${bc.codeInfo}`).join(' | ') || '',
                
                // 이미지
                logoUrl: skuInfo.logoUrl || productData.spuInfo?.logoUrl,
                
                // 정렬 순서
                sortOrder: skuInfo.sort || 0,
                
                // 판매량 (임시 추측 - 정확하지 않음!)
                salesVolume: skuInfo.globalSoldNum || skuInfo.localSoldNum || 0,
                expectedSales: 0,
                sales30Days: 0,
                
                // 네이버 가격 (추후 추가)
                naverPrice: 0,
                
                // 마진 계산 (추후 네이버 가격 조회 후 계산)
                expectedRevenue: 0,
                expectedCost: 0,
                profit: 0,
                roi: 0,
              } as PriceAnalysisRow & { 
                globalSkuId: number;
                globalSpuId: number;
                regionSkuId?: number;
                dwSkuId?: number;
                brand: string;
                articleNumber: string;
                categoryName?: string;
                fit: string;
                color: string;
                otherOptions: string;
                sizeUS: string;
                sizeEU: string;
                sizeUK: string;
                sizeJP: string;
                sizeKR: string;
                minPrice: string;
                status: string;
                buyStatus: string;
                userHasBid: string;
                barCode: string;
                barcodeList: string;
                logoUrl?: string;
                sortOrder: number;
                salesVolume: number;
                expectedSales: number;
                sales30Days: number;
              });
              
              console.log(`  ✅ SKU 추가: ${sizeValue} (${allSizeInfo['KR'] || 'N/A'} KR)`);
            } catch (error) {
              console.error(`Error analyzing SKU:`, error);
            }
          }
        } catch (error) {
          console.error(`Error processing styleCode ${styleCode}:`, error);
          toast.error(`"${styleCode}" 처리 중 오류 발생`);
        }
      }
      
      setProducts(allProducts);
      setAnalysisData(allAnalysis);
      
      if (allProducts.length === 0) {
        toast.warning('검색 결과가 없습니다.');
      } else {
        toast.success(`${allProducts.length}개 상품, ${allAnalysis.length}개 사이즈 분석 완료!`);
      }
      
      console.log('✅ Search complete:', { products: allProducts.length, analysis: allAnalysis.length });
      console.groupEnd();
    } catch (error) {
      console.error('❌ Error:', error);
      toast.error('오류가 발생했습니다.');
      console.groupEnd();
    } finally {
      setIsSearching(false);
    }
  };

  // 단일 입찰
  const handleBid = async (skuId: string, bidPrice: number) => {
    console.log('💰 Bidding:', skuId, bidPrice);
    
    try {
      // skuId로 analysisData에서 globalSkuId 찾기
      const analysisRow = analysisData.find(row => row.skuId === skuId) as (PriceAnalysisRow & { globalSkuId?: number });
      
      if (!analysisRow?.globalSkuId) {
        toast.error('상품 정보를 찾을 수 없습니다.');
        return;
      }
      
      const result = await placeBid({
        globalSkuId: analysisRow.globalSkuId,
        bidPrice: bidPrice,
      });
      
      if (!result.success) {
        toast.error(result.error || '입찰에 실패했습니다.');
        return;
      }
      
      toast.success(`입찰 완료! ${result.data?.tips || ''}`);
    } catch (error) {
      console.error('Error bidding:', error);
      toast.error('입찰 중 오류가 발생했습니다.');
    }
  };

  // 일괄 입찰
  const handleBulkBid = async () => {
    console.log('💰💰 Bulk bidding:', selectedSkus);
    
    if (selectedSkus.length === 0) {
      toast.warning('입찰할 상품을 선택해주세요.');
      return;
    }
    
    try {
      // 선택된 SKU의 입찰가 수집
      const bids = selectedSkus
        .map((skuId) => {
          const row = analysisData.find((r) => r.skuId === skuId) as (PriceAnalysisRow & { globalSkuId?: number });
          if (!row || !row.myBidPrice || !row.globalSkuId) return null;
          return { 
            globalSkuId: row.globalSkuId,
            bidPrice: row.myBidPrice 
          };
        })
        .filter((bid): bid is { globalSkuId: number; bidPrice: number } => bid !== null);
      
      if (bids.length === 0) {
        toast.warning('입찰가를 입력해주세요.');
        return;
      }
      
      toast.info(`${bids.length}개 상품에 입찰 중...`);
      const result = await placeBulkBids(bids);
      
      if (!result.success) {
        toast.error(result.error || '일괄 입찰에 실패했습니다.');
        return;
      }
      
      toast.success(
        `입찰 완료! 성공: ${result.data?.successCount}, 실패: ${result.data?.failCount}`
      );
      setSelectedSkus([]);
    } catch (error) {
      console.error('Error bulk bidding:', error);
      toast.error('일괄 입찰 중 오류가 발생했습니다.');
    }
  };

  // 엑셀 다운로드
  const handleExportExcel = () => {
    console.log('📥 Exporting to Excel');
    toast.info('엑셀 다운로드 기능은 곧 추가될 예정입니다.');
  };

  // 설정 변경
  const handleSettingsChange = (newSettings: CalculatorSettings) => {
    console.log('⚙️ Settings changed:', newSettings);
    setSettings(newSettings);
    toast.success('설정이 적용되었습니다.');
    
    // 분석 데이터가 있으면 재계산
    if (analysisData.length > 0) {
      const updatedAnalysis = analysisData.map((row) => {
        const margin = calculateMargin(
          {
            poizonPrice: row.poizonPrice,
            naverPrice: row.naverPrice,
          },
          newSettings
        );
        
        return {
          ...row,
          expectedRevenue: margin.expectedRevenue,
          expectedCost: margin.expectedCost,
          profit: margin.profit,
          roi: margin.roi,
        };
      });
      
      setAnalysisData(updatedAnalysis);
    }
  };

  return (
    <DashboardLayout
      sidebar={
        <SettingsSidebar
          settings={settings}
          onSettingsChange={handleSettingsChange}
          apiStatus={{
            poizon: true,
            naver: true,
            exchangeRate: true,
          }}
        />
      }
    >
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-3xl font-bold">POIZON 차익 분석 대시보드</h1>
        <p className="mt-2 text-muted-foreground">
          품번을 입력하여 실시간 마진을 분석하고 최적의 가격으로 입찰하세요.
        </p>
      </div>

      {/* 상품 검색 */}
      <ProductSearch onSearch={handleSearch} isLoading={isSearching} />

      {/* 검색된 상품 목록 */}
      {products.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">검색된 상품</h2>
            <Badge variant="secondary">{products.length}개</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard 
                key={`product-${product.spuId}-${product.globalSpuId}`} 
                product={product} 
              />
            ))}
          </div>
        </div>
      )}

      {/* 가격 분석 테이블 */}
      <PriceAnalysisTable
        data={analysisData}
        onBid={handleBid}
        isLoading={isSearching}
        selectedSkus={selectedSkus}
        onSelectionChange={setSelectedSkus}
      />

      {/* 일괄 작업 바 */}
      <BulkActionBar
        selectedCount={selectedSkus.length}
        onBulkBid={handleBulkBid}
        onExportExcel={handleExportExcel}
      />
    </DashboardLayout>
  );
}

