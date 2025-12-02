/**
 * @file components/dashboard/price-analysis-table.tsx
 * @description POIZON 상품 분석 테이블 (컬럼 필터 기능 포함)
 * 
 * 엑셀 템플릿처럼 사용자가 원하는 컬럼만 선택해서 볼 수 있습니다.
 */

'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Columns3, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// ============================================================================
// 타입 정의
// ============================================================================

export interface PriceAnalysisRow {
  // UI 식별자
  skuId: string;
  
  // POIZON API ID들
  globalSkuId?: number;
  globalSpuId?: number;
  regionSkuId?: number;
  dwSkuId?: number;
  
  // 상품 정보
  brand?: string;
  productName?: string;
  articleNumber?: string; // 품번
  categoryName?: string;
  fit?: string; // 남성용/여성용
  
  // 옵션 정보
  color?: string; // 색상
  otherOptions?: string; // 기타 옵션
  
  // 사이즈 정보
  size: string; // 메인 사이즈 (표시용)
  sizeUS?: string;
  sizeEU?: string;
  sizeUK?: string;
  sizeJP?: string;
  sizeKR?: string;
  
  // 가격 정보
  poizonPrice: number; // CNY (센트 단위)
  minPrice?: string; // 최저가 정보
  naverPrice: number; // KRW
  
  // 상태 정보
  status?: string; // 활성/비활성
  buyStatus?: string; // 구매가능/구매불가
  userHasBid?: string; // 입찰 여부
  
  // 바코드 정보
  barCode?: string;
  barcodeList?: string; // 모든 바코드 목록
  
  // 이미지
  logoUrl?: string;
  
  // 정렬
  sortOrder?: number;
  
  // 기타
  salesVolume?: number; // 현재 판매량 (스크래핑 필요)
  sales30Days?: number; // 30일 판매량 (스크래핑 필요)
  expectedSales?: number; // 예상 판매량 (계산 필요)
  
  // 마진 계산 (네이버 가격 조회 후)
  expectedRevenue: number; // KRW
  expectedCost: number; // KRW
  profit: number; // KRW
  roi: number; // %
  
  // 입찰가
  myBidPrice?: number; // CNY
}

interface PriceAnalysisTableProps {
  data: PriceAnalysisRow[];
  onBid: (skuId: string, bidPrice: number) => Promise<void>;
  isLoading?: boolean;
  selectedSkus?: string[];
  onSelectionChange?: (skuIds: string[]) => void;
}

// ============================================================================
// 컬럼 정의
// ============================================================================

type ColumnKey = keyof PriceAnalysisRow | 'select' | 'actions';

interface ColumnDefinition {
  key: ColumnKey;
  label: string;
  description?: string;
  defaultVisible: boolean;
  category: 'selection' | 'basic' | 'ids' | 'sizes' | 'prices' | 'status' | 'other' | 'actions';
}

const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  // 선택
  { key: 'select', label: '선택', defaultVisible: true, category: 'selection' },
  
  // 기본 정보
  { key: 'brand', label: '브랜드', description: 'Brand Name', defaultVisible: true, category: 'basic' },
  { key: 'productName', label: '상품명', description: 'Product Name', defaultVisible: true, category: 'basic' },
  { key: 'articleNumber', label: '품번', description: 'Article Number', defaultVisible: true, category: 'basic' },
  { key: 'categoryName', label: '카테고리', description: 'Category', defaultVisible: false, category: 'basic' },
  { key: 'fit', label: '성별', description: 'Men/Women', defaultVisible: false, category: 'basic' },
  { key: 'color', label: '색상', description: 'Color', defaultVisible: true, category: 'basic' },
  { key: 'otherOptions', label: '기타 옵션', description: 'Other Options', defaultVisible: false, category: 'basic' },
  
  // ID 정보
  { key: 'globalSkuId', label: 'Global SKU ID', defaultVisible: false, category: 'ids' },
  { key: 'globalSpuId', label: 'Global SPU ID', defaultVisible: false, category: 'ids' },
  { key: 'regionSkuId', label: 'Region SKU ID', defaultVisible: false, category: 'ids' },
  
  // 사이즈 정보
  { key: 'size', label: '사이즈', description: 'Main Size', defaultVisible: true, category: 'sizes' },
  { key: 'sizeUS', label: 'US', description: 'US Size', defaultVisible: false, category: 'sizes' },
  { key: 'sizeEU', label: 'EU', description: 'EU Size', defaultVisible: true, category: 'sizes' },
  { key: 'sizeUK', label: 'UK', description: 'UK Size', defaultVisible: false, category: 'sizes' },
  { key: 'sizeJP', label: 'JP', description: 'JP Size', defaultVisible: false, category: 'sizes' },
  { key: 'sizeKR', label: 'KR', description: 'KR Size', defaultVisible: true, category: 'sizes' },
  
  // 가격 정보
  { key: 'poizonPrice', label: 'POIZON 가격', description: 'CNY', defaultVisible: true, category: 'prices' },
  { key: 'minPrice', label: '최저가', description: 'Min Price', defaultVisible: false, category: 'prices' },
  { key: 'naverPrice', label: '네이버 가격', description: 'KRW', defaultVisible: false, category: 'prices' },
  { key: 'profit', label: '예상 수익', description: 'KRW', defaultVisible: false, category: 'prices' },
  { key: 'roi', label: 'ROI', description: '%', defaultVisible: false, category: 'prices' },
  
  // 상태 정보
  { key: 'status', label: '상태', description: 'Status', defaultVisible: true, category: 'status' },
  { key: 'buyStatus', label: '구매 상태', description: 'Buy Status', defaultVisible: true, category: 'status' },
  { key: 'userHasBid', label: '입찰 여부', description: 'Bid Status', defaultVisible: false, category: 'status' },
  
  // 기타 정보
  { key: 'barCode', label: '바코드', description: 'Barcode', defaultVisible: false, category: 'other' },
  { key: 'barcodeList', label: '바코드 목록', description: 'All Barcodes', defaultVisible: false, category: 'other' },
  { key: 'sortOrder', label: '정렬순서', description: 'Sort Order', defaultVisible: false, category: 'other' },
  { key: 'salesVolume', label: '현재 판매량', description: 'Current Sales', defaultVisible: false, category: 'other' },
  { key: 'sales30Days', label: '30일 판매량', description: '30 Days Sales', defaultVisible: true, category: 'other' },
  { key: 'expectedSales', label: '예상 판매량', description: 'Expected Sales', defaultVisible: true, category: 'other' },
  
  // 액션
  { key: 'actions', label: '입찰', description: 'Bid Actions', defaultVisible: true, category: 'actions' },
];

