import ICalCalendar from 'ical-generator';
import { TravelQuote, TravelItem } from '@/types';

export function generateICS(quote: TravelQuote): string {
  const calendar = ICalCalendar({
    name: `Travel Itinerary - ${quote.title}`,
    prodId: '//BookingApp//Travel Calendar//EN',
    timezone: 'UTC',
  });

  quote.items.forEach((item) => {
    const event = calendar.createEvent({
      start: new Date(item.startDate),
      end: item.endDate ? new Date(item.endDate) : new Date(item.startDate),
      summary: `${getItemEmoji(item.type)} ${item.name}`,
      description: generateEventDescription(item, quote),
      location: getItemLocation(item),
    });

    if (item.type === 'flight') {
      event.createAlarm({
        type: 'display',
        trigger: 86400, // 24 hours before
        description: 'Flight reminder - Check in online',
      });
    } else if (item.type === 'hotel') {
      event.createAlarm({
        type: 'display',
        trigger: 3600, // 1 hour before check-in
        description: 'Hotel check-in reminder',
      });
    }
  });

  return calendar.toString();
}

export function generateGoogleCalendarLink(item: TravelItem, quote: TravelQuote): string {
  const startDate = formatGoogleDate(new Date(item.startDate));
  const endDate = item.endDate 
    ? formatGoogleDate(new Date(item.endDate))
    : formatGoogleDate(new Date(item.startDate));
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${getItemEmoji(item.type)} ${item.name}`,
    dates: `${startDate}/${endDate}`,
    details: generateEventDescription(item, quote),
    location: getItemLocation(item) || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadICSFile(quote: TravelQuote): void {
  const icsContent = generateICS(quote);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `travel-itinerary-${quote.id}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function formatGoogleDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function getItemEmoji(type: TravelItem['type']): string {
  const emojis = {
    flight: '✈️',
    hotel: '🏨',
    activity: '🎯',
    transfer: '🚗',
  };
  return emojis[type] || '📅';
}

function generateEventDescription(item: TravelItem, quote: TravelQuote): string {
  const lines = [
    `Booking Reference: ${quote.id}`,
    `Type: ${item.type}`,
    `Price: $${item.price}`,
  ];

  if (item.details) {
    const details = item.details as Record<string, unknown>;
    
    if (item.type === 'flight' && details.flightNumber) {
      lines.push(`Flight: ${details.flightNumber}`);
      lines.push(`From: ${details.departure}`);
      lines.push(`To: ${details.arrival}`);
      if (details.confirmationNumber) {
        lines.push(`Confirmation: ${details.confirmationNumber}`);
      }
    } else if (item.type === 'hotel' && details.hotelName) {
      lines.push(`Hotel: ${details.hotelName}`);
      if (details.roomType) {
        lines.push(`Room: ${details.roomType}`);
      }
      if (details.confirmationNumber) {
        lines.push(`Confirmation: ${details.confirmationNumber}`);
      }
    } else if (item.type === 'activity' && details.description) {
      lines.push(`Activity: ${details.description}`);
      if (details.location) {
        lines.push(`Location: ${details.location}`);
      }
    } else if (item.type === 'transfer') {
      if (details.pickupLocation) {
        lines.push(`Pickup: ${details.pickupLocation}`);
      }
      if (details.dropoffLocation) {
        lines.push(`Dropoff: ${details.dropoffLocation}`);
      }
    }
  }

  return lines.join('\\n');
}

function getItemLocation(item: TravelItem): string | undefined {
  if (!item.details) return undefined;
  
  const details = item.details as Record<string, unknown>;
  
  if (item.type === 'flight') {
    return details.departure || undefined;
  } else if (item.type === 'hotel') {
    return details.address || details.hotelName || undefined;
  } else if (item.type === 'activity') {
    return details.location || undefined;
  } else if (item.type === 'transfer') {
    return details.pickupLocation || undefined;
  }
  
  return undefined;
}