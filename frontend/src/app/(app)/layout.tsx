'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [desktopSidebarOpen, setDesktopSidebarOpen] = React.useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const closeMobileSidebar = React.useCallback(() => setMobileSidebarOpen(false), []);

  React.useEffect(() => {
    setDesktopSidebarOpen(window.sessionStorage.getItem('clara-sidebar-open') !== 'false');
  }, []);

  const toggleDesktopSidebar = React.useCallback(() => {
    setDesktopSidebarOpen((current) => {
      window.sessionStorage.setItem('clara-sidebar-open', String(!current));
      return !current;
    });
  }, []);

  return <div className="clara-app min-h-screen bg-[#f8f8f7] text-zinc-900">
    <Sidebar
      desktopOpen={desktopSidebarOpen}
      mobileOpen={mobileSidebarOpen}
      onCloseMobile={closeMobileSidebar}
      onToggleDesktop={toggleDesktopSidebar}
    />
    <div className={`min-h-screen transition-[padding] duration-200 ease-out motion-reduce:transition-none ${desktopSidebarOpen ? 'lg:pl-64' : 'lg:pl-[88px]'}`}>
      <Header
        onToggleSidebar={() => setMobileSidebarOpen((current) => !current)}
        mobileSidebarOpen={mobileSidebarOpen}
      />
      <main id="konten-utama" className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  </div>;
}
