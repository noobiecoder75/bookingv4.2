'use client';

import { useState, useEffect } from 'react';
import { Contact, TravelQuote } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getContactDisplayName } from '@/lib/utils';
import { useSettingsStore } from '@/store/settings-store';
import { Percent, ChevronDown, ChevronUp, Settings, Info } from 'lucide-react';

interface QuoteDetailsProps {
  contact: Contact;
  quote?: Partial<TravelQuote>;
  onComplete: (quoteData: Partial<TravelQuote>) => void;
}

export function QuoteDetails({ contact, quote, onComplete }: QuoteDetailsProps) {
  const { settings, isValidCommissionRate } = useSettingsStore();
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    commissionRate: settings.defaultCommissionRate,
  });
  const [useCustomCommission, setUseCustomCommission] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate minimum end date (start date + 1 day)
  const getMinEndDate = () => {
    if (!formData.startDate) return today;
    const startDate = new Date(formData.startDate);
    const nextDay = new Date(startDate);
    nextDay.setDate(startDate.getDate() + 1);
    return nextDay.toISOString().split('T')[0];
  };

  // Initialize form with existing quote data if editing
  useEffect(() => {
    if (quote) {
      const hasCustomCommission = quote.commissionRate !== undefined && quote.commissionRate !== settings.defaultCommissionRate;
      setFormData({
        title: quote.title || '',
        startDate: quote.travelDates?.start
          ? new Date(quote.travelDates.start).toISOString().split('T')[0]
          : '',
        endDate: quote.travelDates?.end
          ? new Date(quote.travelDates.end).toISOString().split('T')[0]
          : '',
        commissionRate: quote.commissionRate ?? settings.defaultCommissionRate,
      });
      setUseCustomCommission(hasCustomCommission);
      setShowAdvancedSettings(hasCustomCommission);
    }
  }, [quote, settings.defaultCommissionRate]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Quote title is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (useCustomCommission && !isValidCommissionRate(formData.commissionRate)) {
      newErrors.commissionRate = `Commission rate must be between ${settings.minCommissionRate}% and ${settings.maxCommissionRate}%`;
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onComplete({
      title: formData.title,
      travelDates: {
        start: new Date(formData.startDate),
        end: new Date(formData.endDate),
      },
      commissionRate: useCustomCommission ? formData.commissionRate : undefined,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const newFormData = { ...prev };

      // Handle numeric fields
      if (field === 'commissionRate') {
        newFormData[field] = parseFloat(value) || 0;
      } else {
        newFormData[field] = value;
      }

      // If start date is changed and end date is before the new start date, clear end date
      if (field === 'startDate' && prev.endDate) {
        const newStartDate = new Date(value);
        const currentEndDate = new Date(prev.endDate);
        if (newStartDate >= currentEndDate) {
          newFormData.endDate = '';
          setErrors(prevErrors => ({ ...prevErrors, endDate: '' }));
        }
      }

      return newFormData;
    });

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Quote Details
        </h2>
        <p className="text-gray-600">
          Creating quote for {getContactDisplayName(contact.firstName, contact.lastName)}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Quote Title</Label>
          <Input
            id="title"
            type="text"
            placeholder="e.g., European Vacation 2024"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && (
            <p className="text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Travel Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              min={today}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className={errors.startDate ? 'border-red-500' : ''}
            />
            {errors.startDate && (
              <p className="text-sm text-red-600">{errors.startDate}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="endDate">Travel End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              min={getMinEndDate()}
              disabled={!formData.startDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className={errors.endDate ? 'border-red-500' : ''}
            />
            {errors.endDate && (
              <p className="text-sm text-red-600">{errors.endDate}</p>
            )}
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <button
            type="button"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Advanced Settings</span>
            </div>
            {showAdvancedSettings ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {showAdvancedSettings && (
            <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    id="useCustomCommission"
                    type="checkbox"
                    checked={useCustomCommission}
                    onChange={(e) => {
                      setUseCustomCommission(e.target.checked);
                      if (!e.target.checked) {
                        setFormData(prev => ({ ...prev, commissionRate: settings.defaultCommissionRate }));
                        setErrors(prev => ({ ...prev, commissionRate: '' }));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="useCustomCommission" className="text-sm">
                    Use custom commission rate for this quote
                  </Label>
                  <div className="group relative">
                    <Info className="w-3 h-3 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                      Override the default commission rate for special clients, complex itineraries, or promotional deals. Leave unchecked to use automatic rates based on travel items.
                    </div>
                  </div>
                </div>

                {useCustomCommission && (
                  <div className="space-y-2">
                    <Label htmlFor="commissionRate" className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-blue-600" />
                      Commission Rate (%)
                    </Label>
                    <div className="relative">
                      <Input
                        id="commissionRate"
                        type="number"
                        min={settings.minCommissionRate}
                        max={settings.maxCommissionRate}
                        step="0.1"
                        value={formData.commissionRate}
                        onChange={(e) => handleChange('commissionRate', e.target.value)}
                        className={errors.commissionRate ? 'border-red-500' : ''}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500 text-sm">%</span>
                      </div>
                    </div>
                    {errors.commissionRate && (
                      <p className="text-sm text-red-600">{errors.commissionRate}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Range: {settings.minCommissionRate}% - {settings.maxCommissionRate}%
                    </p>
                  </div>
                )}

                {!useCustomCommission && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Automatic commission rates will be used:</strong>
                    </p>
                    <ul className="text-xs text-blue-700 mt-1 space-y-1">
                      <li>• Flights: {settings.flightCommissionRate}%</li>
                      <li>• Hotels: {settings.hotelCommissionRate}%</li>
                      <li>• Activities: {settings.activityCommissionRate}%</li>
                      <li>• Transfers: {settings.transferCommissionRate}%</li>
                      <li>• Default: {settings.defaultCommissionRate}%</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <Button type="submit" size="lg">
            Continue to Add Travel Items
          </Button>
        </div>
      </form>
    </div>
  );
}