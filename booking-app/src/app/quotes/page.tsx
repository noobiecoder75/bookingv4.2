import { QuotesDashboard } from '@/components/quotes/QuotesDashboard';

export default function QuotesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quotes Dashboard</h1>
        <p className="text-gray-600">
          View and manage all travel quotes in your system
        </p>
      </div>
      <QuotesDashboard />
    </div>
  );
}