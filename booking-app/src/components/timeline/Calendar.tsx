'use client';

import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import { useState, useMemo } from 'react';
import { useQuoteStore } from '@/store/quote-store';
import { CalendarEvent } from '@/types';
import { getTravelItemColor } from '@/lib/utils';
import { downloadICSFile } from '@/lib/calendar-export';
import { Button } from '@/components/ui/button';
import { Download, CalendarPlus } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface TimelineCalendarProps {
  contactId?: string;
  height?: number;
}

export function TimelineCalendar({ contactId, height = 600 }: TimelineCalendarProps) {
  const [view, setView] = useState<View>('week');
  const [date, setDate] = useState(new Date());
  const { getCalendarEvents, quotes } = useQuoteStore();

  const events = useMemo(() => {
    return getCalendarEvents(contactId);
  }, [getCalendarEvents, contactId]);

  const handleExportAll = () => {
    // Create a consolidated quote with all travel items for export
    const filteredQuotes = contactId 
      ? quotes.filter(quote => quote.contactId === contactId)
      : quotes;
    
    if (filteredQuotes.length === 0) return;
    
    // Create a master quote with all items
    const allItems = filteredQuotes.flatMap(quote => quote.items);
    const consolidatedQuote = {
      id: 'consolidated-travel-calendar',
      title: contactId ? 'My Travel Calendar' : 'All Travel Bookings',
      items: allItems,
      totalCost: allItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      contactId: contactId || 'all',
      status: 'sent' as const,
      travelDates: {
        start: allItems.length > 0 ? new Date(Math.min(...allItems.map(item => new Date(item.startDate).getTime()))) : new Date(),
        end: allItems.length > 0 ? new Date(Math.max(...allItems.map(item => new Date(item.endDate || item.startDate).getTime()))) : new Date(),
      },
      createdAt: new Date(),
    };
    
    downloadICSFile(consolidatedQuote);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const backgroundColor = event.resource 
      ? getTravelItemColor(event.resource.type)
      : '#6B7280';
    
    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '12px',
        padding: '2px 6px',
      },
    };
  };

  const CustomEvent = ({ event }: { event: CalendarEvent }) => {
    const isApiItem = event.resource?.source === 'api';
    const apiProvider = event.resource?.apiProvider;

    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              backgroundColor: event.resource
                ? getTravelItemColor(event.resource.type)
                : '#6B7280'
            }}
          />
          {isApiItem && (
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-blue-400"
              title={`API sourced from ${apiProvider || 'external provider'}`}
            />
          )}
        </div>
        <span className="truncate text-xs">{event.title}</span>
        {isApiItem && (
          <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded uppercase font-medium">
            API
          </span>
        )}
      </div>
    );
  };

  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
      toolbar.onNavigate('NEXT');
    };

    const goToCurrent = () => {
      toolbar.onNavigate('TODAY');
    };

    const label = () => {
      const date = moment(toolbar.date);
      return (
        <span className="text-lg font-semibold">
          {date.format('MMMM YYYY')}
        </span>
      );
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <button
              onClick={goToBack}
              className="px-3 py-1 bg-white border rounded-md hover:bg-gray-50"
            >
              ←
            </button>
            <button
              onClick={goToCurrent}
              className="px-3 py-1 bg-white border rounded-md hover:bg-gray-50"
            >
              Today
            </button>
            <button
              onClick={goToNext}
              className="px-3 py-1 bg-white border rounded-md hover:bg-gray-50"
            >
              →
            </button>
          </div>

          <div>{label()}</div>

          <div className="flex items-center space-x-1">
            {['month', 'week', 'day', 'agenda'].map((viewName) => (
              <button
                key={viewName}
                onClick={() => toolbar.onView(viewName)}
                className={`px-3 py-1 rounded-md text-sm capitalize ${
                  toolbar.view === viewName
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border hover:bg-gray-50'
                }`}
              >
                {viewName}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            Export your travel calendar to use with Google Calendar, Apple Calendar, or Outlook
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAll}
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              <Download className="w-4 h-4 mr-1" />
              Export All (.ics)
            </Button>
            <Button
              variant="outline"  
              size="sm"
              onClick={() => window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Travel Schedule')}&details=${encodeURIComponent('Your travel bookings and itinerary')}`, '_blank')}
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              <CalendarPlus className="w-4 h-4 mr-1" />
              Add to Google Calendar
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height }}
        view={view}
        date={date}
        onView={(view) => setView(view)}
        onNavigate={(date) => setDate(date)}
        eventPropGetter={eventStyleGetter}
        components={{
          event: CustomEvent,
          toolbar: CustomToolbar,
        }}
        views={['month', 'week', 'day', 'agenda']}
        step={60}
        showMultiDayTimes
        defaultView="week"
        className="bg-white rounded-lg shadow-sm"
      />
    </div>
  );
}