'use client';

import { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { Calendar, momentLocalizer, View, SlotInfo } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import { TravelQuote, TravelItem, CalendarEvent } from '@/types';
import { useQuoteStore } from '@/store/quote-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, getTravelItemColor } from '@/lib/utils';
import { Plane, Hotel, MapPin, Car, Calendar as CalendarIcon, X } from 'lucide-react';
import { FlightBuilder } from '@/components/item-builders/FlightBuilder';
import { HotelBuilder } from '@/components/item-builders/HotelBuilder';
import { EditItemModal } from '@/components/item-editors/EditItemModal';
import { QuickEditPopover } from '@/components/item-editors/QuickEditPopover';
import { TravelListView } from './TravelListView';
import { FilterControls } from './FilterControls';
import { TimelineNavigation } from './TimelineNavigation';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(Calendar);

interface TravelItemsProps {
  quote: TravelQuote;
  onComplete: () => void;
}

export function TravelItems({ quote, onComplete }: TravelItemsProps) {
  const { addItemToQuote, removeItemFromQuote, updateItemInQuote } = useQuoteStore();
  const [view, setView] = useState<View>('month'); // Default to month view for better overview
  const [date, setDate] = useState(new Date(quote.travelDates.start));
  const [showForm, setShowForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [itemType, setItemType] = useState<'flight' | 'hotel' | 'activity' | 'transfer'>('flight');
  const [showFlightBuilder, setShowFlightBuilder] = useState(false);
  const [showHotelBuilder, setShowHotelBuilder] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [filteredItems, setFilteredItems] = useState<TravelItem[]>([]);
  
  // Edit functionality
  const [editingItem, setEditingItem] = useState<TravelItem | null>(null);
  const [quickEditItem, setQuickEditItem] = useState<TravelItem | null>(null);
  const [quickEditPosition, setQuickEditPosition] = useState<{ x: number; y: number } | null>(null);

  const currentQuote = useQuoteStore(state => 
    state.quotes.find(q => q.id === quote.id)
  ) || quote;

  // Use filtered items if available, otherwise use all items
  const displayItems = filteredItems.length > 0 || currentQuote.items.length === 0 ? filteredItems : currentQuote.items;

  // Calculate dynamic calendar height based on viewport and responsive breakpoints
  const calculateCalendarHeight = useMemo(() => {
    if (typeof window === 'undefined') return 700; // SSR fallback
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Responsive breakpoints with different height strategies
    let baseHeight: number;
    let maxHeight: number;
    let viewportPercentage: number;
    
    if (viewportWidth >= 1280) {
      // Desktop - Large calendar
      baseHeight = 700;
      maxHeight = 1200;
      viewportPercentage = 0.85;
    } else if (viewportWidth >= 768) {
      // Tablet - Medium calendar
      baseHeight = 600;
      maxHeight = 900;
      viewportPercentage = 0.8;
    } else {
      // Mobile - Compact calendar
      baseHeight = 500;
      maxHeight = 600;
      viewportPercentage = 0.75;
    }
    
    // Use viewport height as primary constraint
    const viewportBasedHeight = viewportHeight * viewportPercentage;
    
    // Item density adjustment (minimal impact)
    const itemCount = currentQuote.items.length;
    const itemAdjustment = Math.min(itemCount * 15, 100); // Max 100px adjustment
    
    const calculatedHeight = Math.min(
      maxHeight,
      Math.max(baseHeight, viewportBasedHeight + itemAdjustment)
    );
    
    return Math.floor(calculatedHeight);
  }, [currentQuote.items.length]);

  // Detect overlapping events for smart positioning
  const detectOverlappingEvents = useCallback((events: CalendarEvent[]) => {
    const overlaps = new Map<string, number>();
    
    events.forEach((event, index) => {
      let overlapCount = 0;
      events.forEach((otherEvent, otherIndex) => {
        if (index !== otherIndex) {
          const eventStart = event.start.getTime();
          const eventEnd = event.end.getTime();
          const otherStart = otherEvent.start.getTime();
          const otherEnd = otherEvent.end.getTime();
          
          // Check for overlap
          if ((eventStart < otherEnd && eventEnd > otherStart)) {
            overlapCount++;
          }
        }
      });
      overlaps.set(event.id, overlapCount);
    });
    
    return overlaps;
  }, []);

  // Ensure calendar is focused on travel dates
  useEffect(() => {
    const travelStartDate = new Date(quote.travelDates.start);
    if (date.getTime() !== travelStartDate.getTime()) {
      setDate(travelStartDate);
    }
  }, [quote.travelDates.start, date]);

  // Convert travel items to calendar events (using filtered items)
  const events = useMemo(() => {
    return displayItems.map(item => {
      const startDate = new Date(item.startDate);
      const endDate = new Date(item.endDate || item.startDate);
      
      // Add default times based on item type if no time is specified
      if (startDate.getHours() === 0 && startDate.getMinutes() === 0) {
        switch (item.type) {
          case 'flight':
            startDate.setHours(8, 0); // 8:00 AM
            endDate.setHours(10, 0);  // 10:00 AM
            break;
          case 'hotel':
            startDate.setHours(15, 0); // 3:00 PM check-in
            endDate.setHours(11, 0);   // 11:00 AM check-out (next day)
            break;
          case 'activity':
            startDate.setHours(10, 0); // 10:00 AM
            endDate.setHours(12, 0);   // 12:00 PM
            break;
          case 'transfer':
            startDate.setHours(9, 0);  // 9:00 AM
            endDate.setHours(10, 0);   // 10:00 AM
            break;
          default:
            startDate.setHours(9, 0);
            endDate.setHours(10, 0);
        }
      }
      
      return {
        id: item.id,
        title: item.name,
        start: startDate,
        end: endDate,
        resource: {
          type: item.type,
          contactId: quote.contactId,
          quoteId: quote.id,
          details: { ...item.details, price: item.price, quantity: item.quantity },
        },
      };
    }) as CalendarEvent[];
  }, [displayItems, quote.contactId, quote.id]);

  // Handle slot selection (clicking empty calendar space)
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setSelectedSlot(slotInfo);
    setShowForm(true);
  }, []);

  // Handle event selection (clicking existing event)
  const handleSelectEvent = useCallback((event: CalendarEvent, e: React.SyntheticEvent) => {
    const item = currentQuote.items.find(item => item.id === event.id);
    if (!item) return;

    // Get click position for popover - use the actual mouse event if available
    const mouseEvent = e.nativeEvent as MouseEvent;
    const position = {
      x: mouseEvent.clientX || mouseEvent.pageX || window.innerWidth / 2,
      y: mouseEvent.clientY || mouseEvent.pageY || 100,
    };

    setQuickEditItem(item);
    setQuickEditPosition(position);
  }, [currentQuote.items]);

  // Handle event drag and drop with debouncing for better performance
  const handleEventDrop = useCallback(({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
    const item = currentQuote.items.find(item => item.id === event.id);
    if (item) {
      // Preserve the original time when moving dates
      const originalStart = new Date(item.startDate);
      const originalEnd = item.endDate ? new Date(item.endDate) : null;
      
      // Calculate the time difference
      const timeDiff = end.getTime() - start.getTime();
      
      // Apply the same time to the new date
      const newStart = new Date(start);
      newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
      
      const newEnd = originalEnd ? new Date(newStart.getTime() + timeDiff) : undefined;
      
      updateItemInQuote(quote.id, event.id, {
        startDate: newStart.toISOString(),
        endDate: newEnd ? newEnd.toISOString() : undefined,
      });
      
      // Show a brief confirmation
      const itemName = item.name;
      const newDate = newStart.toLocaleDateString();
      const newTime = newStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // You could add a toast notification here
      // Batched update for better performance
      console.log(`${itemName} moved to ${newDate} at ${newTime}`);
    }
  }, [currentQuote.items, quote.id, updateItemInQuote]);

  // Handle event resize
  const handleEventResize = useCallback(({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
    const item = currentQuote.items.find(item => item.id === event.id);
    if (item) {
      updateItemInQuote(quote.id, event.id, {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });
      
      // Show resize confirmation
      const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
      console.log(`${item.name} duration changed to ${duration} minutes`);
    }
  }, [currentQuote.items, quote.id, updateItemInQuote]);

  // Enhanced event styling with smart positioning
  const eventStyleGetter = (event: CalendarEvent) => {
    const backgroundColor = event.resource 
      ? getTravelItemColor(event.resource.type)
      : '#6B7280';
    
    // Get overlap information for this event
    const overlaps = detectOverlappingEvents(events);
    const overlapCount = overlaps.get(event.id) || 0;
    const horizontalOffset = Math.min(overlapCount * 10, 30); // Max 30px offset
    
    return {
      style: {
        backgroundColor,
        borderRadius: '8px',
        opacity: 0.95,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        padding: '4px 8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: `${horizontalOffset}px 2px 8px rgba(0,0,0,0.15)`,
        transform: overlapCount > 0 ? `translateX(${horizontalOffset}px)` : 'none',
        zIndex: overlapCount > 0 ? 10 + overlapCount : 'auto',
      },
    };
  };

  // Add new travel item
  const handleAddItem = (itemData: Omit<TravelItem, 'id'>) => {
    addItemToQuote(quote.id, itemData);
    setShowForm(false);
    setSelectedSlot(null);
  };

  // Handle quick edit save
  const handleQuickEditSave = (updates: Partial<TravelItem>) => {
    if (!quickEditItem) return;
    updateItemInQuote(quote.id, quickEditItem.id, updates);
    setQuickEditItem(null);
    setQuickEditPosition(null);
  };

  // Handle full edit save
  const handleFullEditSave = (updates: Partial<TravelItem>) => {
    if (!editingItem) return;
    updateItemInQuote(quote.id, editingItem.id, updates);
    setEditingItem(null);
  };

  // Handle item deletion
  const handleDeleteItem = () => {
    if (!editingItem) return;
    removeItemFromQuote(quote.id, editingItem.id);
    setEditingItem(null);
  };

  // Simplified Custom Toolbar (only calendar navigation)
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
        <span className="text-lg font-semibold text-gray-900">
          {date.format('MMMM YYYY')}
        </span>
      );
    };

    return (
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center space-x-2">
          <button
            onClick={goToBack}
            className="px-3 py-1.5 bg-white border rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            ←
          </button>
          <button
            onClick={goToCurrent}
            className="px-3 py-1.5 bg-white border rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Today
          </button>
          <button
            onClick={goToNext}
            className="px-3 py-1.5 bg-white border rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            →
          </button>
        </div>

        <div>{label()}</div>

        {/* Spacer for balanced layout */}
        <div className="w-20"></div>
      </div>
    );
  };

  // Custom Event Component (based on TimelineCalendar)
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

  // Enhanced event component with overlap indicator (memoized for performance)
  const EventComponent = memo(({ event }: { event: CalendarEvent }) => {
    const item = currentQuote.items.find(item => item.id === event.id);
    if (!item) return <div>{event.title}</div>;
    
    const overlaps = detectOverlappingEvents(events);
    const overlapCount = overlaps.get(event.id) || 0;
    
    return (
      <div className="relative group h-full">
        <div className="flex items-center justify-between h-full p-1">
          <div className="flex items-center space-x-1 flex-1 min-w-0">
            <div className="w-2 h-2 rounded-full bg-white opacity-80 flex-shrink-0" />
            <div className="truncate text-xs font-medium">{event.title}</div>
          </div>
          <div className="text-xs font-semibold text-white opacity-75 ml-1 flex-shrink-0">
            {formatCurrency(item.price * item.quantity)}
          </div>
          {overlapCount > 2 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
              +{overlapCount - 1}
            </div>
          )}
        </div>
        
        {/* Hover overlay with edit hint */}
        <div className="absolute inset-0 bg-black bg-opacity-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-xs text-white font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
            Click to edit
          </span>
        </div>
        
        {/* Enhanced resize handles for better interaction */}
        <div className="absolute top-0 left-0 w-2 h-full bg-white opacity-0 group-hover:opacity-60 cursor-ew-resize rounded-l" />
        <div className="absolute top-0 right-0 w-2 h-full bg-white opacity-0 group-hover:opacity-60 cursor-ew-resize rounded-r" />
      </div>
    );
  });

  // Floating action buttons for quick add
  const getItemIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="w-4 h-4" />;
      case 'hotel': return <Hotel className="w-4 h-4" />;
      case 'activity': return <MapPin className="w-4 h-4" />;
      case 'transfer': return <Car className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Travel Timeline
          </h2>
          <p className="text-gray-600">
            <span className="font-medium">Interactive Calendar:</span> Click to add • Drag to move • Resize to adjust duration • Click items to edit
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            {moment(quote.travelDates.start).format('MMM D')} - {moment(quote.travelDates.end).format('MMM D, YYYY')}
          </span>
        </div>
      </div>

      {/* Filter Controls */}
      <FilterControls
        items={currentQuote.items}
        onFilterChange={setFilteredItems}
        className="mb-4"
      />

      {/* Quick Add Buttons */}
      <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg border mb-4">
        <span className="text-sm font-medium text-gray-700">Quick Add:</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowFlightBuilder(true)}
          className="flex items-center space-x-1"
        >
          <Plane className="w-4 h-4" />
          <span>Flight</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowHotelBuilder(true)}
          className="flex items-center space-x-1"
        >
          <Hotel className="w-4 h-4" />
          <span>Hotel</span>
        </Button>
        {(['activity', 'transfer'] as const).map((type) => (
          <Button
            key={type}
            size="sm"
            variant="outline"
            onClick={() => {
              setItemType(type);
              const startDate = new Date(quote.travelDates.start);
              setSelectedSlot({
                start: startDate,
                end: startDate,
                slots: [],
                action: 'select'
              });
              setShowForm(true);
            }}
            className="flex items-center space-x-1"
          >
            {getItemIcon(type)}
            <span className="capitalize">{type}</span>
          </Button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="w-full">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {/* Persistent Navigation */}
          <TimelineNavigation
            viewMode={viewMode}
            calendarView={view}
            onViewModeChange={setViewMode}
            onCalendarViewChange={setView}
          />

          {/* Timeline Content */}
          {viewMode === 'calendar' ? (
            <div className="p-4">
              <DragAndDropCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: calculateCalendarHeight }}
                view={view}
                date={date}
                onView={(view) => setView(view)}
                onNavigate={(date) => setDate(date)}
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                onEventDrop={handleEventDrop}
                onEventResize={handleEventResize}
                selectable
                resizable
                eventPropGetter={eventStyleGetter}
                components={{
                  event: EventComponent,
                  toolbar: CustomToolbar,
                }}
                views={['month', 'week', 'day', 'agenda']}
                defaultView="month"
                step={60}
                showMultiDayTimes
                className="bg-white rounded-lg"
                tooltipAccessor={(event: CalendarEvent) => {
                  const item = currentQuote.items.find(item => item.id === event.id);
                  if (!item) return event.title;
                  return `${event.title}\n${formatCurrency(item.price * item.quantity)}\nClick to edit • Drag to move`;
                }}
              />
            </div>
          ) : (
            <div className="p-6">
              <TravelListView
                quote={quote}
                onEditItem={(item) => setEditingItem(item)}
                onDeleteItem={(itemId) => {
                  if (confirm('Remove this item?')) {
                    removeItemFromQuote(quote.id, itemId);
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Floating Summary Bar */}
      {currentQuote.items.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-1 rounded-full">
                {currentQuote.items.length} item{currentQuote.items.length !== 1 ? 's' : ''}
              </div>
              <span className="text-gray-600 text-sm">added to quote</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm text-gray-600">Total</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(currentQuote.totalCost)}
                </div>
              </div>
              <Button onClick={onComplete} className="min-w-[140px]">
                Continue to Review
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom padding to prevent content overlap */}
      {currentQuote.items.length > 0 && <div className="h-20" />}

      {/* Add Item Form Modal */}
      {showForm && selectedSlot && itemType !== 'flight' && itemType !== 'hotel' && (
        <QuickItemForm
          itemType={itemType}
          selectedSlot={selectedSlot}
          onSubmit={handleAddItem}
          onCancel={() => {
            setShowForm(false);
            setSelectedSlot(null);
          }}
        />
      )}

      {/* Flight Builder Modal */}
      {showFlightBuilder && (
        <FlightBuilder
          onSubmit={(flightData) => {
            handleAddItem(flightData);
            setShowFlightBuilder(false);
          }}
          onCancel={() => setShowFlightBuilder(false)}
          tripStartDate={new Date(quote.travelDates.start)}
          tripEndDate={new Date(quote.travelDates.end)}
        />
      )}

      {/* Hotel Builder Modal */}
      {showHotelBuilder && (
        <HotelBuilder
          onSubmit={(hotelData) => {
            handleAddItem(hotelData);
            setShowHotelBuilder(false);
          }}
          onCancel={() => setShowHotelBuilder(false)}
          tripStartDate={new Date(quote.travelDates.start)}
          tripEndDate={new Date(quote.travelDates.end)}
        />
      )}

      {/* Quick Edit Popover */}
      {quickEditItem && quickEditPosition && (
        <QuickEditPopover
          item={quickEditItem}
          position={quickEditPosition}
          onSave={handleQuickEditSave}
          onCancel={() => {
            setQuickEditItem(null);
            setQuickEditPosition(null);
          }}
          onFullEdit={() => {
            setEditingItem(quickEditItem);
            setQuickEditItem(null);
            setQuickEditPosition(null);
          }}
        />
      )}

      {/* Full Edit Modal */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          onSave={handleFullEditSave}
          onDelete={handleDeleteItem}
          onCancel={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}

interface QuickItemFormProps {
  itemType: 'flight' | 'hotel' | 'activity' | 'transfer';
  selectedSlot: SlotInfo;
  onSubmit: (item: Omit<TravelItem, 'id'>) => void;
  onCancel: () => void;
}

function QuickItemForm({ itemType, selectedSlot, onSubmit, onCancel }: QuickItemFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    startDate: moment(selectedSlot.start).format('YYYY-MM-DD'),
    endDate: moment(selectedSlot.end).format('YYYY-MM-DD'),
    startTime: moment(selectedSlot.start).format('HH:mm'),
    endTime: moment(selectedSlot.end).format('HH:mm'),
    price: '',
    quantity: '1',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine date and time for proper datetime
    const startDateTime = moment(`${formData.startDate} ${formData.startTime}`).toISOString();
    const endDateTime = formData.endDate && formData.endTime 
      ? moment(`${formData.endDate} ${formData.endTime}`).toISOString()
      : undefined;
    
    onSubmit({
      type: itemType,
      name: formData.name,
      startDate: startDateTime,
      endDate: endDateTime,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      details: {},
    });
  };

  const getPlaceholder = () => {
    switch (itemType) {
      case 'flight': return 'e.g., Flight to London';
      case 'hotel': return 'e.g., Marriott Downtown';
      case 'activity': return 'e.g., City Walking Tour';
      case 'transfer': return 'e.g., Airport Transfer';
      default: return 'Enter item name';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4 capitalize flex items-center space-x-2">
          <div style={{ color: getTravelItemColor(itemType) }}>
            {itemType === 'flight' && <Plane className="w-5 h-5" />}
            {itemType === 'hotel' && <Hotel className="w-5 h-5" />}
            {itemType === 'activity' && <MapPin className="w-5 h-5" />}
            {itemType === 'transfer' && <Car className="w-5 h-5" />}
          </div>
          <span>Add {itemType}</span>
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={getPlaceholder()}
              autoFocus
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">End Date {itemType !== 'hotel' && '(Optional)'}</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                required={itemType === 'hotel'}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="endTime">End Time {itemType !== 'hotel' && '(Optional)'}</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                required={itemType === 'hotel'}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="capitalize">
              Add {itemType}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}