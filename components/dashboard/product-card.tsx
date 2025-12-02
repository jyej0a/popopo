/**
 * @file components/dashboard/product-card.tsx
 * @description 상품 정보 카드 컴포넌트
 * 
 * 선택된 상품의 기본 정보(썸네일, 이름, 품번)를 표시합니다.
 */

'use client';

import Image from 'next/image';
import { Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: {
    spuId: string;
    styleCode: string;
    brand: string;
    title: string;
    titleCn?: string;
    logoUrl: string;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4">
        {/* 썸네일 이미지 */}
        <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-slate-50">
          {product.logoUrl ? (
            <Image
              src={product.logoUrl}
              alt={product.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* 상품 정보 */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1">
            <Badge variant="secondary" className="text-xs">{product.brand}</Badge>
            <Badge variant="outline" className="text-xs">{product.styleCode}</Badge>
          </div>
          
          <div>
            <h3 className="line-clamp-2 text-sm font-semibold leading-tight">
              {product.title}
            </h3>
            {product.titleCn && (
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                {product.titleCn}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

