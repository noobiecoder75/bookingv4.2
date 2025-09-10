'use client';

import { TravelQuote, Contact } from '@/types';
import { useContactStore } from '@/store/contact-store';
import { useQuoteStore } from '@/store/quote-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, getContactDisplayName } from '@/lib/utils';
import { 
  Calendar, 
  User, 
  DollarSign, 
  FileText,
  Edit,
  Copy,
  Trash2,
  MoreHorizontal,
  Plane,
  Hotel,
  MapPin,
  Car,
  Send,
  ExternalLink,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import moment from 'moment';
import Link from 'next/link';

interface QuoteCardProps {
  quote: TravelQuote;
  onDelete?: (quoteId: string) => void;
  onDuplicate?: (quoteId: string) => void;
  onStatusChange?: (quoteId: string, status: TravelQuote['status']) => void;
}

export function QuoteCard({ quote, onDelete, onDuplicate, onStatusChange }: QuoteCardProps) {
  const { getContactById } = useContactStore();
  const { updateQuoteStatus, duplicateQuote, deleteQuote, sendQuoteToClient, generatePreviewLink } = useQuoteStore();
  
  const contact = getContactById(quote.contactId);
  
  const getStatusColor = (status: TravelQuote['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
      case 'sent': return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
      case 'accepted': return 'bg-green-100 text-green-700 hover:bg-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 hover:bg-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="w-3 h-3" />;
      case 'hotel': return <Hotel className="w-3 h-3" />;
      case 'activity': return <MapPin className="w-3 h-3" />;
      case 'transfer': return <Car className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  const itemTypeCounts = quote.items.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleStatusChange = (newStatus: TravelQuote['status']) => {
    updateQuoteStatus(quote.id, newStatus);
    onStatusChange?.(quote.id, newStatus);
  };

  const handleDuplicate = () => {
    const newQuoteId = duplicateQuote(quote.id);
    if (newQuoteId) {
      onDuplicate?.(newQuoteId);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this quote?')) {
      deleteQuote(quote.id);
      onDelete?.(quote.id);
    }
  };

  const handleSendToClient = async () => {
    const success = await sendQuoteToClient(quote.id);
    if (success) {
      console.log('Quote sent successfully');
      // You could add a toast notification here
    } else {
      console.error('Failed to send quote');
      // You could add error handling here
    }
  };

  const handlePreview = () => {
    const previewLink = generatePreviewLink(quote.id);
    if (previewLink) {
      window.open(previewLink, '_blank');
    }
  };

  const handleCopyLink = async () => {
    const previewLink = generatePreviewLink(quote.id);
    if (previewLink) {
      try {
        await navigator.clipboard.writeText(previewLink);
        console.log('Link copied to clipboard');
        // You could add a toast notification here
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {quote.title}
          </h3>
          {contact && (
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <User className="w-4 h-4 mr-2" />
              <span className="truncate">
                {getContactDisplayName(contact.firstName, contact.lastName)}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(quote.status)}>
            {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/quote-wizard?edit=${quote.id}`} className="flex items-center">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Quote
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSendToClient}>
                <Send className="w-4 h-4 mr-2" />
                Send to Client
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePreview}>
                <Eye className="w-4 h-4 mr-2" />
                Preview Client View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Copy Client Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Travel Dates */}
      <div className="flex items-center text-sm text-gray-600 mb-3">
        <Calendar className="w-4 h-4 mr-2" />
        <span>
          {moment(quote.travelDates.start).format('MMM D')} - {moment(quote.travelDates.end).format('MMM D, YYYY')}
        </span>
      </div>

      {/* Items Summary */}
      {quote.items.length > 0 && (
        <div className="flex items-center space-x-3 mb-4">
          {Object.entries(itemTypeCounts).map(([type, count]) => (
            <div key={type} className="flex items-center text-xs text-gray-600">
              {getItemIcon(type)}
              <span className="ml-1">{count}</span>
            </div>
          ))}
          <span className="text-xs text-gray-500">
            {quote.items.length} item{quote.items.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center text-lg font-semibold text-gray-900">
          <DollarSign className="w-5 h-5 mr-1" />
          {formatCurrency(quote.totalCost)}
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={quote.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-auto h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="text-xs text-gray-500 mt-2">
        Created {moment(quote.createdAt).format('MMM D, YYYY')}
      </div>
    </div>
  );
}