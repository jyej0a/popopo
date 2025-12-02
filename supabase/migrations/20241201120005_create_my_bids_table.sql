-- ============================================================================
-- Migration: Create my_bids table
-- Description: 사용자의 입찰 내역을 저장하는 테이블
-- Created: 2024-12-01
-- ============================================================================

-- my_bids 테이블 생성
CREATE TABLE IF NOT EXISTS my_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Clerk User ID (TEXT 타입)
  sku_id UUID NOT NULL REFERENCES product_skus(id) ON DELETE CASCADE,
  bid_price NUMERIC(10, 2) NOT NULL, -- 입찰가 (CNY)
  status TEXT NOT NULL DEFAULT 'pending', -- pending, active, sold, cancelled
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- 상태 체크 제약 조건
  CONSTRAINT my_bids_status_check CHECK (status IN ('pending', 'active', 'sold', 'cancelled'))
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_my_bids_user_id ON my_bids(user_id);
CREATE INDEX IF NOT EXISTS idx_my_bids_sku_id ON my_bids(sku_id);
CREATE INDEX IF NOT EXISTS idx_my_bids_status ON my_bids(status);
CREATE INDEX IF NOT EXISTS idx_my_bids_created_at ON my_bids(created_at DESC);

-- 복합 인덱스 (사용자별 입찰 내역 조회용)
CREATE INDEX IF NOT EXISTS idx_my_bids_user_created ON my_bids(user_id, created_at DESC);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_my_bids_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_my_bids_updated_at
  BEFORE UPDATE ON my_bids
  FOR EACH ROW
  EXECUTE FUNCTION update_my_bids_updated_at();

-- 코멘트 추가
COMMENT ON TABLE my_bids IS '사용자의 POIZON 입찰 내역';
COMMENT ON COLUMN my_bids.user_id IS 'Clerk User ID';
COMMENT ON COLUMN my_bids.sku_id IS 'SKU ID (FK to product_skus)';
COMMENT ON COLUMN my_bids.bid_price IS '입찰가 (CNY, 위안 단위)';
COMMENT ON COLUMN my_bids.status IS '입찰 상태: pending(대기), active(활성), sold(판매완료), cancelled(취소)';

-- RLS 비활성화 (개발 중)
ALTER TABLE my_bids DISABLE ROW LEVEL SECURITY;

