'use client';

import { useState } from 'react';
import { TravelQuote, TravelItem, Contact } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { 
  Calendar, 
  MapPin, 
  Plane, 
  Hotel, 
  Car, 
  Clock,
  DollarSign,
  MessageSquare,
  CreditCard,
  Check,
  X,
  FileText,
  User,
  Mail,
} from 'lucide-react';
import moment from 'moment';
import { ClientMessageModal } from './ClientMessageModal';
import { ClientPaymentModal } from './ClientPaymentModal';

interface ClientQuoteViewProps {
  quote: TravelQuote;
  contact: Contact;
  agentName?: string;
  agentEmail?: string;
  onQuoteAction?: (action: 'accept' | 'reject' | 'message' | 'payment') => void;
}

export function ClientQuoteView({ 
  quote, 
  contact, 
  agentName = 'Your Travel Agent',
  agentEmail,
  onQuoteAction 
}: ClientQuoteViewProps) {
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [quoteStatus, setQuoteStatus] = useState(quote.status);

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="w-5 h-5 text-blue-600" />;
      case 'hotel': return <Hotel className="w-5 h-5 text-green-600" />;
      case 'activity': return <MapPin className="w-5 h-5 text-purple-600" />;
      case 'transfer': return <Car className="w-5 h-5 text-orange-600" />;
      default: return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case 'flight': return 'bg-blue-50 border-blue-200';
      case 'hotel': return 'bg-green-50 border-green-200';
      case 'activity': return 'bg-purple-50 border-purple-200';
      case 'transfer': return 'bg-orange-50 border-orange-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const formatItemDetails = (item: TravelItem) => {
    const details = [];
    
    if (item.startDate) {
      const startDate = moment(item.startDate);
      const endDate = item.endDate ? moment(item.endDate) : null;
      
      if (endDate && !startDate.isSame(endDate, 'day')) {
        details.push(`${startDate.format('MMM D')} - ${endDate.format('MMM D, YYYY')}`);
      } else {
        details.push(startDate.format('MMM D, YYYY [at] h:mm A'));
      }
    }

    // Add specific details based on type
    if (item.details) {
      const itemDetails = item.details as Record<string, unknown>;
      switch (item.type) {
        case 'flight':
          if (itemDetails.departure_airport && itemDetails.arrival_airport) {
            details.push(`${itemDetails.departure_airport} → ${itemDetails.arrival_airport}`);
          }
          if (itemDetails.flight_number) {
            details.push(`Flight ${itemDetails.flight_number}`);
          }
          break;
        case 'hotel':
          if (itemDetails.location) {
            details.push(itemDetails.location);
          }
          if (itemDetails.room_type) {
            details.push(itemDetails.room_type);
          }
          if (itemDetails.nights) {
            details.push(`${itemDetails.nights} night${itemDetails.nights > 1 ? 's' : ''}`);
          }
          break;
        case 'activity':
          if (itemDetails.location) {
            details.push(itemDetails.location);
          }
          if (itemDetails.duration) {
            details.push(`${itemDetails.duration} hours`);
          }
          break;
        case 'transfer':
          if (itemDetails.from && itemDetails.to) {
            details.push(`${itemDetails.from} → ${itemDetails.to}`);
          }
          break;
      }
    }

    return details;
  };

  const handleAcceptQuote = () => {
    setQuoteStatus('accepted');
    onQuoteAction?.('accept');
  };

  const handleRejectQuote = () => {
    setQuoteStatus('rejected');
    onQuoteAction?.('reject');
  };

  const handleSendMessage = (message: string, requestChanges: boolean) => {
    onQuoteAction?.('message');
    // Here you would typically send the message to the backend
    console.log('Message sent:', { message, requestChanges, quoteId: quote.id });
  };

  const handlePayment = (paymentData: Record<string, unknown>) => {
    onQuoteAction?.('payment');
    // Here you would typically process the payment
    console.log('Payment initiated:', { paymentData, quoteId: quote.id });
  };

  const groupedItems = quote.items.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, TravelItem[]>);

  const isQuoteFinal = quoteStatus === 'accepted' || quoteStatus === 'rejected';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Your Travel Quote
              </h1>
              <h2 className="text-xl text-gray-700 mb-1">
                {quote.title}
              </h2>
              <div className="flex items-center text-sm text-gray-600 space-x-4">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {moment(quote.travelDates.start).format('MMM D')} - {moment(quote.travelDates.end).format('MMM D, YYYY')}
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  Prepared by {agentName}
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge 
                className={`mb-2 ${
                  quoteStatus === 'sent' ? 'bg-blue-100 text-blue-800' :
                  quoteStatus === 'accepted' ? 'bg-green-100 text-green-800' :
                  quoteStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {quoteStatus === 'sent' ? 'Pending Response' :
                 quoteStatus === 'accepted' ? 'Accepted' :
                 quoteStatus === 'rejected' ? 'Rejected' :
                 quoteStatus.charAt(0).toUpperCase() + quoteStatus.slice(1)}
              </Badge>
              <div className="text-right">
                <div className="text-sm text-gray-600">Total Cost</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(quote.totalCost)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Trip Overview */}
        <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Calendar className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-900">Duration</div>
              <div className="text-sm text-gray-600">
                {moment(quote.travelDates.end).diff(moment(quote.travelDates.start), 'days') + 1} days
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-900">Items Included</div>
              <div className="text-sm text-gray-600">
                {quote.items.length} item{quote.items.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <DollarSign className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-900">Total Value</div>
              <div className="text-sm text-gray-600">
                {formatCurrency(quote.totalCost)}
              </div>
            </div>
          </div>
        </div>

        {/* Travel Items by Category */}
        {Object.entries(groupedItems).map(([type, items]) => (
          <div key={type} className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="px-6 py-4 border-b bg-gray-50 rounded-t-lg">
              <div className="flex items-center space-x-2">
                {getItemIcon(type)}
                <h3 className="text-lg font-semibold text-gray-900 capitalize">
                  {type}s ({items.length})
                </h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className={`border rounded-lg p-4 ${getItemTypeColor(item.type)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-2">{item.name}</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          {formatItemDetails(item).map((detail, index) => (
                            <div key={index} className="flex items-center">
                              <Clock className="w-4 h-4 mr-1 flex-shrink-0" />
                              {detail}
                            </div>
                          ))}
                        </div>
                        {item.quantity > 1 && (
                          <div className="mt-2 text-sm text-gray-600">
                            Quantity: {item.quantity}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-sm text-gray-600">
                            {formatCurrency(item.price)} each
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Quote Summary */}
        <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote Summary</h3>
          <div className="space-y-3">
            {Object.entries(groupedItems).map(([type, items]) => {
              const typeTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
              return (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-gray-600 capitalize">
                    {type}s ({items.length} item{items.length !== 1 ? 's' : ''})
                  </span>
                  <span className="font-medium">{formatCurrency(typeTotal)}</span>
                </div>
              );
            })}
            <div className="border-t pt-3">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(quote.totalCost)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!isQuoteFinal && quote.status === 'sent' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What would you like to do?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                onClick={handleAcceptQuote}
                className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white h-12"
              >
                <Check className="w-5 h-5" />
                <span>Accept Quote</span>
              </Button>
              
              <Button 
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white h-12"
              >
                <CreditCard className="w-5 h-5" />
                <span>Accept & Pay</span>
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setShowMessageModal(true)}
                className="flex items-center justify-center space-x-2 h-12"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Request Changes</span>
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleRejectQuote}
                className="flex items-center justify-center space-x-2 text-red-600 border-red-300 hover:bg-red-50 h-12"
              >
                <X className="w-5 h-5" />
                <span>Decline Quote</span>
              </Button>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {isQuoteFinal && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className={`flex items-center space-x-3 ${
              quoteStatus === 'accepted' ? 'text-green-600' : 'text-red-600'
            }`}>
              {quoteStatus === 'accepted' ? (
                <Check className="w-6 h-6" />
              ) : (
                <X className="w-6 h-6" />
              )}
              <div>
                <h3 className="text-lg font-semibold">
                  Quote {quoteStatus === 'accepted' ? 'Accepted' : 'Declined'}
                </h3>
                <p className="text-sm text-gray-600">
                  {quoteStatus === 'accepted' 
                    ? 'Thank you for accepting this quote. Your travel agent will be in touch shortly with next steps.'
                    : 'You have declined this quote. Feel free to reach out if you\'d like to discuss alternatives.'
                  }
                </p>
              </div>
            </div>
            
            {quoteStatus === 'accepted' && (
              <div className="mt-4 pt-4 border-t">
                <Button 
                  onClick={() => setShowPaymentModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Proceed to Payment
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Your Travel Agent</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  {agentName}
                </div>
                {agentEmail && (
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    <a href={`mailto:${agentEmail}`} className="text-blue-600 hover:underline">
                      {agentEmail}
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Have Questions?</h4>
              <Button 
                variant="outline"
                onClick={() => setShowMessageModal(true)}
                className="w-full"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      <ClientMessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        onSend={handleSendMessage}
        agentName={agentName}
      />

      {/* Payment Modal */}
      <ClientPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPayment={handlePayment}
        quote={quote}
        contact={contact}
      />
    </div>
  );
}