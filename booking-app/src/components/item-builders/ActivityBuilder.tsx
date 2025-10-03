'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Search, X } from 'lucide-react';
import { useRateStore } from '@/store/rate-store';
import { ActivityRate } from '@/types/rate';
import { formatCurrency } from '@/lib/utils';
import { calculateClientPrice, getMarkupPercentage } from '@/lib/pricing/markup-config';

interface ActivityBuilderProps {
  onSubmit: (activityData: {
    type: string;
    name: string;
    startDate: string;
    endDate?: string;
    price: number;
    quantity: number;
    details: {
      location: string;
      category?: string;
      duration?: number;
      supplier?: string;
      commissionPercent?: number;
    };
  }) => void;
  onCancel: () => void;
  tripStartDate?: Date;
  tripEndDate?: Date;
}

type TabType = 'offline' | 'manual' | 'api';

export function ActivityBuilder({ onSubmit, onCancel, tripStartDate, tripEndDate }: ActivityBuilderProps) {
  const { getRatesByType, searchRates, getRatesByDateRange } = useRateStore();
  const [activeTab, setActiveTab] = useState<TabType>('offline');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    category: '',
    duration: '',
    startDate: tripStartDate ? tripStartDate.toISOString().split('T')[0] : '',
    endDate: tripEndDate ? tripEndDate.toISOString().split('T')[0] : '',
    price: '',
    quantity: '1',
    supplier: '',
    commissionPercent: '',
  });

  // Get activity rates filtered by trip dates
  const activityRatesInDateRange = (() => {
    if (!tripStartDate || !tripEndDate) {
      return getRatesByType('activity') as ActivityRate[];
    }

    const startStr = tripStartDate.toISOString().split('T')[0];
    const endStr = tripEndDate.toISOString().split('T')[0];

    return getRatesByDateRange(startStr, endStr)
      .filter(r => r.type === 'activity') as ActivityRate[];
  })();

  // Filter rates based on search (within date range)
  const filteredRates = searchQuery
    ? searchRates(searchQuery).filter(r =>
        r.type === 'activity' &&
        activityRatesInDateRange.some(ar => ar.id === r.id)
      ) as ActivityRate[]
    : activityRatesInDateRange;

  const handleSelectRate = (rate: ActivityRate) => {
    // Use trip dates if available, otherwise use rate dates
    const startDate = tripStartDate
      ? tripStartDate.toISOString()
      : new Date(rate.startDate).toISOString();

    const endDate = tripEndDate
      ? tripEndDate.toISOString()
      : new Date(rate.endDate).toISOString();

    // Calculate client price with markup
    const markupPercentage = getMarkupPercentage();
    const clientPrice = calculateClientPrice(rate.rate, markupPercentage);

    // Directly submit the activity
    onSubmit({
      type: 'activity',
      name: rate.activityName,
      startDate,
      endDate,
      price: clientPrice, // Client pays marked-up price
      quantity: 1,
      details: {
        location: rate.location,
        category: rate.category,
        duration: rate.duration,
        supplier: rate.supplier,
        supplierCost: rate.rate, // Nett cost from supplier
        commissionPercent: rate.commissionPercent,
        supplierSource: rate.source,
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      type: 'activity',
      name: formData.name,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      details: {
        location: formData.location,
        category: formData.category || undefined,
        duration: formData.duration ? parseFloat(formData.duration) : undefined,
        supplier: formData.supplier || undefined,
        commissionPercent: formData.commissionPercent ? parseFloat(formData.commissionPercent) : undefined,
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-orange-600" />
            <h3 className="text-xl font-semibold text-gray-900">Add Activity</h3>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('offline')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'offline'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Offline Rates ({activityRatesInDateRange.length})
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'manual'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Manual Entry
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'api'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            API Search
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tab 1: Offline Rates */}
          {activeTab === 'offline' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by activity name, location, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Results */}
              {filteredRates.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {searchQuery ? 'No activities found' : 'No offline activity rates uploaded'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Try adjusting your search or switch to Manual Entry
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                  {filteredRates.map((rate) => (
                    <button
                      key={rate.id}
                      onClick={() => handleSelectRate(rate)}
                      className="text-left p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{rate.activityName}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {rate.location}
                            </span>
                          </div>
                          {rate.category && (
                            <div className="text-xs text-gray-500 mt-1">
                              Category: {rate.category}
                            </div>
                          )}
                          {rate.duration && (
                            <div className="text-xs text-gray-500">
                              Duration: {rate.duration} hours
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            Supplier: {rate.supplier}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">
                            {rate.currency} {rate.rate.toFixed(2)}
                          </div>
                          <div className="text-xs text-green-600">
                            {rate.commissionPercent}% commission
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Manual Entry */}
          {activeTab === 'manual' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Activity Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., City Walking Tour"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Paris, France"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Sightseeing, Adventure"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (hours)</Label>
                  <Input
                    id="duration"
                    type="number"
                    step="0.5"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 3.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="commission">Commission %</Label>
                  <Input
                    id="commission"
                    type="number"
                    step="0.1"
                    value={formData.commissionPercent}
                    onChange={(e) => setFormData({ ...formData, commissionPercent: e.target.value })}
                    placeholder="10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Tour operator or supplier name"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                  Add Activity
                </Button>
              </div>
            </form>
          )}

          {/* Tab 3: API Search (Placeholder) */}
          {activeTab === 'api' && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">API Search Coming Soon</h4>
              <p className="text-gray-600 max-w-md mx-auto">
                Search external activity APIs like Viator, GetYourGuide, and more to find and book activities in real-time.
              </p>
              <div className="mt-6">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('manual')}
                >
                  Use Manual Entry Instead
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
