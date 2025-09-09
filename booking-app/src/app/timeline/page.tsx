import { TimelineCalendar } from '@/components/timeline/Calendar';

export default function TimelinePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Travel Timeline</h1>
        <p className="text-gray-600">
          View all travel bookings and itineraries in calendar format
        </p>
      </div>
      <TimelineCalendar height={700} />
    </div>
  );
}