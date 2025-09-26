export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: Address;
  preferences?: TravelPreferences;
  quotes: string[]; // Quote IDs
  createdAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface TravelPreferences {
  preferredAirlines?: string[];
  seatPreference?: 'aisle' | 'window' | 'middle';
  hotelPreference?: string[];
  budgetRange?: {
    min: number;
    max: number;
  };
}

export interface TravelQuote {
  id: string;
  contactId: string;
  title: string;
  items: TravelItem[];
  totalCost: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  travelDates: { start: Date; end: Date };
  createdAt: Date;
}

export interface TravelItem {
  id: string;
  type: 'flight' | 'hotel' | 'activity' | 'transfer';
  name: string;
  startDate: string;
  endDate?: string;
  price: number;
  quantity: number;
  details: Record<string, unknown>;
}

export interface FlightDetails {
  departure_airport: string;
  arrival_airport: string;
  airline: string;
  flight_number: string;
  departure_time: string;
  arrival_time: string;
}

export interface HotelDetails {
  hotel_name: string;
  location: string;
  room_type: string;
  check_in: string;
  check_out: string;
  nights: number;
}

export interface ActivityDetails {
  location: string;
  duration: number;
  category: string;
  description: string;
}

export interface TransferDetails {
  from: string;
  to: string;
  vehicle_type: string;
  duration: number;
}

// react-big-calendar event interface
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: {
    type: 'flight' | 'hotel' | 'activity' | 'transfer';
    contactId: string;
    quoteId: string;
    details: Record<string, unknown>;
  };
}

// Export financial types
export * from './financial';
export * from './booking';