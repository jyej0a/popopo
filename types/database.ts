/**
 * @file types/database.ts
 * @description Supabase 데이터베이스 타입 정의
 * 
 * 이 파일은 수동으로 작성되었으며, 향후 `supabase gen types` 명령어로 자동 생성할 수 있습니다.
 */

// ============================================================================
// 테이블 타입
// ============================================================================

export interface Product {
  id: string;
  spu: string; // POIZON 상품 ID
  style_code: string; // 품번 (예: DD1503-101)
  brand: string;
  name_en: string;
  name_cn: string;
  thumbnail_url: string;
  created_at: string;
}

export interface ProductSku {
  id: string;
  product_id: string; // FK to products
  sku: string; // POIZON SKU ID
  size: string; // 사이즈 (예: 260, 265)
  created_at: string;
}

export interface PoizonPrice {
  id: string;
  sku_id: string; // FK to product_skus
  lowest_ask: number; // 시장 최저가 (CNY)
  sales_volume: number; // 판매량
  fetched_at: string;
}

export interface NaverPrice {
  id: string;
  product_id: string; // FK to products
  size: string | null; // 사이즈 (선택적)
  lowest_price: number; // 최저가 (KRW)
  source_url: string; // 상품 링크
  mall_name: string; // 쇼핑몰 이름
  fetched_at: string;
}

export interface MyBid {
  id: string;
  user_id: string; // FK to users (Clerk user)
  sku_id: string; // FK to product_skus
  bid_price: number; // 입찰가 (CNY)
  status: 'pending' | 'active' | 'sold' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: string;
  user_id: string; // FK to users (Clerk user)
  exchange_rate: number; // 환율 (CNY → KRW)
  platform_fee_rate: number; // 플랫폼 수수료율 (0.05 = 5%)
  shipping_cost: number; // 배송비 (KRW)
  updated_at: string;
}

// ============================================================================
// Insert 타입 (created_at, id 등 자동 생성 필드 제외)
// ============================================================================

export type ProductInsert = Omit<Product, 'id' | 'created_at'>;
export type ProductSkuInsert = Omit<ProductSku, 'id' | 'created_at'>;
export type PoizonPriceInsert = Omit<PoizonPrice, 'id' | 'fetched_at'>;
export type NaverPriceInsert = Omit<NaverPrice, 'id' | 'fetched_at'>;
export type MyBidInsert = Omit<MyBid, 'id' | 'created_at' | 'updated_at'>;
export type SettingsInsert = Omit<Settings, 'id' | 'updated_at'>;

// ============================================================================
// Update 타입 (모든 필드 선택적)
// ============================================================================

export type ProductUpdate = Partial<Omit<Product, 'id' | 'created_at'>>;
export type ProductSkuUpdate = Partial<Omit<ProductSku, 'id' | 'created_at'>>;
export type MyBidUpdate = Partial<Omit<MyBid, 'id' | 'user_id' | 'sku_id' | 'created_at'>>;
export type SettingsUpdate = Partial<Omit<Settings, 'id' | 'user_id'>>;

// ============================================================================
// 조인 쿼리용 확장 타입
// ============================================================================

export interface ProductWithSkus extends Product {
  skus: ProductSku[];
}

export interface SkuWithPrices extends ProductSku {
  product: Product;
  latest_poizon_price: PoizonPrice | null;
  latest_naver_price: NaverPrice | null;
  my_bid: MyBid | null;
}

export interface PriceAnalysisRow {
  sku: ProductSku;
  product: Product;
  poizon_price: PoizonPrice | null;
  naver_price: NaverPrice | null;
  my_bid: MyBid | null;
  // 계산된 필드
  expected_revenue?: number; // 예상 매출액 (KRW)
  expected_cost?: number; // 예상 매입가 (KRW)
  profit?: number; // 예상 수익 (KRW)
  roi?: number; // ROI (%)
}

