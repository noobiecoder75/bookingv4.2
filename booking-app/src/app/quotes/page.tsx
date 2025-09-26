import { QuotesDashboard } from '@/components/quotes/QuotesDashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';

export default function QuotesPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Quotes Dashboard
            </h1>
            <p className="text-gray-600">
              View and manage all travel quotes with powerful filtering and insights
            </p>
          </div>
          <QuotesDashboard />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}