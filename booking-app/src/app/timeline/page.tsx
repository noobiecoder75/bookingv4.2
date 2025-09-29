import { TimelineCalendar } from '@/components/timeline/Calendar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { ModernCard } from '@/components/ui/modern-card';

export default function TimelinePage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">Travel Timeline</h1>
            <p className="text-gray-600 dark:text-gray-400">
              View all travel bookings and itineraries in calendar format
            </p>
          </div>
          <ModernCard variant="elevated" className="p-6">
            <TimelineCalendar height={700} />
          </ModernCard>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}