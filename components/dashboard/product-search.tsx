/**
 * @file components/dashboard/product-search.tsx
 * @description 상품 검색 바 컴포넌트
 * 
 * 품번(Style Code) 또는 브랜드로 상품을 검색합니다.
 * - 품번: 여러 개 입력 가능 (콤마로 구분)
 * - 브랜드: 드롭다운에서 선택
 */

'use client';

import { useState } from 'react';
import { Search, Loader2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export type SearchMode = 'stylecode' | 'brand' | 'demo';

interface ProductSearchProps {
  onSearch: (query: string, mode: SearchMode) => Promise<void>;
  isLoading?: boolean;
}

// POIZON 주요 브랜드 목록
const BRANDS = [
  { value: 'nike', label: 'Nike (나이키)' },
  { value: 'adidas', label: 'Adidas (아디다스)' },
  { value: 'jordan', label: 'Air Jordan (에어조던)' },
  { value: 'new balance', label: 'New Balance (뉴발란스)' },
  { value: 'converse', label: 'Converse (컨버스)' },
  { value: 'vans', label: 'Vans (반스)' },
  { value: 'puma', label: 'Puma (퓨마)' },
  { value: 'asics', label: 'Asics (아식스)' },
  { value: 'reebok', label: 'Reebok (리복)' },
  { value: 'balenciaga', label: 'Balenciaga (발렌시아가)' },
] as const;

export function ProductSearch({ onSearch, isLoading = false }: ProductSearchProps) {
  const [mode, setMode] = useState<SearchMode>('stylecode');
  const [styleCode, setStyleCode] = useState('');
  const [brand, setBrand] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'stylecode') {
      if (!styleCode.trim()) {
        return;
      }
      await onSearch(styleCode.trim(), 'stylecode');
    } else if (mode === 'brand') {
      if (!brand) {
        return;
      }
      await onSearch(brand, 'brand');
    } else if (mode === 'demo') {
      await onSearch('demo', 'demo');
    }
  };
  
  const handleDemoClick = () => {
    setMode('demo');
    onSearch('demo', 'demo');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {/* 검색 모드 선택 */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={mode === 'stylecode' ? 'default' : 'outline'}
          onClick={() => setMode('stylecode')}
          className="gap-2"
        >
          <Search className="h-4 w-4" />
          품번 검색
        </Button>
        <Button
          type="button"
          variant={mode === 'brand' ? 'default' : 'outline'}
          onClick={() => setMode('brand')}
          className="gap-2"
        >
          <Tag className="h-4 w-4" />
          브랜드 검색
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={handleDemoClick}
          disabled={isLoading}
          className="gap-2"
        >
          🎯 더미 데이터 테스트
        </Button>
      </div>

      {/* 품번 검색 */}
      {mode === 'stylecode' && (
        <div className="space-y-2">
          <Label htmlFor="stylecode" className="text-sm">
            품번 입력 (여러 개 검색 시 콤마로 구분)
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="stylecode"
                type="text"
                placeholder="예: DD1503-101, CW2288-111, DZ5485-612"
                value={styleCode}
                onChange={(e) => setStyleCode(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <Button type="submit" disabled={isLoading || !styleCode.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  검색 중...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  검색
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            💡 여러 개의 품번을 입력하면 한 번에 여러 상품을 분석할 수 있습니다.
          </p>
        </div>
      )}

      {/* 브랜드 검색 */}
      {mode === 'brand' && (
        <div className="space-y-2">
          <Label htmlFor="brand" className="text-sm">
            브랜드 선택
          </Label>
          <div className="flex gap-2">
            <Select value={brand} onValueChange={setBrand} disabled={isLoading}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="브랜드를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {BRANDS.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" disabled={isLoading || !brand}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  검색 중...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  검색
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            💡 선택한 브랜드의 상위 상품들을 한 번에 불러옵니다.
          </p>
        </div>
      )}
    </form>
  );
}

