import { ContactList } from '@/components/contacts/ContactList';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function ContactsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Contact Management
            </h1>
            <p className="text-xl text-gray-600">
              Manage your travel clients and build lasting relationships
            </p>
          </div>
          <ContactList />
        </div>
      </div>
    </ProtectedRoute>
  );
}