import { TravelItem } from '@/types';

/**
 * Formats travel item details into human-readable descriptions for invoices
 * Handles different item types with specific formatting logic
 */
export function formatItemDetails(item: TravelItem): string {
  if (!item.details || typeof item.details !== 'object') {
    return '';
  }

  const details = item.details as Record<string, any>;

  switch (item.type) {
    case 'flight':
      return formatFlightDetails(details);

    case 'hotel':
      return formatHotelDetails(details, item.startDate, item.endDate);

    case 'activity':
      return formatActivityDetails(details);

    case 'transfer':
      return formatTransferDetails(details);

    default:
      return formatGenericDetails(details);
  }
}

/**
 * Format flight-specific details
 */
function formatFlightDetails(details: Record<string, any>): string {
  const parts: string[] = [];

  // Departure information
  if (details.departureTime || details.departure_time) {
    const depTime = details.departureTime || details.departure_time;
    parts.push(`Departure: ${formatTime(depTime)}`);
  }

  // Arrival information
  if (details.arrivalTime || details.arrival_time) {
    const arrTime = details.arrivalTime || details.arrival_time;
    parts.push(`Arrival: ${formatTime(arrTime)}`);
  }

  // Flight number
  if (details.flightNumber || details.flight_number) {
    const flightNum = details.flightNumber || details.flight_number;
    parts.push(`Flight: ${flightNum}`);
  }

  // Airline
  if (details.airline) {
    parts.push(`${details.airline}`);
  }

  // Aircraft type
  if (details.aircraft) {
    parts.push(`Aircraft: ${details.aircraft}`);
  }

  // Class of service
  if (details.class || details.serviceClass) {
    const serviceClass = details.class || details.serviceClass;
    parts.push(`Class: ${serviceClass}`);
  }

  return parts.length > 0 ? parts.join(', ') : '';
}

/**
 * Format hotel-specific details
 */
function formatHotelDetails(details: Record<string, any>, startDate?: string, endDate?: string): string {
  const parts: string[] = [];

  // Check-in/Check-out dates
  const checkIn = details.checkIn || details.check_in || startDate;
  const checkOut = details.checkOut || details.check_out || endDate;

  if (checkIn && checkOut) {
    const nights = calculateNights(checkIn, checkOut);
    parts.push(`Check-in: ${formatDate(checkIn)}`);
    parts.push(`Check-out: ${formatDate(checkOut)}`);
    if (nights > 0) {
      parts.push(`${nights} night${nights !== 1 ? 's' : ''}`);
    }
  } else if (checkIn) {
    parts.push(`Check-in: ${formatDate(checkIn)}`);
  }

  // Room type
  if (details.roomType || details.room_type) {
    const roomType = details.roomType || details.room_type;
    parts.push(`Room: ${roomType}`);
  }

  // Number of rooms
  if (details.rooms && details.rooms > 1) {
    parts.push(`${details.rooms} rooms`);
  }

  // Number of guests
  if (details.guests || details.occupancy) {
    const guests = details.guests || details.occupancy;
    parts.push(`${guests} guest${guests !== 1 ? 's' : ''}`);
  }

  // Hotel rating
  if (details.rating || details.stars) {
    const rating = details.rating || details.stars;
    parts.push(`${rating}-star`);
  }

  // Amenities (limit to most important ones)
  if (details.amenities && Array.isArray(details.amenities)) {
    const importantAmenities = details.amenities
      .filter((amenity: string) =>
        ['wifi', 'breakfast', 'parking', 'pool', 'gym', 'spa'].includes(amenity.toLowerCase())
      )
      .slice(0, 2);

    if (importantAmenities.length > 0) {
      parts.push(`Includes: ${importantAmenities.join(', ')}`);
    }
  }

  return parts.length > 0 ? parts.join(', ') : '';
}

/**
 * Format activity-specific details
 */
