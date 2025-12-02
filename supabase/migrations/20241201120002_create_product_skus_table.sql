-- ============================================================================
-- Migration: Create product_skus table
-- Description: 상품의 사이즈별 SKU 정보를 저장하는 테이블
-- Created: 2024-12-01
-- ============================================================================

-- product_skus 테이블 생성
CREATE TABLE IF NOT EXISTS product_skus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE, -- POIZON SKU 고유 ID
  size TEXT NOT NULL, -- 사이즈 (예: 260, 265, 270)
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_product_skus_product_id ON product_skus(product_id);
CREATE INDEX IF NOT EXISTS idx_product_skus_sku ON product_skus(sku);
CREATE INDEX IF NOT EXISTS idx_product_skus_size ON product_skus(size);

-- 복합 인덱스 (product_id + size 조합으로 자주 조회)
CREATE INDEX IF NOT EXISTS idx_product_skus_product_size ON product_skus(product_id, size);

-- 코멘트 추가
COMMENT ON TABLE product_skus IS '상품의 사이즈별 SKU 정보';
COMMENT ON COLUMN product_skus.product_id IS '상품 ID (FK to products)';
COMMENT ON COLUMN product_skus.sku IS 'POIZON SKU 고유 ID';
COMMENT ON COLUMN product_skus.size IS '사이즈 (예: 260, 265, 270)';

-- RLS 비활성화 (개발 중)
ALTER TABLE product_skus DISABLE ROW LEVEL SECURITY;

