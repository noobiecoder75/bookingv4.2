'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Calendar, momentLocalizer, View, SlotInfo } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import { TravelQuote, TravelItem, CalendarEvent } from '@/types';
import { useQuoteStore } from '@/store/quote-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, getTravelItemColor } from '@/lib/utils';
import { Plane, Hotel, MapPin, Car, Calendar as CalendarIcon } from 'lucide-react';
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
  const [view, setView] = useState<View>('week');
  const [date, setDate] = useState(new Date(quote.travelDates.start));
  const [showForm, setShowForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [itemType, setItemType] = useState<'flight' | 'hotel' | 'activity' | 'transfer'>('flight');

  const currentQuote = useQuoteStore(state => 
    state.quotes.find(q => q.id === quote.id)
  ) || quote;

  // Ensure calendar is focused on travel dates
  useEffect(() => {
    const travelStartDate = new Date(quote.travelDates.start);
    if (date.getTime() !== travelStartDate.getTime()) {
      setDate(travelStartDate);
    }
  }, [quote.travelDates.start, date]);

  // Convert travel items to calendar events
  const events = useMemo(() => {
    return currentQuote.items.map(item => {
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
  }, [currentQuote.items, quote.contactId, quote.id]);

  // Handle slot selection (clicking empty calendar space)
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setSelectedSlot(slotInfo);
    setShowForm(true);
  }, []);

  // Handle event selection (clicking existing event)
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    if (confirm(`Remove ${event.title}?`)) {
      removeItemFromQuote(quote.id, event.id);
    }
  }, [removeItemFromQuote, quote.id]);

  // Handle event drag and drop
  const handleEventDrop = useCallback(({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
    const item = currentQuote.items.find(item => item.id === event.id);
    if (item) {
      updateItemInQuote(quote.id, event.id, {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      });
    }
  }, [currentQuote.items, quote.id, updateItemInQuote]);

  // Event styling
  const eventStyleGetter = (event: CalendarEvent) => {
    const backgroundColor = event.resource 
      ? getTravelItemColor(event.resource.type)
      : '#6B7280';
    
    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '12px',
        padding: '2px 6px',
      },
    };
  };

  // Add new travel item
  const handleAddItem = (itemData: Omit<TravelItem, 'id'>) => {
    addItemToQuote(quote.id, itemData);
    setShowForm(false);
    setSelectedSlot(null);
  };

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <div className="flex items-center space-x-1">
      <div className="w-2 h-2 rounded-full bg-white opacity-80" />
      <span className="truncate text-xs font-medium">{event.title}</span>
      {event.resource?.details?.price && (
        <span className="text-xs opacity-75">
          ${event.resource.details.price}
        </span>
      )}
    </div>
  );

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Travel Timeline
          </h2>
          <p className="text-gray-600">
            Click on the calendar to add flights, hotels, activities, and transfers
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            {moment(quote.travelDates.start).format('MMM D')} - {moment(quote.travelDates.end).format('MMM D, YYYY')}
          </span>
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg border">
        <span className="text-sm font-medium text-gray-700">Quick Add:</span>
        {(['flight', 'hotel', 'activity', 'transfer'] as const).map((type) => (
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

      {/* Calendar Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <DragAndDropCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          view={view}
          date={date}
          onView={(view) => setView(view)}
          onNavigate={(date) => setDate(date)}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventDrop}
          selectable
          resizable
          eventPropGetter={eventStyleGetter}
          components={{
            event: EventComponent,
          }}
          views={['month', 'week', 'day']}
          defaultView="week"
          min={moment().hour(6).minute(0).toDate()}
          max={moment().hour(22).minute(0).toDate()}
          step={60}
          timeslots={1}
          showMultiDayTimes
        />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-6">
        {/* Items Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Items Added ({currentQuote.items.length})</h4>
          {currentQuote.items.length > 0 ? (
            <div className="space-y-2">
              {currentQuote.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div style={{ color: getTravelItemColor(item.type) }}>
                      {getItemIcon(item.type)}
                    </div>
                    <span className="truncate">{item.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Click on the calendar to add items</p>
          )}
        </div>

        {/* Total */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Quote Total</h4>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(currentQuote.totalCost)}
          </div>
          {currentQuote.items.length > 0 && (
            <div className="mt-3">
              <Button onClick={onComplete} size="lg" className="w-full">
                Continue to Review
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add Item Form Modal */}
      {showForm && selectedSlot && (
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