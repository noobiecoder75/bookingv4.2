'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  Filter,
  X,
  Plane,
  Hotel,
  MapPin,
  Car,
  Calendar,
  DollarSign,
  ChevronDown,
} from 'lucide-react';
import { TravelItem } from '@/types';

interface FilterState {
  search: string;
  types: Set<string>;
  priceRange: { min: number; max: number };
  dateRange: { start: Date | null; end: Date | null };
}

interface FilterControlsProps {
  items: TravelItem[];
  onFilterChange: (filteredItems: TravelItem[]) => void;
  className?: string;
}

export function FilterControls({ items, onFilterChange, className }: FilterControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    types: new Set(['flight', 'hotel', 'activity', 'transfer']),
    priceRange: { min: 0, max: 10000 },
    dateRange: { start: null, end: null },
  });

  // Get item type counts
  const getTypeCounts = () => {
    const counts = {
      flight: items.filter(item => item.type === 'flight').length,
      hotel: items.filter(item => item.type === 'hotel').length,
      activity: items.filter(item => item.type === 'activity').length,
      transfer: items.filter(item => item.type === 'transfer').length,
    };
    return counts;
  };

  const typeCounts = getTypeCounts();

  // Apply all filters
  const applyFilters = (newFilters: FilterState) => {
    let filtered = [...items];

    // Search filter
    if (newFilters.search.trim()) {
      const searchTerm = newFilters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm) ||
        (item.details && JSON.stringify(item.details).toLowerCase().includes(searchTerm))
      );
    }

    // Type filter
    filtered = filtered.filter(item => newFilters.types.has(item.type));

    // Price filter
    filtered = filtered.filter(item => {
      const itemPrice = item.price * item.quantity;
      return itemPrice >= newFilters.priceRange.min && itemPrice <= newFilters.priceRange.max;
    });

    // Date filter
    if (newFilters.dateRange.start && newFilters.dateRange.end) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.startDate);
        return itemDate >= newFilters.dateRange.start! && itemDate <= newFilters.dateRange.end!;
      });
    }

    onFilterChange(filtered);
  };

  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, search: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const toggleType = (type: string) => {
    const newTypes = new Set(filters.types);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    const newFilters = { ...filters, types: newTypes };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const clearAllFilters = () => {
    const defaultFilters: FilterState = {
      search: '',
      types: new Set(['flight', 'hotel', 'activity', 'transfer']),
      priceRange: { min: 0, max: 10000 },
      dateRange: { start: null, end: null },
    };
    setFilters(defaultFilters);
    applyFilters(defaultFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search.trim()) count++;
    if (filters.types.size < 4) count++;
    if (filters.priceRange.min > 0 || filters.priceRange.max < 10000) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    return count;
  };

  const activeFilters = getActiveFilterCount();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="w-4 h-4" />;
      case 'hotel': return <Hotel className="w-4 h-4" />;
      case 'activity': return <MapPin className="w-4 h-4" />;
      case 'transfer': return <Car className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <Input
              placeholder="Search items by name or details..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-4"
            />
            {filters.search && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFilters > 0 && (
              <Badge className="bg-blue-500 text-white text-xs">
                {activeFilters}
              </Badge>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="p-4 space-y-6 border-b border-gray-200">
          {/* Item Type Filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Item Types</h4>
            <div className="flex flex-wrap gap-2">
              {([
                { type: 'flight', label: 'Flights' },
                { type: 'hotel', label: 'Hotels' },
                { type: 'activity', label: 'Activities' },
                { type: 'transfer', label: 'Transfers' },
              ] as const).map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                    filters.types.has(type)
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {getTypeIcon(type)}
                  <span className="text-sm font-medium">{label}</span>
                  <Badge className="bg-gray-500 text-white text-xs">
                    {typeCounts[type]}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Date Filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Filters</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const today = new Date();
                  const tomorrow = new Date(today);
                  tomorrow.setDate(today.getDate() + 1);
                  const newFilters = {
                    ...filters,
                    dateRange: { start: today, end: tomorrow }
                  };
                  setFilters(newFilters);
                  applyFilters(newFilters);
                }}
              >
                <Calendar className="w-4 h-4 mr-1" />
                Today
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    priceRange: { min: 0, max: 100 }
                  };
                  setFilters(newFilters);
                  applyFilters(newFilters);
                }}
              >
                <DollarSign className="w-4 h-4 mr-1" />
                Under $100
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    priceRange: { min: 100, max: 500 }
                  };
                  setFilters(newFilters);
                  applyFilters(newFilters);
                }}
              >
                <DollarSign className="w-4 h-4 mr-1" />
                $100-500
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    priceRange: { min: 500, max: 10000 }
                  };
                  setFilters(newFilters);
                  applyFilters(newFilters);
                }}
              >
                <DollarSign className="w-4 h-4 mr-1" />
                $500+
              </Button>
            </div>
          </div>

          {/* Clear Filters */}
          {activeFilters > 0 && (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={clearAllFilters}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4 mr-1" />
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Summary */}
      {activeFilters > 0 && (
        <div className="px-4 py-2 bg-blue-50 text-sm text-blue-700">
          Showing filtered results • {activeFilters} filter{activeFilters > 1 ? 's' : ''} active
        </div>
      )}
    </div>
  );
}