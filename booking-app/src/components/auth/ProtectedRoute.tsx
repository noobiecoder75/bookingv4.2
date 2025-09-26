'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { AppNav } from '@/components/navigation/AppNav';

interface ProtectedRouteProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

export function ProtectedRoute({ children, showNavigation = false }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    const isAuth = checkAuth();
    if (!isAuth) {
      // Store the attempted URL to redirect back after login
      const returnUrl = pathname;
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [checkAuth, pathname, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showNavigation && <AppNav />}
      <div className={showNavigation ? "pt-16" : ""}>
        {children}
      </div>
    </>
  );
}