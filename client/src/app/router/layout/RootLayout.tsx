import { Outlet } from 'react-router-dom';
import { TopHeader } from '../../../shared/components/layout/TopHeader';
import { Sidebar } from '../../../shared/components/layout/Sidebar';
import * as React from 'react';

export function RootLayout() {
  return (
    <div className="app-shell">
      <TopHeader />
      <div className="app-shell__body">
        <Sidebar />
        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
