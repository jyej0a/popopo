-- ============================================================================
-- Migration: Create products table
-- Description: POIZON 상품 기본 정보를 저장하는 테이블
-- Created: 2024-12-01
-- ============================================================================

-- products 테이블 생성
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spu TEXT NOT NULL UNIQUE, -- POIZON 상품 고유 ID
  style_code TEXT NOT NULL, -- 품번 (예: DD1503-101)
  brand TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_cn TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_products_spu ON products(spu);
CREATE INDEX IF NOT EXISTS idx_products_style_code ON products(style_code);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);

-- 코멘트 추가
COMMENT ON TABLE products IS 'POIZON 상품 기본 정보';
COMMENT ON COLUMN products.spu IS 'POIZON 상품 고유 ID (SPU: Standard Product Unit)';
COMMENT ON COLUMN products.style_code IS '품번 (예: DD1503-101)';
COMMENT ON COLUMN products.brand IS '브랜드명';
COMMENT ON COLUMN products.name_en IS '상품명 (영문)';
COMMENT ON COLUMN products.name_cn IS '상품명 (중문)';
COMMENT ON COLUMN products.thumbnail_url IS '썸네일 이미지 URL';

-- RLS 비활성화 (개발 중)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

