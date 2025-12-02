/**
 * @file components/dashboard/bulk-action-bar.tsx
 * @description 일괄 작업 바 컴포넌트
 * 
 * 선택한 항목에 대한 일괄 작업(입찰, 다운로드 등)을 수행합니다.
 */

'use client';

import { Download, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BulkActionBarProps {
  selectedCount: number;
  onBulkBid: () => Promise<void>;
  onExportExcel: () => void;
  isProcessing?: boolean;
}

export function BulkActionBar({
  selectedCount,
  onBulkBid,
  onExportExcel,
  isProcessing = false,
}: BulkActionBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="sticky bottom-4 z-10 mx-auto w-fit rounded-lg border bg-background p-4 shadow-lg">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-base">
            {selectedCount}개 선택됨
          </Badge>
        </div>
        
        <div className="h-6 w-px bg-border" />
        
        <div className="flex gap-2">
          <Button
            onClick={onBulkBid}
            disabled={isProcessing}
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            {isProcessing ? '입찰 중...' : '일괄 입찰'}
          </Button>
          
          <Button
            variant="outline"
            onClick={onExportExcel}
            disabled={isProcessing}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            엑셀 다운로드
          </Button>
        </div>
      </div>
    </div>
  );
}

