import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, Users, FileText, Clock } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            BookingGPT v4.2
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Contact-Driven Travel Booking System with react-big-calendar Timeline
          </p>
          <p className="text-lg text-gray-500 mt-4">
            Transforming travel professional workflows into an integrated customer-centric experience
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <Users className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Contact Management</h3>
            <p className="text-gray-600 text-sm">
              Complete customer relationship system with search and organization
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <Calendar className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Calendar Timeline</h3>
            <p className="text-gray-600 text-sm">
              Professional react-big-calendar interface for itinerary visualization
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <FileText className="w-12 h-12 text-amber-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Quote Wizard</h3>
            <p className="text-gray-600 text-sm">
              Step-by-step travel quote builder with flights, hotels, and activities
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <Clock className="w-12 h-12 text-violet-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Travel Items</h3>
            <p className="text-gray-600 text-sm">
              Color-coded flights, hotels, activities, and transfers management
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8">
            Get Started
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/contacts">
              <Button size="lg" className="w-full sm:w-auto">
                <Users className="w-5 h-5 mr-2" />
                Manage Contacts
              </Button>
            </Link>
            <Link href="/quotes">
              <Button size="lg" className="w-full sm:w-auto">
                <FileText className="w-5 h-5 mr-2" />
                View Quotes
              </Button>
            </Link>
            <Link href="/quote-wizard">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <FileText className="w-5 h-5 mr-2" />
                Create Quote
              </Button>
            </Link>
            <Link href="/timeline">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <Calendar className="w-5 h-5 mr-2" />
                View Timeline
              </Button>
            </Link>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-16 bg-white rounded-lg p-8 shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
            Built With Modern Technology
          </h3>
          <div className="flex flex-wrap justify-center items-center space-x-8 text-sm text-gray-600">
            <span className="bg-black text-white px-3 py-1 rounded">Next.js 15.5</span>
            <span className="bg-blue-600 text-white px-3 py-1 rounded">React 19</span>
            <span className="bg-blue-800 text-white px-3 py-1 rounded">TypeScript</span>
            <span className="bg-green-600 text-white px-3 py-1 rounded">react-big-calendar</span>
            <span className="bg-cyan-500 text-white px-3 py-1 rounded">Tailwind CSS v3</span>
            <span className="bg-orange-500 text-white px-3 py-1 rounded">Zustand</span>
          </div>
        </div>
      </div>
    </div>
  );
}
