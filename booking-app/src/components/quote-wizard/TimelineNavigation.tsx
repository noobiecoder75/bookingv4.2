'use client';

import { View } from 'react-big-calendar';
import { Calendar, List, Maximize2 } from 'lucide-react';

interface TimelineNavigationProps {
  viewMode: 'calendar' | 'list';
  calendarView: View;
  onViewModeChange: (mode: 'calendar' | 'list') => void;
  onCalendarViewChange: (view: View) => void;
}

export function TimelineNavigation({
  viewMode,
  calendarView,
  onViewModeChange,
  onCalendarViewChange
}: TimelineNavigationProps) {
  return (
    <div className="flex items-center justify-center p-4 bg-white border-b border-gray-200 rounded-t-lg">
      {/* View Mode Toggle */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('calendar')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'calendar'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <List className="w-4 h-4" />
            <span>List</span>
          </button>
        </div>

        {/* Calendar View Controls (only show when in calendar mode) */}
        {viewMode === 'calendar' && (
          <div className="flex items-center space-x-1">
            {(['month', 'week', 'day', 'agenda'] as View[]).map((view) => (
              <button
                key={view}
                onClick={() => onCalendarViewChange(view)}
                className={`px-3 py-2 rounded-md text-sm font-medium capitalize transition-all ${
                  calendarView === view
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}