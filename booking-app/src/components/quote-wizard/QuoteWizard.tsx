'use client';

import { useState, useEffect } from 'react';
import { useContactStore } from '@/store/contact-store';
import { useQuoteStore } from '@/store/quote-store';
import { Contact, TravelQuote } from '@/types';
import { Button } from '@/components/ui/button';
import { ContactSelection } from './ContactSelection';
import { QuoteDetails } from './QuoteDetails';
import { TravelItems } from './TravelItems';
import { QuoteReview } from './QuoteReview';
import { ChevronLeft, ChevronRight, Home, Save, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type WizardStep = 'contact' | 'details' | 'items' | 'review';

interface QuoteWizardProps {
  editQuoteId?: string | null;
}

export function QuoteWizard({ editQuoteId }: QuoteWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>('contact');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [currentQuote, setCurrentQuote] = useState<Partial<TravelQuote> | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const { addQuote, updateQuote, getQuoteById, setCurrentQuote: setStoreCurrentQuote } = useQuoteStore();
  const { addQuoteToContact, getContactById } = useContactStore();

  // Load existing quote if editing
  useEffect(() => {
    if (editQuoteId) {
      const existingQuote = getQuoteById(editQuoteId);
      if (existingQuote) {
        setCurrentQuote(existingQuote);
        setIsEditMode(true);
        
        // Load the associated contact
        const contact = getContactById(existingQuote.contactId);
        if (contact) {
          setSelectedContact(contact);
          // Skip contact selection step in edit mode
          setCurrentStep('details');
        }
        
        // Set current quote in store for timeline integration
        setStoreCurrentQuote(existingQuote);
      }
    }
  }, [editQuoteId, getQuoteById, getContactById, setStoreCurrentQuote]);

  const steps = [
    { id: 'contact', label: 'Select Contact', description: 'Choose or create a contact' },
    { id: 'details', label: 'Quote Details', description: 'Set travel dates and details' },
    { id: 'items', label: 'Add Items', description: 'Add flights, hotels, and activities' },
    { id: 'review', label: 'Review & Send', description: 'Review and finalize quote' },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  const handleNext = () => {
    const nextIndex = Math.min(currentStepIndex + 1, steps.length - 1);
    setCurrentStep(steps[nextIndex].id as WizardStep);
  };

  const handlePrevious = () => {
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    setCurrentStep(steps[prevIndex].id as WizardStep);
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    handleNext();
  };

  const handleQuoteDetailsComplete = (quoteData: Partial<TravelQuote>) => {
    if (!selectedContact) return;
    
    if (isEditMode && currentQuote?.id) {
      // Update existing quote
      updateQuote(currentQuote.id, {
        title: quoteData.title || currentQuote.title,
        travelDates: quoteData.travelDates || currentQuote.travelDates,
        ...quoteData,
      });

      // Get updated quote from store
      const updatedQuote = getQuoteById(currentQuote.id);
      if (updatedQuote) {
        setCurrentQuote(updatedQuote);
        setStoreCurrentQuote(updatedQuote);
      }
    } else {
      // Create new quote
      const newQuoteId = addQuote({
        contactId: selectedContact.id,
        title: quoteData.title || 'New Travel Quote',
        items: [],
        totalCost: 0,
        status: 'draft',
        travelDates: quoteData.travelDates || {
          start: new Date(),
          end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      });

      // Link quote to contact
      addQuoteToContact(selectedContact.id, newQuoteId);

      // Set current quote in store for timeline integration
      const quote = useQuoteStore.getState().getQuoteById(newQuoteId);
      if (quote) {
        setCurrentQuote(quote);
        setStoreCurrentQuote(quote);
      }
    }

    handleNext();
  };

  const handleItemsComplete = () => {
    handleNext();
  };

  const handleQuoteComplete = () => {
    // Show success message or redirect
    alert(isEditMode ? 'Quote updated successfully!' : 'Quote created successfully!');

    // Redirect to quotes dashboard
    router.push('/quotes');
  };

  const handleSaveAndExit = () => {
    if (currentQuote?.id) {
      // Save current state if we have a quote
      alert('Quote saved as draft');
    }
    router.push('/quotes');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'contact':
        // Skip contact selection in edit mode
        if (isEditMode && selectedContact) {
          setCurrentStep('details');
          return null;
        }
        return <ContactSelection onContactSelect={handleContactSelect} />;
      case 'details':
        return (
          <QuoteDetails
            contact={selectedContact!}
            quote={isEditMode ? currentQuote : undefined}
            onComplete={handleQuoteDetailsComplete}
          />
        );
      case 'items':
        return (
          <TravelItems
            quote={currentQuote as TravelQuote}
            onComplete={handleItemsComplete}
          />
        );
      case 'review':
        return (
          <QuoteReview
            quote={currentQuote as TravelQuote}
            contact={selectedContact!}
            onComplete={handleQuoteComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="glass-card rounded-2xl p-6 hover-lift transition-smooth">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center ${
                index < steps.length - 1 ? 'md:flex-1' : ''
              } w-full md:w-auto`}
            >
              <div className="flex flex-col items-center flex-1 md:flex-initial">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-medium shadow-medium transition-smooth hover-lift ${
                    index <= currentStepIndex
                      ? 'bg-gradient-primary text-white'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="mt-3 text-center">
                  <div className={`text-sm font-medium ${
                    index <= currentStepIndex ? 'text-gray-900' : 'text-gray-600'
                  }`}>
                    {step.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 hidden md:block">
                    {step.description}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`hidden md:flex flex-1 h-0.5 mx-6 rounded-full transition-smooth ${
                    index < currentStepIndex ? 'bg-gradient-primary' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="glass-card rounded-2xl p-6 hover-lift transition-smooth">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
              className="shadow-soft hover-lift transition-smooth"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <Button
              variant="ghost"
              onClick={handleSaveAndExit}
              className="text-gray-600 hover-lift transition-smooth"
            >
              <Save className="w-4 h-4 mr-2" />
              Save & Exit
            </Button>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <Button
              onClick={handleNext}
              disabled={
                currentStepIndex === steps.length - 1 ||
                (currentStep === 'contact' && !selectedContact) ||
                (currentStep === 'details' && !currentQuote)
              }
              className="shadow-soft hover-lift transition-smooth bg-gradient-primary hover:shadow-medium"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>

            <Button
              variant="ghost"
              onClick={() => router.push('/quotes')}
              className="text-gray-600 hover-lift transition-smooth"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="glass-card rounded-2xl p-8 shadow-medium hover-lift transition-smooth">
        {renderStepContent()}
      </div>
    </div>
  );
}