'use client';

import { useState, useEffect } from 'react';
import { Contact, TravelQuote } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getContactDisplayName } from '@/lib/utils';

interface QuoteDetailsProps {
  contact: Contact;
  quote?: Partial<TravelQuote>;
  onComplete: (quoteData: Partial<TravelQuote>) => void;
}

export function QuoteDetails({ contact, quote, onComplete }: QuoteDetailsProps) {
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
  });

  // Initialize form with existing quote data if editing
  useEffect(() => {
    if (quote) {
      setFormData({
        title: quote.title || '',
        startDate: quote.travelDates?.start 
          ? new Date(quote.travelDates.start).toISOString().split('T')[0]
          : '',
        endDate: quote.travelDates?.end 
          ? new Date(quote.travelDates.end).toISOString().split('T')[0]
          : '',
      });
    }
  }, [quote]);
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
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
              onChange={(e) => handleChange('endDate', e.target.value)}
              className={errors.endDate ? 'border-red-500' : ''}
            />
            {errors.endDate && (
              <p className="text-sm text-red-600">{errors.endDate}</p>
            )}
          </div>
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