const CATEGORY_LABELS: Record<string, string> = {
  selection: '선택',
  basic: '기본 정보',
  ids: 'ID 정보',
  sizes: '사이즈',
  prices: '가격',
  status: '상태',
  other: '기타',
  actions: '액션',
};

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export function PriceAnalysisTable({
  data,
  onBid,
  isLoading = false,
  selectedSkus = [],
  onSelectionChange,
}: PriceAnalysisTableProps) {
  // 상태 관리
  const [bidPrices, setBidPrices] = useState<Record<string, string>>({});
  const [biddingSkus, setBiddingSkus] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    new Set(COLUMN_DEFINITIONS.filter(col => col.defaultVisible).map(col => col.key))
  );

  // 입찰가 변경
  const handleBidPriceChange = (skuId: string, value: string) => {
    setBidPrices((prev) => ({ ...prev, [skuId]: value }));
  };

  // 입찰 실행
  const handleBid = async (skuId: string) => {
    const bidPrice = parseFloat(bidPrices[skuId] || '0');
    
    if (bidPrice <= 0) {
      alert('유효한 입찰가를 입력해주세요.');
      return;
    }

    setBiddingSkus((prev) => new Set(prev).add(skuId));
    
    try {
      await onBid(skuId, bidPrice);
    } finally {
      setBiddingSkus((prev) => {
        const newSet = new Set(prev);
        newSet.delete(skuId);
        return newSet;
      });
    }
  };

  // 체크박스 변경
  const handleCheckboxChange = (skuId: string, checked: boolean) => {
    if (!onSelectionChange) return;
    
    const newSelection = checked
      ? [...selectedSkus, skuId]
      : selectedSkus.filter((id) => id !== skuId);
    
    onSelectionChange(newSelection);
  };

  // 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    onSelectionChange(checked ? data.map(row => row.skuId) : []);
  };

  // 컬럼 필터 토글
  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // 카테고리별 전체 선택/해제
  const toggleCategory = (category: string, visible: boolean) => {
    const categoryColumns = COLUMN_DEFINITIONS
      .filter(col => col.category === category)
      .map(col => col.key);
    
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      categoryColumns.forEach(key => {
        if (visible) {
          newSet.add(key);
        } else {
          newSet.delete(key);
        }
      });
      return newSet;
    });
  };

  // 포맷 함수들
  const formatCurrency = (value: number, currency: 'CNY' | 'KRW') => {
    if (currency === 'CNY') {
      return `¥${(value / 100).toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `₩${value.toLocaleString('ko-KR')}`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('ko-KR');
  };

  // 셀 렌더링
  const renderCell = (row: PriceAnalysisRow, columnKey: ColumnKey) => {
    switch (columnKey) {
      case 'select':
        return (
          <Checkbox
            checked={selectedSkus.includes(row.skuId)}
            onCheckedChange={(checked) => handleCheckboxChange(row.skuId, !!checked)}
          />
        );
      
      case 'brand':
      case 'productName':
      case 'articleNumber':
      case 'categoryName':
      case 'fit':
      case 'color':
      case 'otherOptions':
      case 'size':
      case 'sizeUS':
      case 'sizeEU':
      case 'sizeUK':
      case 'sizeJP':
      case 'sizeKR':
      case 'barCode':
      case 'barcodeList':
      case 'minPrice':
        return <span className="text-sm">{row[columnKey] || '-'}</span>;
      
      case 'globalSkuId':
      case 'globalSpuId':
      case 'regionSkuId':
      case 'sortOrder':
        return <span className="text-xs text-muted-foreground font-mono">{row[columnKey] || '-'}</span>;
      
      case 'poizonPrice':
        return <span className="font-medium">{formatCurrency(row.poizonPrice, 'CNY')}</span>;
      
      case 'naverPrice':
        return <span>{row.naverPrice > 0 ? formatCurrency(row.naverPrice, 'KRW') : '-'}</span>;
      
      case 'profit':
        return (
          <div className="flex items-center gap-1">
            {row.profit > 0 ? (
              <>
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-green-600 font-medium">{formatCurrency(row.profit, 'KRW')}</span>
              </>
            ) : row.profit < 0 ? (
              <>
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-red-600 font-medium">{formatCurrency(Math.abs(row.profit), 'KRW')}</span>
              </>
            ) : (
              <span>-</span>
            )}
          </div>
        );
      
      case 'roi':
        return row.roi > 0 ? (
          <Badge variant={row.roi >= 20 ? 'default' : 'secondary'}>
            {row.roi.toFixed(1)}%
          </Badge>
        ) : <span>-</span>;
      
      case 'status':
        return row.status ? (
          <Badge variant={row.status === '활성' ? 'default' : 'secondary'}>
            {row.status}
          </Badge>
        ) : <span>-</span>;
      
      case 'buyStatus':
        return row.buyStatus ? (
          <Badge variant={row.buyStatus === '구매가능' ? 'default' : 'secondary'}>
            {row.buyStatus}
          </Badge>
        ) : <span>-</span>;
      
      case 'userHasBid':
        return row.userHasBid ? (
          <Badge variant={row.userHasBid === '입찰함' ? 'default' : 'outline'}>
            {row.userHasBid}
          </Badge>
        ) : <span>-</span>;
      
      case 'salesVolume':
      case 'sales30Days':
      case 'expectedSales':
        const value = row[columnKey];
        return value && value > 0 ? (
          <span className="font-medium">{formatNumber(value)}</span>
        ) : (
          <span className="text-muted-foreground text-xs">미제공</span>
        );
      
      case 'actions':
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="입찰가"
              className="w-24 h-8"
              value={bidPrices[row.skuId] || ''}
              onChange={(e) => handleBidPriceChange(row.skuId, e.target.value)}
              disabled={biddingSkus.has(row.skuId)}
            />
            <Button
              size="sm"
              onClick={() => handleBid(row.skuId)}
              disabled={biddingSkus.has(row.skuId)}
            >
              {biddingSkus.has(row.skuId) ? '입찰 중...' : '입찰'}
            </Button>
          </div>
        );
      
      default:
        return <span>-</span>;
    }
  };

  // 빈 상태
  if (!isLoading && data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          상품을 검색하여 가격 분석을 시작하세요.
        </p>
      </div>
    );
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  // 보이는 컬럼 필터링
  const visibleColumnDefs = COLUMN_DEFINITIONS.filter(col => visibleColumns.has(col.key));

  return (
    <div className="space-y-4">
      {/* 컬럼 필터 버튼 */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          총 <strong>{data.length}</strong>개 상품
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Columns3 className="h-4 w-4 mr-2" />
              컬럼 선택 ({visibleColumns.size}/{COLUMN_DEFINITIONS.length})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>표시할 컬럼 선택</DialogTitle>
              <DialogDescription>
                보고 싶은 정보만 선택하여 테이블을 커스터마이징하세요.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {Object.entries(
                COLUMN_DEFINITIONS.reduce((acc, col) => {
                  if (!acc[col.category]) acc[col.category] = [];
                  acc[col.category].push(col);
                  return acc;
                }, {} as Record<string, ColumnDefinition[]>)
              ).map(([category, columns]) => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{CATEGORY_LABELS[category]}</h4>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCategory(category, true)}
                      >
                        전체 선택
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCategory(category, false)}
                      >
                        전체 해제
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {columns.map((col) => (
                      <div key={col.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`col-${col.key}`}
                          checked={visibleColumns.has(col.key)}
                          onCheckedChange={() => toggleColumn(col.key)}
                        />
                        <Label
                          htmlFor={`col-${col.key}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {col.label}
                          {col.description && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({col.description})
                            </span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 테이블 */}
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumnDefs.map((col) => (
                <TableHead key={col.key}>
                  {col.key === 'select' ? (
                    <Checkbox
                      checked={selectedSkus.length === data.length && data.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  ) : (
                    col.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.skuId}>
                {visibleColumnDefs.map((col) => (
                  <TableCell key={col.key}>
                    {renderCell(row, col.key)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
