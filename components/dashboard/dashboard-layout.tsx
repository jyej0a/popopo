/**
 * @file components/dashboard/dashboard-layout.tsx
 * @description 대시보드 전용 레이아웃 컴포넌트
 * 
 * 메인 컨텐츠와 사이드바를 포함한 레이아웃을 제공합니다.
 */

'use client';

import { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
}

export function DashboardLayout({ children, sidebar }: DashboardLayoutProps) {
  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* 메인 컨텐츠 */}
        <main className="space-y-6">{children}</main>

        {/* 사이드바 */}
        {sidebar && (
          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            {sidebar}
          </aside>
        )}
      </div>
    </div>
  );
}

