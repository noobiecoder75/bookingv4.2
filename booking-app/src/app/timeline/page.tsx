import { TimelineCalendar } from '@/components/timeline/Calendar';

export default function TimelinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50 to-teal-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Travel Timeline</h1>
          <p className="text-xl text-gray-600">
            View all travel bookings and itineraries in calendar format
          </p>
        </div>
        <div className="glass-card rounded-2xl shadow-medium border-glass p-6">
          <TimelineCalendar height={700} />
        </div>
      </div>
    </div>
  );
}