import { TravelQuote } from '@/types';

// In a real implementation, this would generate a secure JWT token
export function generateClientAccessToken(quoteId: string, contactId: string): string {
  // For demo purposes, we'll create a simple token
  // In production, use proper JWT with expiration and signatures
  const tokenData = {
    quoteId,
    contactId,
    timestamp: Date.now(),
    // Add more security fields as needed
  };
  
  // Simple base64 encoding for demo - use proper JWT in production
  return btoa(JSON.stringify(tokenData));
}

export function generateClientQuoteLink(quote: TravelQuote): string {
  const token = generateClientAccessToken(quote.id, quote.contactId);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com';
  return `${baseUrl}/client/${quote.id}?token=${encodeURIComponent(token)}`;
}

export function validateClientAccessToken(token: string, quoteId: string): boolean {
  try {
    const decoded = JSON.parse(atob(token));
    
    // Check if token is for the correct quote
    if (decoded.quoteId !== quoteId) {
      return false;
    }
    
    // Check if token is not too old (24 hours for demo)
    const tokenAge = Date.now() - decoded.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (tokenAge > maxAge) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

// Email template for sending quote links to clients
export function generateQuoteEmailTemplate(
  quote: TravelQuote,
  contactName: string,
  agentName: string,
  clientLink: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #f8fafc; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #1f2937; margin: 0;">Your Travel Quote is Ready!</h1>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb;">
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Hi ${contactName},
        </p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          I've prepared a personalized travel quote for your upcoming trip: <strong>${quote.title}</strong>
        </p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin: 0 0 10px 0;">Trip Details:</h3>
          <p style="color: #6b7280; margin: 5px 0;">
            📅 ${new Date(quote.travelDates.start).toLocaleDateString()} - ${new Date(quote.travelDates.end).toLocaleDateString()}
          </p>
          <p style="color: #6b7280; margin: 5px 0;">
            🧳 ${quote.items.length} item${quote.items.length !== 1 ? 's' : ''} included
          </p>
          <p style="color: #6b7280; margin: 5px 0;">
            💰 Total: $${quote.totalCost.toLocaleString()}
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${clientLink}" 
             style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
            View Your Quote & Book Online
          </a>
        </div>
        
        <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="color: #065f46; margin: 0; font-size: 14px;">
            <strong>What you can do with this link:</strong><br>
            • View detailed itinerary and pricing<br>
            • Accept or request changes to the quote<br>
            • Pay online securely (full payment or deposit)<br>
            • Message me directly with questions
          </p>
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          This link is secure and personalized for you. If you have any questions or would like to make changes, 
          you can message me directly through the quote page or reply to this email.
        </p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Looking forward to helping you create an amazing travel experience!
        </p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Best regards,<br>
          <strong>${agentName}</strong>
        </p>
      </div>
      
      <div style="background: #f9fafb; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          This link will expire in 24 hours for security purposes. 
          If you need a new link, please contact your travel agent.
        </p>
      </div>
    </div>
  `;
}

// Generate a shareable preview link (for demonstrations)
export function generatePreviewLink(quote: TravelQuote): string {
  // This creates a long-lived preview token for demo purposes
  const previewToken = generateClientAccessToken(quote.id, quote.contactId);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com';
  return `${baseUrl}/client/${quote.id}?token=${encodeURIComponent(previewToken)}&preview=true`;
}