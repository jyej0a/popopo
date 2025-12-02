-- ============================================================================
-- Migration: Create naver_prices table
-- Description: 네이버 최저가 히스토리를 저장하는 테이블
-- Created: 2024-12-01
-- ============================================================================

-- naver_prices 테이블 생성
CREATE TABLE IF NOT EXISTS naver_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT, -- 사이즈 (선택적, NULL 가능)
  lowest_price NUMERIC(10, 0) NOT NULL, -- 최저가 (KRW, 원 단위)
  source_url TEXT NOT NULL, -- 상품 링크
  mall_name TEXT NOT NULL, -- 쇼핑몰 이름
  fetched_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_naver_prices_product_id ON naver_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_naver_prices_fetched_at ON naver_prices(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_naver_prices_size ON naver_prices(size);

-- 복합 인덱스 (상품+사이즈별 최신 가격 조회용)
CREATE INDEX IF NOT EXISTS idx_naver_prices_product_size_fetched 
  ON naver_prices(product_id, size, fetched_at DESC);

-- 코멘트 추가
COMMENT ON TABLE naver_prices IS '네이버 쇼핑 최저가 히스토리';
COMMENT ON COLUMN naver_prices.product_id IS '상품 ID (FK to products)';
COMMENT ON COLUMN naver_prices.size IS '사이즈 (선택적, 검색어에 포함된 경우)';
COMMENT ON COLUMN naver_prices.lowest_price IS '최저가 (KRW, 원 단위)';
COMMENT ON COLUMN naver_prices.source_url IS '상품 링크';
COMMENT ON COLUMN naver_prices.mall_name IS '쇼핑몰 이름';
COMMENT ON COLUMN naver_prices.fetched_at IS '데이터 수집 시각';

-- RLS 비활성화 (개발 중)
ALTER TABLE naver_prices DISABLE ROW LEVEL SECURITY;

