'use client';

import { useState } from 'react';
import { TravelQuote, Contact } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
  Lock, 
  DollarSign, 
  Calendar, 
  User, 
  Mail,
  Shield,
  X,
  Check
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PaymentData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
  email: string;
  paymentMethod: 'full' | 'deposit';
  depositAmount?: number;
}

interface ClientPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPayment: (paymentData: PaymentData) => void;
  quote: TravelQuote;
  contact: Contact;
}

export function ClientPaymentModal({ 
  isOpen, 
  onClose, 
  onPayment, 
  quote, 
  contact 
}: ClientPaymentModalProps) {
  const [paymentData, setPaymentData] = useState<PaymentData>({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: `${contact.firstName} ${contact.lastName}`,
    email: contact.email,
    paymentMethod: 'full'
  });
  
  const [step, setStep] = useState<'payment' | 'processing' | 'success'>('payment');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const depositAmount = Math.round(quote.totalCost * 0.25); // 25% deposit
  const paymentAmount = paymentData.paymentMethod === 'deposit' ? depositAmount : quote.totalCost;

  const validateCard = () => {
    const newErrors: Record<string, string> = {};

    // Card number validation (basic)
    const cardNumber = paymentData.cardNumber.replace(/\s/g, '');
    if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
      newErrors.cardNumber = 'Please enter a valid card number';
    }

    // Expiry validation
    if (!paymentData.expiryMonth || !paymentData.expiryYear) {
      newErrors.expiry = 'Please enter expiry date';
    } else {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      const expYear = parseInt(paymentData.expiryYear);
      const expMonth = parseInt(paymentData.expiryMonth);
      
      if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        newErrors.expiry = 'Card has expired';
      }
    }

    // CVV validation
    if (!paymentData.cvv || paymentData.cvv.length < 3) {
      newErrors.cvv = 'Please enter CVV';
    }

    // Cardholder name
    if (!paymentData.cardholderName.trim()) {
      newErrors.cardholderName = 'Please enter cardholder name';
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!paymentData.email || !emailRegex.test(paymentData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setPaymentData(prev => ({ ...prev, cardNumber: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCard()) {
      return;
    }

    setStep('processing');
    
    // Simulate payment processing
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onPayment(paymentData);
        handleClose();
      }, 2000);
    }, 3000);
  };

  const handleClose = () => {
    setStep('payment');
    setErrors({});
    onClose();
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 10; i++) {
      years.push(currentYear + i);
    }
    return years;
  };

  const generateMonths = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1).padStart(2, '0'),
      label: String(i + 1).padStart(2, '0')
    }));
  };

  if (step === 'processing') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Processing Payment...</h3>
            <p className="text-gray-600">Please wait while we process your payment securely.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (step === 'success') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
            <p className="text-gray-600 mb-4">
              Your {paymentData.paymentMethod === 'deposit' ? 'deposit' : 'payment'} of {formatCurrency(paymentAmount)} has been processed.
            </p>
            {paymentData.paymentMethod === 'deposit' && (
              <p className="text-sm text-gray-500">
                Remaining balance: {formatCurrency(quote.totalCost - depositAmount)}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Secure Payment</span>
          </DialogTitle>
          <DialogDescription>
            Complete your travel booking payment securely
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-3">Order Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Quote: {quote.title}</span>
                <span>{formatCurrency(quote.totalCost)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-medium">
                  <span>
                    {paymentData.paymentMethod === 'deposit' ? `Deposit (25%)` : 'Full Payment'}
                  </span>
                  <span>{formatCurrency(paymentAmount)}</span>
                </div>
                {paymentData.paymentMethod === 'deposit' && (
                  <div className="flex justify-between text-gray-600 text-xs mt-1">
                    <span>Remaining balance due later</span>
                    <span>{formatCurrency(quote.totalCost - depositAmount)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label>Payment Option</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentData(prev => ({ ...prev, paymentMethod: 'full' }))}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  paymentData.paymentMethod === 'full'
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <DollarSign className="w-5 h-5 mb-2" />
                <div className="font-medium">Pay in Full</div>
                <div className="text-sm text-gray-600">
                  {formatCurrency(quote.totalCost)}
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentData(prev => ({ ...prev, paymentMethod: 'deposit' }))}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  paymentData.paymentMethod === 'deposit'
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Calendar className="w-5 h-5 mb-2" />
                <div className="font-medium">Pay Deposit</div>
                <div className="text-sm text-gray-600">
                  {formatCurrency(depositAmount)} now
                </div>
              </button>
            </div>
          </div>

          {/* Card Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-green-600" />
              <span className="font-medium">Card Information</span>
              <Shield className="w-4 h-4 text-green-600" />
            </div>

            {/* Card Number */}
            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                type="text"
                value={paymentData.cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className={errors.cardNumber ? 'border-red-500' : ''}
              />
              {errors.cardNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Expiry Month */}
              <div>
                <Label>Month</Label>
                <Select
                  value={paymentData.expiryMonth}
                  onValueChange={(value) => setPaymentData(prev => ({ ...prev, expiryMonth: value }))}
                >
                  <SelectTrigger className={errors.expiry ? 'border-red-500' : ''}>
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateMonths().map(month => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Expiry Year */}
              <div>
                <Label>Year</Label>
                <Select
                  value={paymentData.expiryYear}
                  onValueChange={(value) => setPaymentData(prev => ({ ...prev, expiryYear: value }))}
                >
                  <SelectTrigger className={errors.expiry ? 'border-red-500' : ''}>
                    <SelectValue placeholder="YYYY" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateYears().map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* CVV */}
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  type="text"
                  value={paymentData.cvv}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  placeholder="123"
                  maxLength={4}
                  className={errors.cvv ? 'border-red-500' : ''}
                />
                {errors.cvv && (
                  <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
                )}
              </div>
            </div>

            {errors.expiry && (
              <p className="text-red-500 text-sm">{errors.expiry}</p>
            )}
          </div>

          {/* Billing Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="font-medium">Billing Information</span>
            </div>

            <div>
              <Label htmlFor="cardholderName">Cardholder Name</Label>
              <Input
                id="cardholderName"
                type="text"
                value={paymentData.cardholderName}
                onChange={(e) => setPaymentData(prev => ({ ...prev, cardholderName: e.target.value }))}
                placeholder="John Doe"
                className={errors.cardholderName ? 'border-red-500' : ''}
              />
              {errors.cardholderName && (
                <p className="text-red-500 text-sm mt-1">{errors.cardholderName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={paymentData.email}
                onChange={(e) => setPaymentData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-800 mb-1">Secure Payment</p>
                <p className="text-green-700">
                  Your payment information is encrypted and secure. We never store your card details.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white min-w-[140px]"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Pay {formatCurrency(paymentAmount)}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}