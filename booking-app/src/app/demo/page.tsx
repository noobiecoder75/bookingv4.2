'use client';

import { useEffect, useState } from 'react';
import { useQuoteStore } from '@/store/quote-store';
import { useContactStore } from '@/store/contact-store';
import { Button } from '@/components/ui/button';
import { ExternalLink, Eye } from 'lucide-react';

export default function DemoPage() {
  const { quotes, generatePreviewLink } = useQuoteStore();
  const { contacts } = useContactStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  const handlePreviewQuote = (quoteId: string) => {
    const previewLink = generatePreviewLink(quoteId);
    if (previewLink) {
      window.open(previewLink, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Client Quote System Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            This demonstrates the client-side quote view where customers can view their travel quotes, 
            request changes, and make payments online.
          </p>
        </div>

        {quotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Quotes Available</h3>
            <p className="text-gray-600 mb-4">
              Create a quote using the quote wizard to see the client view demo.
            </p>
            <Button asChild>
              <a href="/quote-wizard">Create Your First Quote</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-1">Demo Instructions</h3>
              <p className="text-blue-800 text-sm">
                Click &quot;Preview Client View&quot; on any quote below to see how it appears to your customers. 
                This includes the full quote details, messaging system, and payment functionality.
              </p>
            </div>

            <div className="grid gap-6">
              {quotes.map((quote) => {
                const contact = contacts.find(c => c.id === quote.contactId);
                return (
                  <div key={quote.id} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {quote.title}
                        </h3>
                        <p className="text-gray-600 mb-2">
                          Client: {contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown'}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Status: {quote.status}</span>
                          <span>Items: {quote.items.length}</span>
                          <span>Total: ${quote.totalCost.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Button 
                          onClick={() => handlePreviewQuote(quote.id)}
                          className="flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Preview Client View</span>
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            const link = generatePreviewLink(quote.id);
                            if (link) {
                              navigator.clipboard.writeText(link);
                              alert('Link copied to clipboard!');
                            }
                          }}
                          className="flex items-center space-x-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Copy Client Link</span>
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="font-medium text-gray-900 mb-2">Client Features:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                        <div>✓ View detailed itinerary</div>
                        <div>✓ See pricing breakdown</div>
                        <div>✓ Message travel agent</div>
                        <div>✓ Request changes</div>
                        <div>✓ Accept/decline quotes</div>
                        <div>✓ Online payment</div>
                        <div>✓ Mobile responsive</div>
                        <div>✓ Secure access</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-gray-100 rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-3">How It Works:</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>1. Create Quote:</strong> Use the quote wizard to create a detailed travel quote</p>
                <p><strong>2. Send to Client:</strong> Generate a secure link and send it to your client</p>
                <p><strong>3. Client Reviews:</strong> Client views quote details, pricing, and itinerary</p>
                <p><strong>4. Client Actions:</strong> Client can accept, request changes, or make payment</p>
                <p><strong>5. Communication:</strong> Built-in messaging system for questions and changes</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}