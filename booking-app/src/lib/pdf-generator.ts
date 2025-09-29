'use client';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice } from '@/types/financial';

export interface CompanyInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  website?: string;
  taxId?: string;
}

export const generateInvoicePDF = async (
  invoice: Invoice,
  companyInfo?: CompanyInfo
): Promise<void> => {
  // Create a temporary div to render the invoice
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '794px'; // A4 width in pixels (96 DPI)
  tempDiv.style.background = 'white';
  document.body.appendChild(tempDiv);

  // Default company info
  const defaultCompanyInfo: CompanyInfo = {
    name: 'Your Travel Company',
    address: '123 Business St',
    city: 'Business City',
    state: 'BC',
    zip: '12345',
    phone: '(555) 123-4567',
    email: 'invoices@travelcompany.com',
    website: 'www.travelcompany.com',
    taxId: '12-3456789'
  };

  const company = companyInfo || defaultCompanyInfo;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Generate HTML content for the invoice
  tempDiv.innerHTML = `
    <div style="padding: 40px; font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div>
          <h1 style="margin: 0; font-size: 28px; color: #1a1a1a; font-weight: bold;">${company.name}</h1>
          <div style="margin-top: 10px; color: #666;">
            <p style="margin: 2px 0;">${company.address}</p>
            <p style="margin: 2px 0;">${company.city}, ${company.state} ${company.zip}</p>
            <p style="margin: 2px 0;">Phone: ${company.phone}</p>
            <p style="margin: 2px 0;">Email: ${company.email}</p>
            ${company.website ? `<p style="margin: 2px 0;">Web: ${company.website}</p>` : ''}
            ${company.taxId ? `<p style="margin: 2px 0;">Tax ID: ${company.taxId}</p>` : ''}
          </div>
        </div>

        <div style="text-align: right;">
          <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #1a1a1a; font-weight: bold;">INVOICE</h2>
          <div style="color: #666;">
            <p style="margin: 5px 0;"><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
            <p style="margin: 5px 0;"><strong>Issue Date:</strong> ${formatDate(invoice.issueDate)}</p>
            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong>
              <span style="background: ${invoice.status === 'paid' ? '#dcfce7' : invoice.status === 'sent' ? '#dbeafe' : '#fee2e2'};
                           color: ${invoice.status === 'paid' ? '#166534' : invoice.status === 'sent' ? '#1d4ed8' : '#dc2626'};
                           padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                ${invoice.status.toUpperCase()}
              </span>
            </p>
          </div>
        </div>
      </div>

      <!-- Bill To -->
      <div style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #1a1a1a;">Bill To:</h3>
        <div style="color: #555;">
          <p style="margin: 2px 0; font-weight: bold;">${invoice.customerName}</p>
          <p style="margin: 2px 0;">${invoice.customerEmail}</p>
          ${invoice.customerAddress ? `
            <p style="margin: 2px 0;">${invoice.customerAddress.street || ''}</p>
            <p style="margin: 2px 0;">${invoice.customerAddress.city || ''}, ${invoice.customerAddress.state || ''} ${invoice.customerAddress.zip || ''}</p>
            ${invoice.customerAddress.country ? `<p style="margin: 2px 0;">${invoice.customerAddress.country}</p>` : ''}
          ` : ''}
        </div>
      </div>

      <!-- Invoice Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #ccc;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="border: 1px solid #ccc; padding: 12px; text-align: left; font-weight: bold;">Description</th>
            <th style="border: 1px solid #ccc; padding: 12px; text-align: center; font-weight: bold; width: 80px;">Qty</th>
            <th style="border: 1px solid #ccc; padding: 12px; text-align: right; font-weight: bold; width: 120px;">Unit Price</th>
            <th style="border: 1px solid #ccc; padding: 12px; text-align: right; font-weight: bold; width: 120px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td style="border: 1px solid #ccc; padding: 12px;">
                <div style="font-weight: 500;">${item.description}</div>
              </td>
              <td style="border: 1px solid #ccc; padding: 12px; text-align: center;">${item.quantity}</td>
              <td style="border: 1px solid #ccc; padding: 12px; text-align: right;">${formatCurrency(item.unitPrice)}</td>
              <td style="border: 1px solid #ccc; padding: 12px; text-align: right; font-weight: bold;">${formatCurrency(item.total)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
        <div style="width: 300px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd;">
            <span style="font-weight: 500;">Subtotal:</span>
            <span>${formatCurrency(invoice.subtotal)}</span>
          </div>

          ${invoice.discountAmount && invoice.discountAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd;">
              <span style="font-weight: 500;">Discount:</span>
              <span>-${formatCurrency(invoice.discountAmount)}</span>
            </div>
          ` : ''}

          ${invoice.taxRate > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd;">
              <span style="font-weight: 500;">Tax (${invoice.taxRate}%):</span>
              <span>${formatCurrency(invoice.taxAmount)}</span>
            </div>
          ` : ''}

          <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 2px solid #666; font-size: 18px; font-weight: bold;">
            <span>Total:</span>
            <span>${formatCurrency(invoice.total)}</span>
          </div>

          ${invoice.paidAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #059669;">
              <span style="font-weight: 500;">Amount Paid:</span>
              <span>-${formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 1px solid #ddd; font-size: 18px; font-weight: bold;">
              <span>Balance Due:</span>
              <span style="color: ${invoice.remainingAmount > 0 ? '#dc2626' : '#059669'};">
                ${formatCurrency(invoice.remainingAmount)}
              </span>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Payment History -->
      ${invoice.payments && invoice.payments.length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #1a1a1a;">Payment History:</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="border: 1px solid #ccc; padding: 8px; text-align: left; font-weight: bold;">Date</th>
                <th style="border: 1px solid #ccc; padding: 8px; text-align: left; font-weight: bold;">Method</th>
                <th style="border: 1px solid #ccc; padding: 8px; text-align: left; font-weight: bold;">Reference</th>
                <th style="border: 1px solid #ccc; padding: 8px; text-align: right; font-weight: bold;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.payments.map(payment => `
                <tr>
                  <td style="border: 1px solid #ccc; padding: 8px;">${new Date(payment.processedDate).toLocaleDateString()}</td>
                  <td style="border: 1px solid #ccc; padding: 8px; text-transform: capitalize;">${payment.method.replace('_', ' ')}</td>
                  <td style="border: 1px solid #ccc; padding: 8px;">${payment.transactionId || 'N/A'}</td>
                  <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${formatCurrency(payment.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- Terms and Notes -->
      <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-bottom: 20px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
          ${invoice.terms ? `
            <div>
              <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #1a1a1a;">Payment Terms:</h3>
              <p style="margin: 0; color: #555; font-size: 14px;">${invoice.terms}</p>
            </div>
          ` : ''}

          <div>
            <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #1a1a1a;">Notes:</h3>
            <p style="margin: 0; color: #555; font-size: 14px;">
              Thank you for your business! Please remit payment by the due date to avoid late fees.
              For questions about this invoice, please contact us at ${company.email} or ${company.phone}.
            </p>
          </div>
        </div>
      </div>

      <!-- Footer - GAAP Compliance -->
      <div style="border-top: 1px solid #ddd; padding-top: 15px; font-size: 10px; color: #888;">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
          <div>
            <p style="margin: 2px 0;"><strong>Accounting Basis:</strong> Accrual Method</p>
            <p style="margin: 2px 0;"><strong>Revenue Recognition:</strong> GAAP ASC 606</p>
          </div>
          <div>
            <p style="margin: 2px 0;"><strong>Document Type:</strong> Commercial Invoice</p>
            <p style="margin: 2px 0;"><strong>Currency:</strong> USD</p>
          </div>
          <div>
            <p style="margin: 2px 0;"><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
            ${company.taxId ? `<p style="margin: 2px 0;"><strong>Tax ID:</strong> ${company.taxId}</p>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794,
      height: tempDiv.scrollHeight
    });

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Download the PDF
    pdf.save(`${invoice.invoiceNumber}.pdf`);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  } finally {
    // Clean up
    document.body.removeChild(tempDiv);
  }
};

export default generateInvoicePDF;