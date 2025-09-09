'use client';

import { TravelQuote, Contact } from '@/types';
import { useQuoteStore } from '@/store/quote-store';
import { Button } from '@/components/ui/button';
import { formatCurrency, getContactDisplayName, formatDate } from '@/lib/utils';
import { Plane, Hotel, MapPin, Car, FileText, Send } from 'lucide-react';

interface QuoteReviewProps {
  quote: TravelQuote;
  contact: Contact;
  onComplete: () => void;
}

export function QuoteReview({ quote, contact, onComplete }: QuoteReviewProps) {
  const { updateQuote } = useQuoteStore();

  const currentQuote = useQuoteStore(state => 
    state.quotes.find(q => q.id === quote.id)
  ) || quote;

  const handleSendQuote = () => {
    updateQuote(quote.id, { status: 'sent' });
    onComplete();
  };

  const handleSaveDraft = () => {
    updateQuote(quote.id, { status: 'draft' });
    onComplete();
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="w-5 h-5" />;
      case 'hotel': return <Hotel className="w-5 h-5" />;
      case 'activity': return <MapPin className="w-5 h-5" />;
      case 'transfer': return <Car className="w-5 h-5" />;
      default: return <MapPin className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Review Quote
        </h2>
        <p className="text-gray-600">
          Review the quote details before sending to your client
        </p>
      </div>

      {/* Quote Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{currentQuote.title}</h3>
            <p className="text-gray-600 mt-1">
              For {getContactDisplayName(contact.firstName, contact.lastName)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Travel: {formatDate(currentQuote.travelDates.start)} - {formatDate(currentQuote.travelDates.end)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(currentQuote.totalCost)}
            </div>
            <div className="text-sm text-gray-500">Total Quote</div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Client Information</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Name:</span> {getContactDisplayName(contact.firstName, contact.lastName)}
          </div>
          <div>
            <span className="font-medium text-gray-700">Email:</span> {contact.email}
          </div>
          {contact.phone && (
            <div>
              <span className="font-medium text-gray-700">Phone:</span> {contact.phone}
            </div>
          )}
          <div>
            <span className="font-medium text-gray-700">Total Quotes:</span> {contact.quotes.length}
          </div>
        </div>
      </div>

      {/* Travel Items */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Travel Items ({currentQuote.items.length})</h4>
        
        {currentQuote.items.length > 0 ? (
          <div className="space-y-4">
            {currentQuote.items.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="text-blue-600">
                    {getItemIcon(item.type)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-500">
                      {formatDate(item.startDate)} {item.endDate && `- ${formatDate(item.endDate)}`}
                    </div>
                    <div className="text-sm text-gray-600 capitalize">
                      {item.type} • Quantity: {item.quantity}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatCurrency(item.price)} each
                  </div>
                </div>
              </div>
            ))}
            
            {/* Total */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="font-semibold text-lg text-gray-900">Total:</div>
              <div className="font-bold text-xl text-blue-600">
                {formatCurrency(currentQuote.totalCost)}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No travel items added yet.</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center space-x-4">
        <Button variant="outline" onClick={handleSaveDraft} size="lg">
          <FileText className="w-5 h-5 mr-2" />
          Save as Draft
        </Button>
        <Button onClick={handleSendQuote} size="lg">
          <Send className="w-5 h-5 mr-2" />
          Send Quote to Client
        </Button>
      </div>
    </div>
  );
}