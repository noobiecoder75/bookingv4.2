'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { useSidebarStore } from '@/store/sidebar-store';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Plus,
  LogOut,
  Sparkles,
  Menu,
  X,
  TrendingUp,
  Receipt,
  CreditCard,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Settings
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { collapsed, mobileMenuOpen, toggleCollapsed, setMobileMenuOpen } = useSidebarStore();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navItems = [
    {
      href: '/quotes',
      label: 'Dashboard',
      icon: LayoutDashboard,
      active: pathname === '/quotes'
    },
    {
      href: '/contacts',
      label: 'Contacts',
      icon: Users,
      active: pathname === '/contacts'
    },
    {
      href: '/timeline',
      label: 'Timeline',
      icon: Calendar,
      active: pathname === '/timeline'
    },
    {
      href: '/finances',
      label: 'Finances',
      icon: TrendingUp,
      active: pathname?.startsWith('/finances')
    },
    {
      href: '/invoices',
      label: 'Invoices',
      icon: Receipt,
      active: pathname?.startsWith('/invoices')
    },
    {
      href: '/commissions',
      label: 'Commissions',
      icon: DollarSign,
      active: pathname?.startsWith('/commissions')
    },
    {
      href: '/expenses',
      label: 'Expenses',
      icon: CreditCard,
      active: pathname?.startsWith('/expenses')
    },
    {
      href: '/admin/settings',
      label: 'Settings',
      icon: Settings,
      active: pathname?.startsWith('/admin/settings')
    },
  ];

  const createQuoteItem = {
    href: '/quote-wizard',
    label: 'Create Quote',
    icon: Plus,
    active: pathname?.startsWith('/quote-wizard'),
    highlight: true
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md border border-gray-200"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? (
          <X className="w-5 h-5 text-gray-600" />
        ) : (
          <Menu className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-40 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <Link href="/quotes" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold text-gray-900">BookingGPT</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full ml-2">Pro</span>
                </div>
              </Link>
            )}
            {collapsed && (
              <Link href="/quotes" className="flex justify-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </Link>
            )}
            <button
              onClick={toggleCollapsed}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {/* Create Quote Button */}
          <Link
            href={createQuoteItem.href}
            className={`
              flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 font-medium
              ${createQuoteItem.active
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg hover:-translate-y-0.5'
              }
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            <createQuoteItem.icon className={collapsed ? "w-8 h-8" : "w-5 h-5"} />
            {!collapsed && <span>{createQuoteItem.label}</span>}
          </Link>

          <div className="h-4"></div>

          {/* Regular Navigation Items */}
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                ${item.active
                  ? 'bg-gray-100 text-gray-900 font-medium shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={collapsed ? "w-8 h-8" : "w-5 h-5"} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          {!collapsed && (
            <div className="text-sm text-gray-600 mb-3 px-3">
              {user?.email}
            </div>
          )}
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            onClick={handleLogout}
            className={`text-gray-600 hover:text-gray-900 w-full ${collapsed ? 'justify-center' : 'justify-start'}`}
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut className={collapsed ? "w-6 h-6" : "w-4 h-4"} />
            {!collapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white border-r border-gray-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <Link href="/quotes" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold text-gray-900">BookingGPT</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full ml-2">Pro</span>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {/* Create Quote Button */}
              <Link
                href={createQuoteItem.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-2 py-3 rounded-xl transition-all duration-200 font-medium
                  ${createQuoteItem.active
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                  }
                `}
              >
                <createQuoteItem.icon className="w-5 h-5" />
                <span>{createQuoteItem.label}</span>
              </Link>

              <div className="h-4"></div>

              {/* Regular Navigation Items */}
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                    ${item.active
                      ? 'bg-gray-100 text-gray-900 font-medium shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-3 px-3">
                {user?.email}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 w-full justify-start"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}