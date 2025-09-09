'use client';

import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import { useState, useMemo } from 'react';
import { useQuoteStore } from '@/store/quote-store';
import { CalendarEvent } from '@/types';
import { getTravelItemColor } from '@/lib/utils';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface TimelineCalendarProps {
  contactId?: string;
  height?: number;
}

export function TimelineCalendar({ contactId, height = 600 }: TimelineCalendarProps) {
  const [view, setView] = useState<View>('week');
  const [date, setDate] = useState(new Date());
  const { getCalendarEvents } = useQuoteStore();

  const events = useMemo(() => {
    return getCalendarEvents(contactId);
  }, [getCalendarEvents, contactId]);

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

  const CustomEvent = ({ event }: { event: CalendarEvent }) => (
    <div className="flex items-center space-x-2">
      <div 
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ 
          backgroundColor: event.resource 
            ? getTravelItemColor(event.resource.type) 
            : '#6B7280' 
        }}
      />
      <span className="truncate text-xs">{event.title}</span>
    </div>
  );

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
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
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