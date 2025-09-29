'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Invoice } from '@/types/financial';
import { InvoiceTemplate } from './InvoiceTemplate';
import { generateInvoicePDF } from '@/lib/pdf-generator';
import { X, Download, Mail, Printer } from 'lucide-react';

interface InvoiceModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoice,
  isOpen,
  onClose
}) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  if (!invoice) return null;

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generateInvoicePDF(invoice);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    // In a real app, this would integrate with email service
    alert(`Email functionality would send invoice ${invoice.invoiceNumber} to ${invoice.customerEmail}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-xl font-semibold">
            Invoice {invoice.invoiceNumber}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEmail}
              className="flex items-center gap-1"
            >
              <Mail className="w-4 h-4" />
              Email
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-1"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex items-center gap-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-4">
          <InvoiceTemplate invoice={invoice} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceModal;