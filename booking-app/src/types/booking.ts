export type FlightType = 'one-way' | 'return' | 'multi-city';
export type BookingClass = 'economy' | 'premium-economy' | 'business' | 'first';
export type SeatPreference = 'aisle' | 'window' | 'middle' | 'no-preference';

export interface FlightSegment {
  flightNumber: string;
  airline: string;
  airlineCode: string;
  departureAirport: string;
  departureAirportCode: string;
  departureTime: string;
  departureTerminal?: string;
  arrivalAirport: string;
  arrivalAirportCode: string;
  arrivalTime: string;
  arrivalTerminal?: string;
  duration: number; // in minutes
  bookingClass: BookingClass;
  seatNumber?: string;
  baggageAllowance?: {
    cabin: string;
    checked: string;
  };
  mealService?: boolean;
  aircraftType?: string;
}

export interface EnhancedFlightDetails {
  flightType: FlightType;
  outboundFlight?: FlightSegment;
  returnFlight?: FlightSegment;
  multiCitySegments?: FlightSegment[];
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  totalPrice: number;
  priceBreakdown?: {
    baseFare: number;
    taxes: number;
    fees: number;
    extras?: {
      seatSelection?: number;
      extraBaggage?: number;
      meals?: number;
    };
  };
  bookingReference?: string;
  pnr?: string;
}

export interface EnhancedHotelDetails {
  hotelName: string;
  hotelChain?: string;
  hotelRating: number;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  checkIn: {
    date: string;
    time: string;
  };
  checkOut: {
    date: string;
    time: string;
  };
  nights: number;
  roomType: string;
  roomDescription?: string;
  bedConfiguration?: string;
  maxOccupancy: number;
  guests: {
    adults: number;
    children: number;
    childrenAges?: number[];
  };
  mealPlan?: 'room-only' | 'breakfast' | 'half-board' | 'full-board' | 'all-inclusive';
  amenities?: string[];
  cancellationPolicy?: string;
  totalPrice: number;
  priceBreakdown?: {
    roomRate: number;
    taxes: number;
    fees: number;
    extras?: {
      breakfast?: number;
      parking?: number;
      wifi?: number;
    };
  };
  confirmationNumber?: string;

  // Cost tracking fields (for markup + profit calculation)
  supplierCost?: number;    // What we pay the supplier (HotelBeds, etc.)
  clientPrice?: number;     // What client pays (supplierCost + markup)
  profit?: number;          // Profit amount (clientPrice - supplierCost)
}

export interface EnhancedActivityDetails {
  activityName: string;
  provider: string;
  location: {
    address: string;
    city: string;
    meetingPoint?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  date: string;
  startTime: string;
  endTime?: string;
  duration: number; // in minutes
  category: 'tour' | 'attraction' | 'experience' | 'adventure' | 'cultural' | 'dining';
  description: string;
  included?: string[];
  excluded?: string[];
  participants: {
    adults: number;
    children: number;
    childrenAges?: number[];
  };
  pricePerPerson: number;
  totalPrice: number;
  cancellationPolicy?: string;
  confirmationNumber?: string;
  voucherRequired?: boolean;
  instantConfirmation?: boolean;
}

export interface EnhancedTransferDetails {
  transferType: 'airport' | 'hotel' | 'point-to-point' | 'hourly';
  vehicleType: 'sedan' | 'suv' | 'van' | 'minibus' | 'luxury';
  vehicleDescription?: string;
  capacity: number;
  pickup: {
    location: string;
    address?: string;
    date: string;
    time: string;
    flightNumber?: string;
    instructions?: string;
  };
  dropoff: {
    location: string;
    address?: string;
    estimatedTime?: string;
  };
  duration?: number; // in minutes
  distance?: number; // in km
  passengers: number;
  luggage?: {
    large: number;
    small: number;
  };
  driverDetails?: {
    name?: string;
    phone?: string;
    meetingInstructions?: string;
  };
  price: number;
  gratuityIncluded?: boolean;
  confirmationNumber?: string;
}

export interface SearchFilters {
  priceRange?: {
    min: number;
    max: number;
  };
  airlines?: string[];
  hotelChains?: string[];
  hotelRating?: number;
  stops?: 'nonstop' | 'one-stop' | 'any';
  departureTime?: 'morning' | 'afternoon' | 'evening' | 'night';
  duration?: {
    min: number;
    max: number;
  };
  amenities?: string[];
}

export interface APISearchRequest {
  type: 'flight' | 'hotel' | 'activity' | 'transfer';
  origin?: string;
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  rooms?: number;
  passengers?: {
    adults: number;
    children: number;
    infants: number;
  };
  filters?: SearchFilters;
}

export interface APISearchResponse<T> {
  success: boolean;
  data?: T[];
  error?: string;
  metadata?: {
    totalResults: number;
    searchId: string;
    timestamp: string;
  };
}

export interface BookingConfirmation {
  bookingId: string;
  bookingReference: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  items: Array<{
    type: 'flight' | 'hotel' | 'activity' | 'transfer';
    confirmationNumber: string;
    details: EnhancedFlightDetails | EnhancedHotelDetails | EnhancedActivityDetails | EnhancedTransferDetails;
  }>;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  customerDetails: {
    name: string;
    email: string;
    phone: string;
  };
}