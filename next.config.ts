import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" }, // Clerk 프로필 이미지
      { hostname: "placehold.co" }, // Placeholder 이미지 (테스트용)
      { hostname: "via.placeholder.com" }, // 대체 Placeholder
      { hostname: "cdn.poizon.com" }, // POIZON 상품 이미지
      { hostname: "du.poizon.com" }, // POIZON 대체 이미지 도메인
      { hostname: "dewu.com" }, // POIZON/득물 주요 도메인
      { hostname: "poizonapp.com" }, // POIZON 앱 이미지
      { hostname: "shopping.phinf.naver.net" }, // Naver 쇼핑 이미지
    ],
  },
};

export default nextConfig;
