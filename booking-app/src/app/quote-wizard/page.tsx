'use client';

import { QuoteWizard } from '@/components/quote-wizard/QuoteWizard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function QuoteWizardContent() {
  const searchParams = useSearchParams();
  const editQuoteId = searchParams.get('edit');

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {editQuoteId ? 'Edit Travel Quote' : 'Create Travel Quote'}
            </h1>
            <p className="text-gray-600">
              {editQuoteId
                ? 'Update your travel quote with the latest details and pricing'
                : 'Step-by-step intelligent wizard to create comprehensive travel quotes'
              }
            </p>
          </div>
          <QuoteWizard editQuoteId={editQuoteId} />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

export default function QuoteWizardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuoteWizardContent />
    </Suspense>
  );
}