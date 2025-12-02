-- ============================================================================
-- Migration: Create settings table
-- Description: 사용자별 설정 (환율, 수수료, 배송비 등)을 저장하는 테이블
-- Created: 2024-12-01
-- ============================================================================

-- settings 테이블 생성
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE, -- Clerk User ID (TEXT 타입, 한 사용자당 하나의 설정)
  exchange_rate NUMERIC(10, 4) NOT NULL DEFAULT 190.0000, -- 환율 (CNY → KRW)
  platform_fee_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.0500, -- 플랫폼 수수료율 (0.0500 = 5%)
  shipping_cost NUMERIC(10, 0) NOT NULL DEFAULT 3000, -- 배송비 (KRW)
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at();

-- 코멘트 추가
COMMENT ON TABLE settings IS '사용자별 설정 (환율, 수수료, 배송비)';
COMMENT ON COLUMN settings.user_id IS 'Clerk User ID (UNIQUE)';
COMMENT ON COLUMN settings.exchange_rate IS '환율 (CNY → KRW), 예: 190.5';
COMMENT ON COLUMN settings.platform_fee_rate IS '플랫폼 수수료율 (0.05 = 5%)';
COMMENT ON COLUMN settings.shipping_cost IS '기본 배송비 (KRW, 원 단위)';

-- RLS 비활성화 (개발 중)
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

