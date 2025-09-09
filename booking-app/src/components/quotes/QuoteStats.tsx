'use client';

import { useQuoteStore } from '@/store/quote-store';
import { formatCurrency } from '@/lib/utils';
import { FileText, Send, CheckCircle, XCircle, DollarSign, TrendingUp } from 'lucide-react';

export function QuoteStats() {
  const { getQuotesStats } = useQuoteStore();
  const stats = getQuotesStats();

  const statCards = [
    {
      title: 'Total Quotes',
      value: stats.totalQuotes.toLocaleString(),
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'All quotes created',
    },
    {
      title: 'Draft Quotes',
      value: stats.draftQuotes.toLocaleString(),
      icon: FileText,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      description: 'Work in progress',
    },
    {
      title: 'Sent Quotes',
      value: stats.sentQuotes.toLocaleString(),
      icon: Send,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Awaiting response',
    },
    {
      title: 'Accepted Quotes',
      value: stats.acceptedQuotes.toLocaleString(),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Confirmed bookings',
    },
    {
      title: 'Rejected Quotes',
      value: stats.rejectedQuotes.toLocaleString(),
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Declined proposals',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'From accepted quotes',
    },
    {
      title: 'Average Quote Value',
      value: formatCurrency(stats.averageQuoteValue),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Across all quotes',
    },
  ];

  // Calculate conversion rate
  const conversionRate = stats.totalQuotes > 0 
    ? ((stats.acceptedQuotes / (stats.sentQuotes + stats.acceptedQuotes + stats.rejectedQuotes)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={stat.title}
            className={`bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow ${
              index >= 4 ? 'sm:col-span-2 lg:col-span-1' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm font-medium text-gray-700">{stat.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Insights */}
      {stats.totalQuotes > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Insights</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Conversion Rate */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-900">Conversion Rate</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-blue-800">
                  {conversionRate.toFixed(1)}%
                </span>
                <p className="text-sm text-blue-600 mt-1">
                  {stats.acceptedQuotes} of {stats.sentQuotes + stats.acceptedQuotes + stats.rejectedQuotes} sent quotes
                </p>
              </div>
            </div>

            {/* Pipeline Status */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-100">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-amber-600" />
                <span className="font-semibold text-amber-900">Pipeline</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-amber-800">
                  {stats.draftQuotes + stats.sentQuotes}
                </span>
                <p className="text-sm text-amber-600 mt-1">
                  Active quotes in pipeline
                </p>
              </div>
            </div>

            {/* Success Ratio */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-900">Success Rate</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-green-800">
                  {stats.totalQuotes > 0 ? ((stats.acceptedQuotes / stats.totalQuotes) * 100).toFixed(1) : 0}%
                </span>
                <p className="text-sm text-green-600 mt-1">
                  Overall acceptance rate
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.totalQuotes === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No quotes yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first quote to start tracking your business metrics.
          </p>
        </div>
      )}
    </div>
  );
}