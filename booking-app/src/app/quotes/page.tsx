import { QuotesDashboard } from '@/components/quotes/QuotesDashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function QuotesPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Quotes Dashboard
            </h1>
            <p className="text-xl text-gray-600">
              View and manage all travel quotes with powerful filtering and insights
            </p>
          </div>
          <QuotesDashboard />
        </div>
      </div>
    </ProtectedRoute>
  );
}