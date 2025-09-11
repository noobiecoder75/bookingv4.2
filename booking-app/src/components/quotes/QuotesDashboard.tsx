'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuoteStore } from '@/store/quote-store';
import { useContactStore } from '@/store/contact-store';
import { TravelQuote } from '@/types';
import { QuoteCard } from './QuoteCard';
import { QuoteFilters, QuoteFilterOptions } from './QuoteFilters';
import { QuoteStats } from './QuoteStats';
import { Button } from '@/components/ui/button';
import { Plus, FileText, BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';
import Link from 'next/link';
import moment from 'moment';

export function QuotesDashboard() {
  const { quotes, searchQuotes, getQuotesByStatus, getQuotesByDateRange } = useQuoteStore();
  const { contacts } = useContactStore();
  const [filters, setFilters] = useState<QuoteFilterOptions>({
    searchQuery: '',
    status: 'all',
    dateRange: 'all',
    sortBy: 'created-desc',
  });
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Filter and sort quotes
  const filteredQuotes = useMemo(() => {
    if (!isHydrated) return [];

    let result = [...quotes];

    // Apply search filter
    if (filters.searchQuery) {
      result = searchQuotes(filters.searchQuery);
    }

    // Apply status filter
    if (filters.status !== 'all') {
      result = result.filter(quote => quote.status === filters.status);
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = moment();
      let startDate: moment.Moment;
      
      switch (filters.dateRange) {
        case 'last-week':
          startDate = now.clone().subtract(1, 'week');
          break;
        case 'last-month':
          startDate = now.clone().subtract(1, 'month');
          break;
        case 'last-3-months':
          startDate = now.clone().subtract(3, 'months');
          break;
        default:
          startDate = moment(0); // Beginning of time
      }
      
      result = result.filter(quote => 
        moment(quote.createdAt).isAfter(startDate)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'created-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'created-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'amount-asc':
          return a.totalCost - b.totalCost;
        case 'amount-desc':
          return b.totalCost - a.totalCost;
        case 'travel-date-asc':
          return new Date(a.travelDates.start).getTime() - new Date(b.travelDates.start).getTime();
        case 'travel-date-desc':
          return new Date(b.travelDates.start).getTime() - new Date(a.travelDates.start).getTime();
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [quotes, filters, searchQuotes, isHydrated]);

  const handleFilterChange = (newFilters: QuoteFilterOptions) => {
    setFilters(newFilters);
  };

  const handleQuoteAction = (action: string, quoteId: string) => {
    // Handle quote actions like delete, duplicate, etc.
    console.log(`${action} quote:`, quoteId);
  };

  if (!isHydrated) {
    return (
      <div className="space-y-8">
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="animate-pulse">
            <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/4 mx-auto mb-4"></div>
            <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate dashboard stats
  const totalValue = quotes.reduce((sum, quote) => sum + quote.totalCost, 0);
  const activeQuotes = quotes.filter(q => q.status !== 'rejected').length;
  const acceptedQuotes = quotes.filter(q => q.status === 'accepted').length;
  const conversionRate = quotes.length > 0 ? (acceptedQuotes / quotes.length) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card rounded-2xl p-6 hover-lift transition-smooth">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Quotes</p>
              <p className="text-3xl font-bold text-gray-900">{quotes.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 hover-lift transition-smooth">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Value</p>
              <p className="text-3xl font-bold text-gray-900">${totalValue.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 hover-lift transition-smooth">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Active Quotes</p>
              <p className="text-3xl font-bold text-gray-900">{activeQuotes}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 hover-lift transition-smooth">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Conversion</p>
              <p className="text-3xl font-bold text-gray-900">{conversionRate.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">All Quotes</h2>
          <p className="text-gray-600">Manage and track your travel quotes with advanced filtering</p>
        </div>
        <Link href="/quote-wizard">
          <Button size="lg" className="shadow-soft hover-lift">
            <Plus className="w-5 h-5 mr-2" />
            Create New Quote
          </Button>
        </Link>
      </div>

      {/* Statistics */}
      <QuoteStats />

      {/* Filters */}
      <div className="glass-card rounded-2xl p-6">
        <QuoteFilters
          onFilterChange={handleFilterChange}
          totalCount={quotes.length}
          filteredCount={filteredQuotes.length}
        />
      </div>

      {/* Quotes Grid */}
      {filteredQuotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredQuotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              onDelete={(id) => handleQuoteAction('delete', id)}
              onDuplicate={(id) => handleQuoteAction('duplicate', id)}
              onStatusChange={(id, status) => handleQuoteAction('status-change', id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="glass-card rounded-2xl p-12 max-w-lg mx-auto">
            {quotes.length === 0 ? (
              // No quotes at all
              <div>
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No quotes yet
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Start creating travel quotes for your clients. Use the quote wizard to build detailed itineraries with flights, hotels, and activities.
                </p>
                <Link href="/quote-wizard">
                  <Button size="lg" className="shadow-soft hover-lift">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Quote
                  </Button>
                </Link>
              </div>
            ) : (
              // No quotes match current filters
              <div>
                <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No quotes match your filters
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search criteria or clearing the active filters to see more quotes.
                </p>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="shadow-soft hover-lift"
                  onClick={() => setFilters({
                    searchQuery: '',
                    status: 'all',
                    dateRange: 'all',
                    sortBy: 'created-desc',
                  })}
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Load More Button (for future pagination) */}
      {filteredQuotes.length > 0 && filteredQuotes.length >= 12 && (
        <div className="text-center">
          <Button variant="outline" disabled>
            Load More Quotes
          </Button>
        </div>
      )}
    </div>
  );
}