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
    <div className="glass-card rounded-2xl p-6 hover-lift group transition-smooth border border-white/20 backdrop-blur-sm shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {displayName}
              </h3>
              <p className="text-sm text-gray-500">
                Member since {formatDate(contact.createdAt)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(contact)}
            className="hover:bg-blue-50 hover:text-blue-600"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(contact.id)}
            className="hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center space-x-3 text-sm">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Mail className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-gray-700 truncate font-medium">{contact.email}</span>
        </div>
        {contact.phone && (
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Phone className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-gray-700 font-medium">{contact.phone}</span>
          </div>
        )}
      </div>

      {/* Stats & Action */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100/50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">{quotesCount}</div>
            <div className="text-xs text-gray-500">
              {quotesCount === 1 ? 'Quote' : 'Quotes'}
            </div>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            // Navigate to contact's quotes/timeline view
            // This will be implemented when we add routing
            console.log('View quotes for:', contact.id);
          }}
          className="group-hover:bg-gradient-primary group-hover:text-white group-hover:border-transparent"
        >
          View Quotes
        </Button>
      </div>
    </div>
  );
}