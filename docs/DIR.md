.
├── AGENTS.md                          # AI 어시스턴트 가이드
├── CLAUDE.md                          # Claude 전용 컨텍스트 문서
├── README.md                          # 프로젝트 소개 및 설치 가이드
├── package.json                       # 프로젝트 의존성 (pnpm 사용)
├── tsconfig.json                      # TypeScript 설정
├── next.config.ts                     # Next.js 설정
├── middleware.ts                      # Clerk 인증 미들웨어
├── eslint.config.mjs                  # ESLint 설정
├── postcss.config.mjs                 # PostCSS 설정
├── components.json                    # shadcn/ui 설정
│
├── .cursor/                           # Cursor 설정
│   ├── rules/                         # 코딩 규칙
│   └── mcp.json                       # MCP 서버 설정
│
├── docs/                              # 프로젝트 문서
│   ├── PRD.md                         # 제품 요구사항 문서
│   ├── TODO.md                        # 작업 체크리스트
│   └── DIR.md                         # 디렉토리 구조 (현재 파일)
│
├── app/                               # Next.js App Router
│   ├── layout.tsx                     # Root Layout (ClerkProvider)
│   ├── page.tsx                       # 홈페이지
│   ├── globals.css                    # Tailwind CSS 전역 스타일
│   ├── favicon.ico                    # 파비콘
│   │
│   ├── dashboard/                     # 대시보드 (메인 기능)
│   │   ├── layout.tsx                 # 대시보드 레이아웃
│   │   ├── page.tsx                   # 대시보드 메인 페이지
│   │   ├── settings/                  # 설정 페이지
│   │   │   └── page.tsx
│   │   └── bids/                      # 입찰 내역 페이지
│   │       └── page.tsx
│   │
│   ├── api/                           # API Routes
│   │   ├── sync-user/                 # 사용자 동기화
│   │   │   └── route.ts
│   │   ├── webhooks/                  # 외부 웹훅
│   │   │   └── poizon/
│   │   │       └── route.ts
│   │   └── exchange-rate/             # 환율 캐싱 엔드포인트
│   │       └── route.ts
│   │
│   ├── auth-test/                     # 인증 테스트 페이지
│   │   └── page.tsx
│   └── storage-test/                  # Storage 테스트 페이지
│       └── page.tsx
│
├── components/                        # React 컴포넌트
│   ├── Navbar.tsx                     # 네비게이션 바
│   │
│   ├── providers/                     # Context 프로바이더
│   │   └── sync-user-provider.tsx
│   │
│   ├── dashboard/                     # 대시보드 컴포넌트
│   │   ├── dashboard-layout.tsx       # 대시보드 레이아웃
│   │   ├── sidebar.tsx                # 설정 사이드바
│   │   ├── product-search.tsx         # 상품 검색 바
│   │   ├── product-card.tsx           # 상품 정보 카드
│   │   ├── price-analysis-table.tsx   # 가격 분석 테이블 (핵심)
│   │   ├── bid-button.tsx             # 입찰 버튼
│   │   └── bulk-action-bar.tsx        # 일괄 작업 바
│   │
│   └── ui/                            # shadcn/ui 컴포넌트 (자동 생성)
│       ├── button.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── form.tsx
│       ├── dialog.tsx
│       ├── table.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       ├── toast.tsx
│       ├── select.tsx
│       ├── checkbox.tsx
│       ├── skeleton.tsx
│       └── tabs.tsx
│
├── actions/                           # Server Actions
│   ├── product-actions.ts             # 상품 관련 액션
│   ├── price-actions.ts               # 가격 조회 및 마진 계산
│   ├── bid-actions.ts                 # 입찰 실행
│   └── settings-actions.ts            # 설정 관리
│
├── lib/                               # 유틸리티 및 클라이언트
│   ├── utils.ts                       # 공통 유틸리티 (cn 함수 등)
│   │
│   ├── supabase/                      # Supabase 클라이언트
│   │   ├── clerk-client.ts            # Clerk 인증 클라이언트
│   │   ├── client.ts                  # 공개 데이터 클라이언트
│   │   ├── server.ts                  # Server Component 클라이언트
│   │   └── service-role.ts            # 관리자 권한 클라이언트
│   │
│   ├── poizon-api.ts                  # POIZON API 클라이언트
│   ├── naver-api.ts                   # Naver 검색 API 클라이언트
│   ├── exchange-rate.ts               # 환율 조회 함수
│   ├── scraper.ts                     # Playwright 스크래핑
│   └── calculator.ts                  # 마진 계산 로직
│
├── hooks/                             # 커스텀 React Hook
│   ├── use-sync-user.ts               # 사용자 동기화 훅
│   └── use-price-analysis.ts          # 가격 분석 훅 (추가 예정)
│
├── types/                             # TypeScript 타입 정의
│   ├── poizon.ts                      # POIZON API 타입
│   ├── naver.ts                       # Naver API 타입
│   └── database.ts                    # Supabase 타입 (자동 생성)
│
├── constants/                         # 상수 값
│   └── config.ts                      # 설정 기본값
│
├── supabase/                          # Supabase 설정
│   ├── config.toml                    # Supabase 프로젝트 설정
│   └── migrations/                    # 데이터베이스 마이그레이션
│       ├── setup_schema.sql           # 초기 스키마
│       ├── setup_storage.sql          # Storage 설정
│       ├── 20241201000001_create_products_table.sql
│       ├── 20241201000002_create_product_skus_table.sql
│       ├── 20241201000003_create_poizon_prices_table.sql
│       ├── 20241201000004_create_naver_prices_table.sql
│       ├── 20241201000005_create_my_bids_table.sql
│       └── 20241201000006_create_settings_table.sql
│
└── public/                            # 정적 파일
    ├── icons/                         # PWA 아이콘
    │   ├── icon-192x192.png
    │   ├── icon-256x256.png
    │   ├── icon-384x384.png
    │   └── icon-512x512.png
    ├── logo.png                       # 로고
    └── og-image.png                   # Open Graph 이미지
