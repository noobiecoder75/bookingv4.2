'use client';

import { QuoteWizard } from '@/components/quote-wizard/QuoteWizard';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function QuoteWizardContent() {
  const searchParams = useSearchParams();
  const editQuoteId = searchParams.get('edit');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {editQuoteId ? 'Edit Travel Quote' : 'Create Travel Quote'}
          </h1>
          <p className="text-xl text-gray-600">
            {editQuoteId 
              ? 'Update your travel quote with the latest details and pricing'
              : 'Step-by-step intelligent wizard to create comprehensive travel quotes'
            }
          </p>
        </div>
        <QuoteWizard editQuoteId={editQuoteId} />
      </div>
    </div>
  );
}

export default function QuoteWizardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuoteWizardContent />
    </Suspense>
  );
}