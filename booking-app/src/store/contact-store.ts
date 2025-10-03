import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Contact } from '@/types';
import { RateSource } from '@/types/rate';

interface ContactStore {
  contacts: Contact[];
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'quotes'>) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  getContactById: (id: string) => Contact | undefined;
  searchContacts: (query: string) => Contact[];
  addQuoteToContact: (contactId: string, quoteId: string) => void;
  removeQuoteFromContact: (contactId: string, quoteId: string) => void;
  findSupplierByName: (name: string) => Contact | undefined;
  createSupplierFromRate: (supplierName: string, source: RateSource) => string;
}

export const useContactStore = create<ContactStore>()(
  persist(
    (set, get) => ({
      contacts: [],
      
      addContact: (contactData) => {
        const newContact: Contact = {
          ...contactData,
          id: crypto.randomUUID(),
          quotes: [],
          createdAt: new Date(),
        };
        set((state) => ({
          contacts: [...state.contacts, newContact],
        }));
      },
      
      updateContact: (id, updates) => {
        set((state) => ({
          contacts: state.contacts.map((contact) =>
            contact.id === id ? { ...contact, ...updates } : contact
          ),
        }));
      },
      
      deleteContact: (id) => {
        set((state) => ({
          contacts: state.contacts.filter((contact) => contact.id !== id),
        }));
      },
      
      getContactById: (id) => {
        return get().contacts.find((contact) => contact.id === id);
      },
      
      searchContacts: (query) => {
        const { contacts } = get();
        if (!query.trim()) return contacts;
        
        const lowercaseQuery = query.toLowerCase();
        return contacts.filter(
          (contact) =>
            contact.firstName.toLowerCase().includes(lowercaseQuery) ||
            contact.lastName.toLowerCase().includes(lowercaseQuery) ||
            contact.email.toLowerCase().includes(lowercaseQuery)
        );
      },
      
      addQuoteToContact: (contactId, quoteId) => {
        set((state) => ({
          contacts: state.contacts.map((contact) =>
            contact.id === contactId
              ? { ...contact, quotes: [...contact.quotes, quoteId] }
              : contact
          ),
        }));
      },
      
      removeQuoteFromContact: (contactId, quoteId) => {
        set((state) => ({
          contacts: state.contacts.map((contact) =>
            contact.id === contactId
              ? {
                  ...contact,
                  quotes: contact.quotes.filter((id) => id !== quoteId),
                }
              : contact
          ),
        }));
      },

      findSupplierByName: (name) => {
        const { contacts } = get();
        const normalizedName = name.toLowerCase().trim();

        return contacts.find(
          (contact) =>
            contact.type === 'supplier' &&
            (contact.firstName + ' ' + contact.lastName).toLowerCase().trim() === normalizedName
        );
      },

      createSupplierFromRate: (supplierName, source) => {
        const supplierId = crypto.randomUUID();

        // Split name into first/last (simple approach)
        const nameParts = supplierName.trim().split(' ');
        const firstName = nameParts[0] || supplierName;
        const lastName = nameParts.slice(1).join(' ') || '';

        const newSupplier: Contact = {
          id: supplierId,
          firstName,
          lastName,
          email: '', // To be filled later
          phone: '',
          type: 'supplier',
          tags: [source, 'auto-created'],
          quotes: [],
          createdAt: new Date(),
        };

        set((state) => ({
          contacts: [...state.contacts, newSupplier],
        }));

        return supplierId;
      },
    }),
    {
      name: 'contact-store',
    }
  )
);