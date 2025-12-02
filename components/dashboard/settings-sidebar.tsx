/**
 * @file components/dashboard/settings-sidebar.tsx
 * @description 설정 사이드바 컴포넌트
 * 
 * 환율, 수수료, 배송비 등의 설정을 관리합니다.
 */

'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Check, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CalculatorSettings } from '@/lib/calculator';

interface SettingsSidebarProps {
  settings: CalculatorSettings;
  onSettingsChange: (settings: CalculatorSettings) => void;
  apiStatus?: {
    poizon: boolean;
    naver: boolean;
    exchangeRate: boolean;
  };
}

export function SettingsSidebar({
  settings,
  onSettingsChange,
  apiStatus = { poizon: true, naver: true, exchangeRate: true },
}: SettingsSidebarProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (key: keyof CalculatorSettings, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newSettings = { ...localSettings, [key]: numValue };
    setLocalSettings(newSettings);
    setHasChanges(true);
  };

  const handleApply = () => {
    onSettingsChange(localSettings);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* API 연결 상태 */}
      <Card className="p-4">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Settings className="h-4 w-4" />
          API 연결 상태
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">POIZON:</span>
            <Badge variant={apiStatus.poizon ? 'default' : 'destructive'}>
              {apiStatus.poizon ? '🟢 연결됨' : '🔴 실패'}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Naver:</span>
            <Badge variant={apiStatus.naver ? 'default' : 'destructive'}>
              {apiStatus.naver ? '🟢 연결됨' : '🔴 실패'}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">환율:</span>
            <Badge variant={apiStatus.exchangeRate ? 'default' : 'destructive'}>
              {apiStatus.exchangeRate ? '🟢 정상' : '🔴 실패'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* 설정 */}
      <Card className="p-4">
        <h3 className="mb-4 text-sm font-semibold">계산 설정</h3>
        <div className="space-y-4">
          {/* 환율 */}
          <div className="space-y-2">
            <Label htmlFor="exchangeRate" className="text-xs">
              환율 (CNY → KRW)
            </Label>
            <div className="flex gap-2">
              <Input
                id="exchangeRate"
                type="number"
                step="0.01"
                value={localSettings.exchangeRate}
                onChange={(e) => handleChange('exchangeRate', e.target.value)}
                className="text-sm"
              />
              <Button
                size="icon"
                variant="outline"
                className="flex-shrink-0"
                title="실시간 환율 새로고침"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              현재: ₩{localSettings.exchangeRate.toFixed(2)} / ¥1
            </p>
          </div>

          {/* 플랫폼 수수료 */}
          <div className="space-y-2">
            <Label htmlFor="platformFeeRate" className="text-xs">
              플랫폼 수수료 (%)
            </Label>
            <Input
              id="platformFeeRate"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={(localSettings.platformFeeRate * 100).toFixed(1)}
              onChange={(e) =>
                handleChange('platformFeeRate', (parseFloat(e.target.value) / 100).toString())
              }
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              POIZON 판매 수수료율
            </p>
          </div>

          {/* 배송비 */}
          <div className="space-y-2">
            <Label htmlFor="shippingCost" className="text-xs">
              배송비 (KRW)
            </Label>
            <Input
              id="shippingCost"
              type="number"
              step="100"
              min="0"
              value={localSettings.shippingCost}
              onChange={(e) => handleChange('shippingCost', e.target.value)}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              국내 배송비 (기본값: ₩3,000)
            </p>
          </div>

          {/* 적용 버튼 */}
          {hasChanges && (
            <div className="flex gap-2">
              <Button onClick={handleApply} className="flex-1 gap-2" size="sm">
                <Check className="h-4 w-4" />
                적용
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1"
                size="sm"
              >
                취소
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* 계산 미리보기 */}
      <Card className="p-4">
        <h3 className="mb-4 text-sm font-semibold">계산 예시</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">POIZON ¥850</span>
            <span className="font-mono">₩{Math.round(850 * localSettings.exchangeRate * (1 - localSettings.platformFeeRate)).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">네이버 ₩145,000</span>
            <span className="font-mono">₩{(145000 + localSettings.shippingCost).toLocaleString()}</span>
          </div>
          <div className="border-t pt-2" />
          <div className="flex justify-between font-medium">
            <span>예상 수익:</span>
            <span className={`font-mono ${
              Math.round(850 * localSettings.exchangeRate * (1 - localSettings.platformFeeRate)) - (145000 + localSettings.shippingCost) > 0
                ? 'text-green-600'
                : 'text-red-600'
            }`}>
              ₩{Math.abs(Math.round(850 * localSettings.exchangeRate * (1 - localSettings.platformFeeRate)) - (145000 + localSettings.shippingCost)).toLocaleString()}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

