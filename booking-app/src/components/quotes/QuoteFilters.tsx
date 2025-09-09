'use client';

import { useState } from 'react';
import { TravelQuote } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';

interface QuoteFiltersProps {
  onFilterChange: (filters: QuoteFilterOptions) => void;
  totalCount: number;
  filteredCount: number;
}

export interface QuoteFilterOptions {
  searchQuery: string;
  status: TravelQuote['status'] | 'all';
  dateRange: 'all' | 'last-week' | 'last-month' | 'last-3-months';
  sortBy: 'created-desc' | 'created-asc' | 'amount-desc' | 'amount-asc' | 'travel-date-desc' | 'travel-date-asc';
}

export function QuoteFilters({ onFilterChange, totalCount, filteredCount }: QuoteFiltersProps) {
  const [filters, setFilters] = useState<QuoteFilterOptions>({
    searchQuery: '',
    status: 'all',
    dateRange: 'all',
    sortBy: 'created-desc',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilters = (newFilters: Partial<QuoteFilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const resetFilters = () => {
    const defaultFilters: QuoteFilterOptions = {
      searchQuery: '',
      status: 'all',
      dateRange: 'all',
      sortBy: 'created-desc',
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const hasActiveFilters = 
    filters.searchQuery || 
    filters.status !== 'all' || 
    filters.dateRange !== 'all';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Search and Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search quotes by title or items..."
            value={filters.searchQuery}
            onChange={(e) => updateFilters({ searchQuery: e.target.value })}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select 
          value={filters.status} 
          onValueChange={(value) => updateFilters({ status: value as QuoteFilterOptions['status'] })}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select 
          value={filters.sortBy} 
          onValueChange={(value) => updateFilters({ sortBy: value as QuoteFilterOptions['sortBy'] })}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created-desc">Newest First</SelectItem>
            <SelectItem value="created-asc">Oldest First</SelectItem>
            <SelectItem value="amount-desc">Highest Amount</SelectItem>
            <SelectItem value="amount-asc">Lowest Amount</SelectItem>
            <SelectItem value="travel-date-desc">Latest Travel</SelectItem>
            <SelectItem value="travel-date-asc">Earliest Travel</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filter Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="whitespace-nowrap"
        >
          <Filter className="w-4 h-4 mr-2" />
          Advanced
        </Button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          {/* Date Range Filter */}
          <div>
            <Label htmlFor="dateRange" className="text-sm font-medium text-gray-700">
              Created Date Range
            </Label>
            <Select 
              value={filters.dateRange} 
              onValueChange={(value) => updateFilters({ dateRange: value as QuoteFilterOptions['dateRange'] })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="last-week">Last Week</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Placeholder for future filters */}
          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 border-t border-gray-100 pt-3">
        <span>
          Showing {filteredCount.toLocaleString()} of {totalCount.toLocaleString()} quotes
        </span>
        
        {hasActiveFilters && (
          <div className="flex items-center space-x-2">
            <span className="text-blue-600 font-medium">Filters active</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-6 px-2 text-xs"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}