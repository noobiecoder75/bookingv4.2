'use client';

import { Contact } from '@/types';
import { Button } from '@/components/ui/button';
import { getContactDisplayName, formatDate } from '@/lib/utils';
import { Mail, Phone, Edit, Trash2, Calendar } from 'lucide-react';

interface ContactCardProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
}

export function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
  const displayName = getContactDisplayName(contact.firstName, contact.lastName);
  const quotesCount = contact.quotes.length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{displayName}</h3>
          <p className="text-sm text-gray-500">
            Member since {formatDate(contact.createdAt)}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(contact)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(contact.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Mail className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{contact.email}</span>
        </div>
        {contact.phone && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span>{contact.phone}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>
            {quotesCount} {quotesCount === 1 ? 'quote' : 'quotes'}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            // Navigate to contact's quotes/timeline view
            // This will be implemented when we add routing
            console.log('View quotes for:', contact.id);
          }}
        >
          View Quotes
        </Button>
      </div>
    </div>
  );
}