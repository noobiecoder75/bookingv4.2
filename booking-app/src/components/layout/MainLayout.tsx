'use client';

import { Sidebar } from '@/components/navigation/Sidebar';
import { useSidebarStore } from '@/store/sidebar-store';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { collapsed } = useSidebarStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <div className="lg:pl-0 pl-16"> {/* Add padding for mobile menu button */}
          {children}
        </div>
      </div>
    </div>
  );
}