function formatActivityDetails(details: Record<string, any>): string {
  const parts: string[] = [];

  // Duration
  if (details.duration) {
    parts.push(`Duration: ${details.duration}`);
  }

  // Time
  if (details.time || details.startTime) {
    const time = details.time || details.startTime;
    parts.push(`Time: ${formatTime(time)}`);
  }

  // Location
  if (details.location || details.meetingPoint) {
    const location = details.location || details.meetingPoint;
    parts.push(`Location: ${location}`);
  }

  // Group size
  if (details.groupSize || details.maxParticipants) {
    const size = details.groupSize || details.maxParticipants;
    parts.push(`Max ${size} people`);
  }

  // Difficulty level
  if (details.difficulty) {
    parts.push(`Difficulty: ${details.difficulty}`);
  }

  // Includes
  if (details.includes && Array.isArray(details.includes)) {
    const included = details.includes.slice(0, 2).join(', ');
    parts.push(`Includes: ${included}`);
  }

  return parts.length > 0 ? parts.join(', ') : '';
}

/**
 * Format transfer-specific details
 */
function formatTransferDetails(details: Record<string, any>): string {
  const parts: string[] = [];

  // Pickup location
  if (details.pickupLocation || details.pickup) {
    const pickup = details.pickupLocation || details.pickup;
    parts.push(`Pickup: ${pickup}`);
  }

  // Dropoff location
  if (details.dropoffLocation || details.dropoff || details.destination) {
    const dropoff = details.dropoffLocation || details.dropoff || details.destination;
    parts.push(`Dropoff: ${dropoff}`);
  }

  // Pickup time
  if (details.pickupTime || details.time) {
    const time = details.pickupTime || details.time;
    parts.push(`Time: ${formatTime(time)}`);
  }

  // Vehicle type
  if (details.vehicleType || details.vehicle) {
    const vehicle = details.vehicleType || details.vehicle;
    parts.push(`Vehicle: ${vehicle}`);
  }

  // Duration
  if (details.duration || details.estimatedDuration) {
    const duration = details.duration || details.estimatedDuration;
    parts.push(`Duration: ${duration}`);
  }

  // Passengers
  if (details.passengers && details.passengers > 1) {
    parts.push(`${details.passengers} passengers`);
  }

  return parts.length > 0 ? parts.join(', ') : '';
}

/**
 * Format generic details for unknown item types
 */
function formatGenericDetails(details: Record<string, any>): string {
  const parts: string[] = [];

  // Look for common fields that might be useful
  const commonFields = ['description', 'notes', 'location', 'time', 'duration'];

  for (const field of commonFields) {
    if (details[field] && typeof details[field] === 'string') {
      parts.push(details[field]);
      break; // Only take the first useful field to keep it concise
    }
  }

  // If no common fields found, try to extract any string values
  if (parts.length === 0) {
    const stringValues = Object.values(details)
      .filter(value => typeof value === 'string' && value.length > 0 && value.length < 100)
      .slice(0, 1); // Only take the first one

    parts.push(...stringValues);
  }

  return parts.length > 0 ? parts.join(', ') : '';
}

/**
 * Helper function to format time strings
 */
function formatTime(time: string | Date): string {
  if (!time) return '';

  try {
    const date = typeof time === 'string' ? new Date(time) : time;

    // If it's a valid date, format it nicely
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }

    // If it's already a formatted time string, return as is
    return time.toString();
  } catch {
    return time.toString();
  }
}

/**
 * Helper function to format date strings
 */
function formatDate(date: string | Date): string {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }

    return date.toString();
  } catch {
    return date.toString();
  }
}

/**
 * Helper function to calculate number of nights between dates
 */
function calculateNights(checkIn: string | Date, checkOut: string | Date): number {
  try {
    const checkInDate = typeof checkIn === 'string' ? new Date(checkIn) : checkIn;
    const checkOutDate = typeof checkOut === 'string' ? new Date(checkOut) : checkOut;

    if (!isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime())) {
      const diffTime = checkOutDate.getTime() - checkInDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }

    return 0;
  } catch {
    return 0;
  }
}

export default formatItemDetails;