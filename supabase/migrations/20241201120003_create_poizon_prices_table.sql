-- ============================================================================
-- Migration: Create poizon_prices table
-- Description: POIZON 시장가 히스토리를 저장하는 테이블
-- Created: 2024-12-01
-- ============================================================================

-- poizon_prices 테이블 생성
CREATE TABLE IF NOT EXISTS poizon_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_id UUID NOT NULL REFERENCES product_skus(id) ON DELETE CASCADE,
  lowest_ask NUMERIC(10, 2) NOT NULL, -- 시장 최저가 (CNY)
  sales_volume INTEGER NOT NULL DEFAULT 0, -- 누적 판매량
  fetched_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_poizon_prices_sku_id ON poizon_prices(sku_id);
CREATE INDEX IF NOT EXISTS idx_poizon_prices_fetched_at ON poizon_prices(fetched_at DESC);

-- 복합 인덱스 (최신 가격 조회용)
CREATE INDEX IF NOT EXISTS idx_poizon_prices_sku_fetched ON poizon_prices(sku_id, fetched_at DESC);

-- 코멘트 추가
COMMENT ON TABLE poizon_prices IS 'POIZON 시장가 히스토리 (스크래핑 또는 API 데이터)';
COMMENT ON COLUMN poizon_prices.sku_id IS 'SKU ID (FK to product_skus)';
COMMENT ON COLUMN poizon_prices.lowest_ask IS '시장 최저가 (CNY, 위안 단위)';
COMMENT ON COLUMN poizon_prices.sales_volume IS '누적 판매량';
COMMENT ON COLUMN poizon_prices.fetched_at IS '데이터 수집 시각';

-- RLS 비활성화 (개발 중)
ALTER TABLE poizon_prices DISABLE ROW LEVEL SECURITY;

