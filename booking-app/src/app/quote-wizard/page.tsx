'use client';

import { QuoteWizard } from '@/components/quote-wizard/QuoteWizard';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function QuoteWizardContent() {
  const searchParams = useSearchParams();
  const editQuoteId = searchParams.get('edit');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {editQuoteId ? 'Edit Travel Quote' : 'Create Travel Quote'}
        </h1>
        <p className="text-gray-600">
          {editQuoteId 
            ? 'Update your travel quote details'
            : 'Step-by-step wizard to create travel quotes for your clients'
          }
        </p>
      </div>
      <QuoteWizard editQuoteId={editQuoteId} />
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